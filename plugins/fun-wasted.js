let handler = async (m, { conn }) => {
    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.id : m.sender
    
    let pp
    try {
        pp = await conn.profilePictureUrl(who, 'image')
    } catch (e) {
        pp = null
    }

    if (pp) {
        let apiUrl = `https://api.some-random-api.com/canvas/overlay/wasted?avatar=${encodeURIComponent(pp)}`
        
        try {
            await conn.sendMessage(m.chat, { 
                image: { url: apiUrl }
            }, { quoted: m })
        } catch (e) {
            await conn.sendMessage(m.chat, { 
                text: '`𐔌❌ ꒱` _Impossibile generare l\'immagine Wasted._' 
            }, { quoted: m })
        }
    } else {
        await conn.sendMessage(m.chat, { 
            text: '`𐔌⚠️ ꒱` _L\'utente non ha una foto profilo pubblica, non posso applicare l\'effetto._' 
        }, { quoted: m })
    }
}

handler.help = ['wasted']
handler.tags = ['fun']
handler.command = /^(wasted)$/i

export default handler