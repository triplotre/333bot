import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, usedPrefix }) => {
    const dbPath = path.resolve('./media/attivita.json')
    if (!fs.existsSync(dbPath)) return m.reply('🏮 Nessun dato di attività registrato.')

    const db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    const user = db[m.sender]

    if (!user) return m.reply('🏮 Non hai ancora dati di attività.')

    const totalSeconds = user.secondi
    const ore = Math.floor(totalSeconds / 3600)
    const minuti = Math.floor((totalSeconds % 3600) / 60)
    const secondi = totalSeconds % 60

    const secondiMancanti = 3600 - (totalSeconds % 3600)
    const minMancanti = Math.floor(secondiMancanti / 60)
    const secMancanti = secondiMancanti % 60

    let caption = `╭┈➤ 『 📊 』 *STATISTICHE UTENTE*\n`
    caption += `┆  『 👤 』 \`utente\` ─ @${m.sender.split('@')[0]}\n`
    caption += `┆  『 🕒 』 \`attività\` ─ ${ore}h ${minuti}m ${secondi}s\n`
    caption += `┆  『 🚀 』 \`prossima ora\` ─ tra ${minMancanti}m ${secMancanti}s\n`
    caption += `╰┈➤ 『 📦 』 \`annoyed system\``

    await conn.sendMessage(m.chat, {
        text: caption,
        mentions: [m.sender],
        contextInfo: {
            ...global.newsletter().contextInfo,
            externalAdReply: {
                title: 'ATTIVITÀ UTENTE',
                body: `annoyed Tracking System`,
                thumbnailUrl: await conn.profilePictureUrl(m.sender, 'image').catch(() => 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png'),
                sourceUrl: global.canale.link,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m })
}

handler.command = ['stats', 'attivita']
export default handler