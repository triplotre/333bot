import { exec } from 'child_process'
import os from 'os'
import fs from 'fs'
import { promisify } from 'util'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const packageJson = require('../package.json')
const execPromise = promisify(exec)

const handler = async (m, { conn, isOwner }) => {
    if (!isOwner) return
    
    const hostname = os.hostname()
    const versione = packageJson.version || '1.0.0'
    const foto = global.immagini[Math.floor(Math.random() * global.immagini.length)]

    if (hostname.startsWith('varehost')) {
        return conn.sendMessage(m.chat, { text: `🚫 ╰┈➤ Comando disabilitato sul *server di produzione*` }, { quoted: m })
    }

    await conn.sendPresenceUpdate('composing', m.chat)
    
    try {
        const gitUrl = 'https://github.com/annoyed/annoyed.git'
        
        const responseStart = `
  ╭┈  『 🔄 』 ` + "`stato` ─ " + ` *_In corso..._*
  ┆  『 📂 』 ` + "`target` ─ " + ` */plugins*
  ╰┈➤ 『 📦 』 ` + "`versione` ─ " + ` *_${versione}_*
  `.trim()

        await conn.sendMessage(m.chat, { text: responseStart }, { quoted: m })

        if (fs.existsSync('./plugins')) {
            fs.rmSync('./plugins', { recursive: true, force: true })
        }
        fs.mkdirSync('./plugins', { recursive: true })

        await execPromise(`git clone ${gitUrl} temp_plugins && cp -r temp_plugins/plugins/* ./plugins/ && rm -rf temp_plugins`)

        const responseEnd = `
  ╭┈  『 ✅ 』 ` + "`aggiornamento` ─ " + ` *_Completato_*
  ┆  『 🖥️ 』 ` + "`host` ─ " + ` *_${hostname}_*
  ╰┈➤ 『 🐉 』 ` + "`status` ─ " + ` *_Sincronizzato_*
  `.trim()

        await conn.sendMessage(m.chat, {
            text: responseEnd,
            contextInfo: {
                ...global.newsletter().contextInfo,
                externalAdReply: {
                    title: `annoyed v${versione} • Update`,
                    body: `Plugin aggiornati con successo`,
                    renderLargerThumbnail: false,
                    thumbnailUrl: foto,
                    mediaType: 1
                }
            }
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { text: `❌ ╰┈➤ Errore Git: \`${e.message}\`` }, { quoted: m })
    }
}

handler.command = ['aggiorna', 'update']
handler.rowner = true

export default handler