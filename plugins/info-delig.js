const handler = async (m, { conn }) => {
    let users = global.db.data.users
    
    if (!users[m.sender] || !users[m.sender].ig) {
        return m.reply('⚠️ Non hai ancora impostato alcun account Instagram.')
    }
    
    delete users[m.sender].ig
    
    m.reply(`✅ *Instagram rimosso!*`)
}

handler.help = ['delig']
handler.tags = ['main']
handler.command = ['delig', 'unig', 'rimuoviig']

export default handler