import pkg from "@realvare/baileys";
const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers,
    jidNormalizedUser,
    makeCacheableSignalKeyStore
} = pkg;

import pino from "pino";
import fs from "fs";
import path from "path";
import chalk from "chalk";
import qrcode from "qrcode-terminal";
import { pathToFileURL } from 'url';
import { clear } from "console";
import handler, { initDatabase, handleStub } from "./handler.js";
import { eventsUpdate } from "./funzioni/admin/welcome-addio.js";
import { antinukeEvent } from "./funzioni/admin/antinuke.js";
import { groupUpdate as permessiUpdate } from "./funzioni/admin/permessi.js";
import { checkConfig } from './lib/configInit.js';
import { setupWatcher } from './lib/watcher.js';
import { registerAutoAccept } from './handler.js';
import { startCleaner } from './lib/cleaner.js';

process.env.NODE_NO_WARNINGS = '1';

process.on('uncaughtException', (err) => {
    if (err.message.includes('Connection Closed') || err.message.includes('Stream Errored')) return;
    console.error(chalk.red('\n[ FATAL ERROR ]'), err);
});

const question = (t) => {
    process.stdout.write(t);
    return new Promise((resolve) => {
        process.stdin.once('data', (data) => resolve(data.toString().trim()));
    });
};

const centerText = (text) => {
    const cols = process.stdout.columns || 80;
    return text.split('\n').map(line => {
        const visible = line.replace(/\x1b\[[0-9;]*m/g, '');
        const pad = Math.max(0, Math.floor((cols - visible.length) / 2));
        return ' '.repeat(pad) + line;
    }).join('\n');
};

const printHeader = () => {
    clear();
    const logo = chalk.magenta(`
██╗  ██╗██╗  ██╗██╗  ██╗    ██████╗  ██████╗ ████████╗    
██║  ██║██║  ██║██║  ██║    ██╔══██╗██╔═══██╗╚══██╔══╝    
███████║███████║███████║    ██████╔╝██║   ██║   ██║       
╚════██║╚════██║╚════██║    ██╔══██╗██║   ██║   ██║       
     ██║     ██║     ██║    ██████╔╝╚██████╔╝   ██║       
     ╚═╝     ╚═╝     ╚═╝    ╚═════╝  ╚═════╝    ╚═╝       
`);
    const made = chalk.gray('made by @troncarlo');
    console.log(centerText(logo));
    console.log(centerText(made));
    console.log();
};

const newsletterJid = '120363408303414353@newsletter';

let isRestarting = false;

async function startBot() {
    if (isRestarting) return;

    printHeader();

    checkConfig();
    await import(`./config.js?update=${Date.now()}`);
    initDatabase();

    const authFolder = `./${global.authFile || 'sessione'}`;
    const { state, saveCreds } = await useMultiFileAuthState(authFolder);
    const { version } = await fetchLatestBaileysVersion();

    const needsAuth = !state.creds.registered && !fs.existsSync(path.join(authFolder, 'creds.json'));

    let opzione = null;
    let phoneNumber = null;

    if (needsAuth) {
        while (true) {
            console.log(chalk.cyan(`\nBenvenuto/a in 444bot! Opzioni disponibili:\n[ 1 ] QR Code\n[ 2 ] Pairing Code\n`));
            opzione = await question(chalk.yellow('Scegli per collegare: '));
            if (opzione === '1' || opzione === '2') break;
            console.log(chalk.red('\nSono concessi solo numero 1 e 2'));
        }

        if (opzione === '2') {
            phoneNumber = await question(chalk.cyan('\nNumero (es. 39...): '));
            phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        }
    }

    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "silent" })),
        },
        browser: Browsers.macOS('Firefox', '1.0.0', '444bot'),
        generateHighQualityLinkPreview: true,
        syncFullHistory: false,
        shouldSyncHistoryMessage: () => false,
        connectTimeoutMs: 60000,
        keepAliveIntervalMs: 10000
    });

    conn.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) return jidNormalizedUser(jid);
        return jid;
    };

    registerAutoAccept(conn);

    const pluginsFolder = path.join(process.cwd(), 'plugins');
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

    setupWatcher(pluginsFolder);

    const scheduleRestart = (delay = 5000) => {
        if (isRestarting) return;
        isRestarting = true;
        conn.ev.removeAllListeners();
        setTimeout(() => {
            isRestarting = false;
            startBot();
        }, delay);
    };

    let pairingRequested = false;

    conn.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && needsAuth && opzione === '2' && phoneNumber && !pairingRequested) {
            pairingRequested = true;
            try {
                const codeBot = await conn.requestPairingCode(phoneNumber, '4444BBOT');
                console.log(chalk.white('\nCodice: ') + chalk.black.bgWhite.bold(` ${codeBot} `) + '\n');
            } catch (err) {
                console.error(chalk.red('[PAIRING ERROR]'), err);
            }
            return;
        }

        if (qr && needsAuth && opzione === '1') {
            console.log(chalk.yellow('\n[ QR ] Scansiona il codice qui sotto:'));
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            if (needsAuth) printHeader();
            console.log(
                chalk.green.bold('\n[ ONLINE ] ') + chalk.white('CONNESSIONE RIUSCITA!\n') +
                chalk.green.bold('[ ONLINE ] ') + chalk.white('github.com/troncarlo - t.me/troncarlo ')
            );
            try { await conn.newsletterFollow(newsletterJid); } catch (e) {}
            startCleaner(conn);
            return;
        }

        if (connection === 'close') {
            const reason =
                lastDisconnect?.error?.output?.statusCode ||
                lastDisconnect?.error?.output?.payload?.statusCode;

            if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.red('\n[ SESSION ] Disconnesso da WhatsApp, elimino i file...'));
                try { fs.rmSync(authFolder, { recursive: true, force: true }); } catch (e) {}
                scheduleRestart(0);
            } else {
                console.log(chalk.yellow(`\n[ RECONNECT ] Tentativo tra 5s... (reason: ${reason})`));
                scheduleRestart(5000);
            }
        }
    });

    conn.ev.on('creds.update', saveCreds);

    conn.ev.on('group-participants.update', async (anu) => {
        try { await eventsUpdate(conn, anu); } catch (e) {}
        try { await antinukeEvent(conn, anu); } catch (e) {}
        try { await permessiUpdate(conn, anu); } catch (e) {}
    });

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        if (!chatUpdate.messages?.[0]) return;
        const m = chatUpdate.messages[0];

        if (!m.message && m.messageStubType) {
            try { await handleStub(conn, m); } catch (e) { console.error(chalk.red('[STUB ERROR]'), e); }
            return;
        }

        if (m.key.fromMe || !m.message) return;
        try {
            await handler(conn, m);
        } catch (e) { console.error(chalk.red('[HANDLER ERROR]'), e); }
    });

    return conn;
}

startBot();

try {
    const { startDashboard } = await import('./api.js');
    startDashboard();
} catch (e) {
    if (e.code !== 'ERR_MODULE_NOT_FOUND') console.error(chalk.red('[DASHBOARD ERROR]'), e);
}