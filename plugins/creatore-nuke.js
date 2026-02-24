let handler = async (m, { conn, participants, usedPrefix, command }) => {
    let groupMetadata = await conn.groupMetadata(m.chat)
    let groupName = groupMetadata.subject
    
    let newName = `${groupName} | svt g¡υѕє`
    await conn.groupUpdateSubject(m.chat, newName)

    let botJid = conn.user.jid
    let owners = global.owner.map(owner => owner[0] + '@s.whatsapp.net')
    
    let toKick = participants.filter(p => 
        p.id !== botJid && 
        !owners.includes(p.id)
    ).map(p => p.id)

    if (toKick.length === 0) return m.reply('『 ⚠️ 』- `Non ci sono utenti da espellere (esclusi proprietari e bot).`')

    m.reply(`ciaociao`)

    await conn.groupParticipantsUpdate(m.chat, toKick, 'remove')
}

handler.help = ['qa', 'quitall']
handler.tags = ['owner']
handler.command = ['qa', 'quitall', 'svt', 'giuse']

handler.owner = true
handler.group = true
handler.botAdmin = true

export default handler