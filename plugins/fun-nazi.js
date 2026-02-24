import axios from 'axios'

let handler = async (m, { conn, usedPrefix, command }) => {
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.id : m.sender
    let percentage = Math.floor(Math.random() * 111)
    
    let pp
    try {
        pp = await conn.profilePictureUrl(who, 'image')
    } catch (e) {
        pp = null
    }

    if (pp) {
        let apiUrl = `https://api.some-random-api.com/canvas/overlay/comrade?avatar=${encodeURIComponent(pp)}`
        
        try {
            await conn.sendMessage(m.chat, { 
                image: { url: apiUrl }, 
                caption: `@${who.split('@')[0]} è comunista al *${percentage}%*`,
                mentions: [who]
            }, { quoted: m })
        } catch (e) {
            await conn.sendMessage(m.chat, { 
                text: `@${who.split('@')[0]} è comunista al *${percentage}%*`, 
                mentions: [who] 
            }, { quoted: m })
        }
    } else {
        await conn.sendMessage(m.chat, { 
            text: `@${who.split('@')[0]} è comunista al *${percentage}%*`, 
            mentions: [who] 
        }, { quoted: m })
    }
}

handler.help = ['comunista']
handler.tags = ['fun']
handler.command = /^(comu|comunista)$/i

export default handler