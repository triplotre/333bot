import './config.js'
import { join } from 'path'
import { pathToFileURL } from 'url'
import fs, { readdirSync, watchFile, unwatchFile } from 'fs'
import pino from 'pino'
import chalk from 'chalk'
import { makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, Browsers, fetchLatestBaileysVersion, normalizeJid, toJid } from '@realvare/based'
import { handler } from './handler.js'
import printLog from './lib/print.js'

const { state, saveCreds } = await useMultiFileAuthState(global.authFile || 'zexin-session')
const { version } = await fetchLatestBaileysVersion()

async function startZexin() {
    const conn = makeWASocket({
        version,
        logger: pino({ level: 'silent' }),
        printQRInTerminal: true,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' })),
        },
        browser: Browsers.macOS('Desktop'),
        shouldIgnoreOldMessages: true,
        syncFullHistory: false 
    })

    global.conn = conn

    conn.decodeJid = (jid) => {
        if (!jid) return jid
        return normalizeJid(jid) 
    }

    conn.ev.on('connection.update', (u) => {
        if (u.connection === 'open') console.log(chalk.magentaBright(`\n  ────୨ৎ────\n  ➤  ZEXIN ONLINE \n  ────୨ৎ────\n`))
        if (u.connection === 'close') startZexin()
    })

    conn.ev.on('creds.update', saveCreds)

    conn.ev.on('messages.upsert', async (chatUpdate) => {
        if (chatUpdate.type !== 'notify') return 
        const m = chatUpdate.messages[0]
        if (!m || !m.message) return
        await printLog(m, conn)
        await handler.call(conn, chatUpdate)
    })
}

global.plugins = {}
global.loadPlugins = async function () {
    const files = readdirSync('./plugins').filter(f => f.endsWith('.js'))
    for (let file of files) {
        try {
            const fpath = join('./plugins', file)
            const furl = pathToFileURL(fpath).href
            const module = await import(`${furl}?update=${Date.now()}`)
            global.plugins[file] = module.default || module
            watchFile(fpath, async () => {
                unwatchFile(fpath)
                const newModule = await import(`${furl}?update=${Date.now()}`)
                global.plugins[file] = newModule.default || newModule
            })
        } catch (e) {}
    }
}

global.loadPlugins().then(() => startZexin())