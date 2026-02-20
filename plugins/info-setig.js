const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`⚠️ Per impostare il tuo instagram, inserisci il tuo username di Instagram.\n\nEsempio:\n*${usedPrefix + command} zyklonbot*`)
    
    let users = global.db.data.users
    if (!users[m.sender]) users[m.sender] = { messages: 0, warns: {} }
    
    let ig = text.replace(/(https?:\/\/)?(www\.)?instagram\.com\//ig, '').replace(/@/g, '').split('?')[0].trim()
    
    users[m.sender].ig = ig
    
    m.reply(`✅ *Instagram impostato!*\nNel tuo profilo ora apparirà: instagram.com/${ig}`)
}

handler.help = ['setig <username>']
handler.tags = ['main']
handler.command = ['setig', 'ig']

export default handler