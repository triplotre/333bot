import fs from 'fs'
import path from 'path'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const q = global.fakecontact ? global.fakecontact(m) : m
    const extra = global.rcanal ? global.rcanal() : (global.newsletter ? global.newsletter() : {})

    if (!text) {
        return conn.sendMessage(m.chat, {
            text: `╭┈  『 ⚠️ 』 \`errore\`\n┆  Inserisci il nome del plugin.\n╰┈➤ Esempio: *${usedPrefix + command} menu*`,
            ...extra
        }, { quoted: q })
    }
    
    let code = ''
    if (m.quoted) {
        const qMsg = m.quoted.message || m.quoted
        code = m.quoted.text || qMsg.conversation || qMsg.extendedTextMessage?.text || ''
    }

    if (!code) {
        return conn.sendMessage(m.chat, {
            text: `╭┈  『 ⚠️ 』 \`errore\`\n╰┈➤ Devi rispondere al codice del plugin da salvare.`,
            ...extra
        }, { quoted: q })
    }

    const name = text.endsWith('.js') ? text : `${text}.js`
    const pluginPath = path.join(process.cwd(), 'plugins', name)
    
    fs.writeFileSync(pluginPath, code)

    const textMsg = `╭┈  『 💾 』 \`plugins\` ─ *SALVATAGGIO*\n┆  『 📄 』 \`file\` ─ *${name}*\n╰┈➤ 『 ✅ 』 \`stato\` ─ *Salvato con successo*`

    await conn.sendMessage(m.chat, {
        text: textMsg,
        ...extra
    }, { quoted: q })
}

handler.help = ['savepl <nome>']
handler.tags = ['owner']
handler.command = ['savepl', 'saveplugin']
handler.owner = true

export default handler
