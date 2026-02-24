let handler = async (m, { conn, usedPrefix, command }) => {
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.id : m.sender
    let jailer = m.sender
    
    let pp
    try {
        pp = await conn.profilePictureUrl(who, 'image')
    } catch (e) {
        pp = null
    }

    let mentionText = `@${who.split('@')[0]} sei stato messo in prigione da @${jailer.split('@')[0]}`
    let noPicText = `@${who.split('@')[0]} non ha una foto profilo.`

    if (pp) {
        let apiUrl = `https://api.some-random-api.com/canvas/overlay/jail?avatar=${encodeURIComponent(pp)}`
        
        try {
            await conn.sendMessage(m.chat, { 
                image: { url: apiUrl }, 
                caption: `⛓️ | ${mentionText}`,
                mentions: [who, jailer]
            }, { quoted: m })
        } catch (e) {
            await conn.sendMessage(m.chat, { 
                text: `⛓️ | ${noPicText}`, 
                mentions: [who, jailer] 
            }, { quoted: m })
        }
    } else {
        await conn.sendMessage(m.chat, { 
            text: `⛓️ | ${noPicText}`, 
            mentions: [who, jailer] 
        }, { quoted: m })
    }
}

handler.help = ['jail']
handler.tags = ['fun']
handler.command = /^(jail|prigione)$/i

export default handler