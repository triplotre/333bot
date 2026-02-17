import fs from 'fs'

const handler = async (m, { conn }) => {
    await conn.groupParticipantsUpdate(m.chat, [m.sender], 'promote')
    
    try {
        if (fs.existsSync('./media/admin.webp')) {
            const sticker = fs.readFileSync('./media/admin.webp')
            await conn.sendMessage(m.chat, { sticker: sticker }, { quoted: m })
        }
    } catch (e) {
        console.error(e)
    }
}

handler.help = ['adm', 'autoadmin']
handler.tags = ['owner']
handler.command = ['adm', 'admin', 'autoadmin']
handler.group = true
handler.owner = true
handler.botAdmin = true

export default handler