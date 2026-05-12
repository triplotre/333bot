let handler = async (m, { text, usedPrefix, command }) => {
    let user = global.db.data.users[m.sender]
    user.afk = + new Date()
    user.afkReason = text || 'Nessuna motivazione'
    
    let setMsgs = [
        `╭┈➤ 『 💤 』 *AFK ATTIVATO*\n┆  『 📝 』 *Motivo:* ${user.afkReason}\n╰┈➤ \`annoyed system\``,
        `╭┈➤ 『 😴 』 *STATO AFK*\n┆  Ho attivato l'AFK per te.\n┆  『 📝 』 *Motivo:* ${user.afkReason}\n╰┈➤ \`annoyed system\``
    ]
    
    await m.reply(setMsgs[Math.floor(Math.random() * setMsgs.length)])
}

handler.help = ['afk <motivazione>']
handler.tags = ['main']
handler.command = ['afk']

export default handler