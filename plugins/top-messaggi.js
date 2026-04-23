import pkg from '@realvare/baileys';
const { generateWAMessageFromContent, proto } = pkg;

let handler = async (m, { conn, args }) => {
    let users = global.db.data.users
    let type = args[0]?.toLowerCase() === 'gruppo' ? 'gruppo' : 'globale'
    let list = []
    let pfp
    let titleHeader

    if (type === 'gruppo') {
        let groupMetadata = await conn.groupMetadata(m.chat)
        let participants = groupMetadata.participants

        let lidToJidMap = {}
        participants.forEach(p => {
            let rLid = p.lid ? p.lid.split('@')[0] : (p.id?.includes('@lid') ? p.id.split('@')[0] : null)
            let rJid = p.jid ? p.jid.split('@')[0].split(':')[0] : (p.id?.includes('@s.whatsapp.net') ? p.id.split('@')[0].split(':')[0] : null)
            if (rLid && rJid) lidToJidMap[rLid] = rJid
        })

        let resolvedJids = participants.map(p => {
            if (p.jid && p.jid.includes('@s.whatsapp.net')) return p.jid.split(':')[0]
            if (p.id?.includes('@s.whatsapp.net')) return p.id.split(':')[0]
            if (p.id?.includes('@lid')) {
                let lid = p.id.split('@')[0]
                if (lidToJidMap[lid]) return lidToJidMap[lid] + '@s.whatsapp.net'
            }
            return null
        }).filter(Boolean)

        list = resolvedJids
            .map(jid => ({ jid, messages: users[jid]?.messages || 0 }))
            .filter(u => u.messages > 0)
            .sort((a, b) => b.messages - a.messages)

        try {
            pfp = await conn.profilePictureUrl(m.chat, 'image')
        } catch {
            pfp = 'https://i.ibb.co/Gwbg90w/idk17.jpg'
        }

        titleHeader = `🏆 TOP ATTIVITÀ: ${groupMetadata.subject}`
    } else {
        list = Object.keys(users)
            .filter(jid => jid.endsWith('@s.whatsapp.net'))
            .map(jid => ({ jid, messages: users[jid].messages || 0 }))
            .filter(u => u.messages > 0)
            .sort((a, b) => b.messages - a.messages)

        try {
            pfp = await conn.profilePictureUrl(list[0].jid, 'image')
        } catch {
            try {
                pfp = await conn.profilePictureUrl(m.chat, 'image')
            } catch {
                pfp = 'https://i.ibb.co/Gwbg90w/idk17.jpg'
            }
        }

        titleHeader = `🌍 RANKING MESSAGGI: GLOBALE`
    }

    let top = list.slice(0, 5)
    if (top.length === 0) return m.reply('`𐔌📊꒱` _*Nessun dato trovato per questa classifica.*_')

    let info = `╭┈➤ 『 📊 』 *TOP 5 ${type.toUpperCase()}*\n`
    info += top.map((user, i) => {
        let emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '👤'
        return `┆  ${emoji} *${i + 1}.* @${user.jid.split('@')[0]}\n┆  ╰─➤ *${user.messages}* _messaggi_`
    }).join('\n┆\n')
    info += `\n╰┈➤ 『 📦 』 \`annoyed system\``

    await conn.sendMessage(m.chat, {
        text: info,
        contextInfo: {
            mentionedJid: top.map(u => u.jid),
            externalAdReply: {
                title: titleHeader,
                body: `Analisi di ${list.length} utenti attivi`,
                thumbnailUrl: pfp,
                sourceUrl: null,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }, { quoted: m })
}

handler.help = ['topmessaggi', 'topmessaggi gruppo']
handler.tags = ['rpg']
handler.command = /^(topmessaggi|topmsg)$/i
handler.group = true

export default handler