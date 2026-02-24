let handler = async (m, { conn, text }) => {
    let rawUser = m.quoted ? (m.quoted.sender || m.quoted.participant) : (m.mentionedJid && m.mentionedJid[0]) ? m.mentionedJid[0] : text ? text : null
    if (!rawUser) return

    let cleanNumber = rawUser.replace(/[^0-9]/g, '')
    const groupMetadata = await conn.groupMetadata(m.chat)
    const groupParticipants = groupMetadata.participants

    let victim = groupParticipants.find(p => 
        (p.id && p.id.includes(cleanNumber)) || 
        (p.lid && p.lid.includes(cleanNumber))
    )

    if (!victim) return m.reply('『 ❌ 』- `Utente non trovato.`')

    const myJid = conn.user && conn.user.jid ? conn.user.jid.replace(/[^0-9]/g, '') : ''
    const owners = (global.owner || []).map(o => String(o[0]).replace(/[^0-9]/g, ''))
    let victimJidNum = victim.id ? victim.id.replace(/[^0-9]/g, '') : ''
    let victimLidNum = victim.lid ? victim.lid.replace(/[^0-9]/g, '') : ''

    if (victimJidNum === myJid || victimLidNum === myJid) return m.reply('『 🤖 』- `Non posso auto-espellermi.`')
    if (owners.includes(victimJidNum) || owners.includes(victimLidNum)) return m.reply('『 👑 』- `Non posso espellere un proprietario.`')

    try {
        await conn.groupParticipantsUpdate(m.chat, [victim.id], 'remove')
        m.reply(`qualcuno ha fatto una brutta fine 🤔`, null, { mentions: [victim.id] })
    } catch (e) {
        try {
            let altId = victim.lid || victim.jid
            if (altId && altId !== victim.id) await conn.groupParticipantsUpdate(m.chat, [altId], 'remove')
        } catch (err) {
            m.reply('『 ❌ 』- `Errore durante l\'espulsione.`')
        }
    }
}

handler.help = ['kick']
handler.tags = ['admin']
handler.command = ['kick', 'k', 'rimuovi', 'espelli']
handler.admin = true
handler.group = true
handler.botAdmin = true

export default handler