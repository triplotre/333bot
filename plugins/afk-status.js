/* let handler = m => m
handler.before = async (m, { conn }) => {
    let user = global.db.data.users[m.sender]
    
    if (user && user.afk > -1) {
        let duration = clockString(new Date - user.afk)
        let welcomeMsgs = [
            `╭┈➤ 『 👋 』 *BENTORNATO*\n┆  @${m.sender.split('@')[0]}, sei tornato!\n┆  Ho rimosso il tuo AFK globalmente.\n┆  『 🕒 』 *Eri via da:* ${duration}\n╰┈➤ \`annoyed system\``,
            `╭┈➤ 『 ✨ 』 *RIENTRO AFK*\n┆  Bentornato @${m.sender.split('@')[0]}!\n┆  Il tuo stato AFK è stato rimosso.\n┆  『 🕒 』 *Durata:* ${duration}\n╰┈➤ \`annoyed system\``
        ]
        await conn.sendMessage(m.chat, { 
            text: welcomeMsgs[Math.floor(Math.random() * welcomeMsgs.length)], 
            mentions: [m.sender] 
        }, { quoted: m })
        user.afk = -1
        user.afkReason = ''
    }

    let jids = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])]
    for (let jid of jids) {
        let target = global.db.data.users[jid]
        if (!target || target.afk < 0) continue
        
        let duration = clockString(new Date - target.afk)
        let notifyMsgs = [
            `╭┈➤ 『 ⚠️ 』 *UTENTE AFK*\n┆  @${jid.split('@')[0]} è assente.\n┆  『 🕒 』 *Da:* ${duration}\n┆  『 📝 』 *Motivo:* ${target.afkReason}\n╰┈➤ \`annoyed system\``,
            `╭┈➤ 『 💤 』 *MOMENTANEAMENTE ASSENTE*\n┆  Non disturbare @${jid.split('@')[0]}.\n┆  『 🕒 』 *AFK da:* ${duration}\n┆  『 📝 』 *Motivo:* ${target.afkReason}\n╰┈➤ \`annoyed system\``
        ]
        await conn.sendMessage(m.chat, { 
            text: notifyMsgs[Math.floor(Math.random() * notifyMsgs.length)], 
            mentions: [jid] 
        }, { quoted: m })
    }
    return true
}

export default handler

function clockString(ms) {
    let h = Math.floor(ms / 3600000)
    let m = Math.floor(ms / 60000) % 60
    let s = Math.floor(ms / 1000) % 60
    return `${h}h ${m}m ${s}s`
}
*/