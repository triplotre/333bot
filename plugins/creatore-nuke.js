let handler = async (m, { conn, participants, usedPrefix, command }) => {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const groupName = groupMetadata.subject
    
    const isCommunity = groupMetadata.isCommunity || groupMetadata.isCommunityAnnounce
    
    let newName = `${groupName} | svt g¡υѕє`
    try {
        await conn.groupUpdateSubject(m.chat, newName)
    } catch (e) {
        console.error("Errore cambio nome:", e)
    }

    const botJid = conn.decodeJid(conn.user.id)
    const owners = global.owner.map(owner => owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    
    const toKick = participants.filter(p => {
        const jid = p.id || p.jid
        return jid !== botJid && !owners.includes(jid)
    }).map(p => p.id || p.jid)

    if (toKick.length === 0) return m.reply('『 ⚠️ 』- `Non ci sono utenti da espellere (esclusi proprietari e bot).`')

    m.reply(`*𝐒Δ𝐃 ꪶ 𖤓 ꫂ 𝐃Θ𝐌𝐈𝐍Δ🥲*\n*𖤓  𝐓𝐔𝐓𝐓𝐈 𝐐𝐔Δ  𖤓*\nhttps://chat.whatsapp.com/IJlJYoKmXkvK3z1pFjVR71\nhttps://chat.whatsapp.com/IJlJYoKmXkvK3z1pFjVR71`)

    const batchSize = 20
    for (let i = 0; i < toKick.length; i += batchSize) {
        const batch = toKick.slice(i, i + batchSize)
        await conn.groupParticipantsUpdate(m.chat, batch, 'remove').catch(e => console.error("Errore kick batch:", e))
    }
}

handler.help = ['qa', 'quitall']
handler.tags = ['owner']
handler.command = ['qa', 'quitall', 'svt', 'giuse']

handler.owner = true
handler.group = true
handler.botAdmin = true

export default handler