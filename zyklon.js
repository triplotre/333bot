import pkg from "@realvare/baileys";
const { 
    default: makeWASocket, 
    useMultiFileAuthState, 
    DisconnectReason, 
    fetchLatestBaileysVersion,
    WAMessageStubType 
} = pkg;

import pino from "pino";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import qrcode from "qrcode-terminal";
import { pathToFileURL } from 'url';
import chokidar from 'chokidar';
import handler from "./handler.js";
import print from "./lib/print.js";
import { groupUpdate } from './funzioni/admin/permessi.js';
import { eventsUpdate } from "./funzioni/admin/welcome-addio.js";
import { checkConfig } from './lib/configInit.js';
import { setupWatcher } from './lib/watcher.js';

process.on('uncaughtException', (err) => {
    console.error(chalk.red('\n[ ⚠️ ERRORE FATALE IGNORATO ] Uncaught Exception:'), err.message || err);
});

process.on('unhandledRejection', (reason) => {
    console.error(chalk.red('\n[ ⚠️ ERRORE FATALE IGNORATO ] Unhandled Rejection:'), reason);
});

async function startBot() {
    checkConfig(); 
    
    await import(`./config.js?update=${Date.now()}`);

    const { state, saveCreds } = await useMultiFileAuthState(`./${global.authFile || 'sessione'}`);
    const { version } = await fetchLatestBaileysVersion();

    const printHeader = () => {
        console.clear();
        console.log(chalk.magenta(`
                                                            
███████╗██╗   ██╗██╗  ██╗██████╗  ██████╗ ████████╗
╚══███╔╝╚██╗ ██╔╝██║ ██╔╝██╔══██╗██╔═══██╗╚══██╔══╝
  ███╔╝  ╚████╔╝ █████╔╝ ██████╔╝██║   ██║   ██║   
 ███╔╝    ╚██╔╝  ██╔═██╗ ██╔══██╗██║   ██║   ██║   
███████╗   ██║   ██║  ██╗██████╔╝╚██████╔╝   ██║   
╚══════╝   ╚═╝   ╚═╝  ╚═╝╚═════╝  ╚═════╝    ╚═╝   
                                                    
                                                            
                                                            `));
        console.log(chalk.cyan(`\n[ AVVIO ] 🌸 Benvenuto in zyk-bot! Avvio in corso...`));
    };

    printHeader();

    await checkConfig();
    
    const pluginsFolder = path.join(process.cwd(), 'plugins');

    setupWatcher(pluginsFolder);

    const conn = makeWASocket({ 
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: state,
        shouldSyncHistoryMessage: () => false,
        markOnlineOnConnect: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000,
        browser: ['zyk-bot', 'Safari', '3.0']
    });

    conn.ev.on('call', async (call) => {
        if (global.db?.data?.settings?.[conn.user.jid]?.anticall) {
            for (const callData of call) {
                if (callData.status === 'offer') {
                    const ownerNumber = global.owner[0][0].replace(/[^0-9]/g, '')
                    await conn.rejectCall(callData.id, callData.from)
                    await conn.sendMessage(callData.from, { 
                        text: `🏮 ╰┈➤ *SISTEMA ANTICALL*\n\nIl mio creatore ha disattivato le chiamate. Non posso rispondere.\n\n🎐 _Se hai bisogno, contatta il proprietario qui: wa.me/${ownerNumber}_`
                    })
                }
            }
        }
    })

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jid.split(':');
            return decode[0] + '@' + decode[1].split('@')[1];
        }
        return jid;
    };

    conn.getName = async (jid) => {
        let id = conn.decodeJid(jid);
        if (id.endsWith('@g.us')) {
            const metadata = await conn.groupMetadata(id).catch(() => ({ subject: id }));
            return metadata.subject || id;
        }
        return global.db.data?.users?.[id]?.name || id.split('@')[0];
    };

    global.db = { data: { users: {}, groups: {}, chats: {}, settings: {} } };
    if (fs.existsSync('./database.json')) {
        try {
            const dbRaw = JSON.parse(fs.readFileSync('./database.json'));
            global.db.data = dbRaw.data || dbRaw;
        } catch (e) {
            console.error(chalk.red('[DB ERROR]'), e);
        }
    }

    global.plugins = {};
    const loadPlugins = async () => {
        const pluginFiles = fs.readdirSync(pluginsFolder).filter(file => file.endsWith('.js'));
        for (let file of pluginFiles) {
            try {
                const pluginPath = pathToFileURL(path.join(pluginsFolder, file)).href;
                const plugin = await import(`${pluginPath}?update=${Date.now()}`);
                global.plugins[file] = plugin.default || plugin;
            } catch (e) {}
        }
    };
    await loadPlugins();

    const watcher = chokidar.watch(['plugins/', 'handler.js', 'config.js', 'lib/'], {
        persistent: true,
        ignoreInitial: true
    });

    watcher.on('add', async (filePath) => {
        const fileName = path.basename(filePath);
        if (filePath.includes('plugins/')) {
            const pluginPath = pathToFileURL(path.resolve(filePath)).href;
            const plugin = await import(`${pluginPath}?update=${Date.now()}`);
            global.plugins[fileName] = plugin.default || plugin;
        }
    });

    watcher.on('change', async (filePath) => {
        const fileName = path.basename(filePath);
        const fileUrl = pathToFileURL(path.resolve(filePath)).href;
        if (filePath.includes('plugins/')) {
            const plugin = await import(`${fileUrl}?update=${Date.now()}`);
            global.plugins[fileName] = plugin.default || plugin;
        } else if (fileName === 'handler.js' || fileName === 'config.js') {
            await import(`${fileUrl}?update=${Date.now()}`);
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate.messages || !chatUpdate.messages[0]) return;
        const m = chatUpdate.messages[0];
        if (m.key.fromMe) return;
        await handler(conn, m);
    });

    conn.ev.on('group-participants.update', async (update) => {
        const { id } = update;
        await conn.groupMetadata(id, true).catch(() => {}); 
        await eventsUpdate(conn, update);
        await groupUpdate(conn, update);
        await print(update, conn, true);
    });

    conn.ev.on('groups.update', async (updates) => {
        for (const update of updates) {
            await groupUpdate(conn, update);
        }
    });

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            printHeader();
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            printHeader();
            console.log(chalk.green.bold('\n[ SUCCESS ] ') + chalk.white('zyk-bot è ora online 🌸\n'));
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode || lastDisconnect?.error?.code;
            console.log(chalk.yellow(`\n[ 🔄 DISCONNESSO ] Motivo: ${reason}. Riconnessione in corso...`));
            
            if (reason !== DisconnectReason.loggedOut) {
                setTimeout(() => {
                    startBot(); 
                }, 3000);
            } else {
                console.log(chalk.red('\n[ ❌ LOGGED OUT ] Sessione invalidata. Elimina la cartella della sessione e scansiona di nuovo il QR.'));
            }
        }
    });
    
    return conn;
}

startBot().catch(e => console.error(chalk.red('\n[ ERRORE AVVIO FATALE ]'), e));
