let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`*Utilizzo:* ${usedPrefix + command} <messaggio bot> <@tag o numero> <messaggio quote>`)

    let mJid
    let input = text.split(' ')
    let tagMatch = text.match(/@(\d+)/)
    let numberMatch = text.match(/(\d{10,15})/)

    if (m.mentionedJid && m.mentionedJid[0]) {
        mJid = m.mentionedJid[0]
    } else if (tagMatch) {
        mJid = tagMatch[1] + '@s.whatsapp.net'
    } else if (numberMatch) {
        mJid = numberMatch[1] + '@s.whatsapp.net'
    }

    if (!mJid) return m.reply(`Indica un tag o un numero di telefono valido per creare il fake quote.`)

    let identifier = mJid.split('@')[0]
    let regex = new RegExp(`(?:@${identifier}|${identifier})`, 'i')
    let parts = text.split(regex)
    
    if (parts.length < 2) return m.reply(`Assicurati di inserire il messaggio del bot prima del tag/numero e quello del quote dopo.`)

    let botMsg = parts[0].trim()
    let quoteMsg = parts.slice(1).join(identifier).trim()

    if (!botMsg || !quoteMsg) return m.reply(`*Esempio:* ${usedPrefix + command} messaggio bot @tag messaggio quote`)

    let fakeObj = {
        key: {
            participant: mJid,
            remoteJid: m.chat,
            fromMe: false,
            id: 'FAKE' + Math.random().toString(36).toUpperCase()
        },
        message: {
            conversation: quoteMsg
        }
    }

    await conn.sendMessage(m.chat, { text: botMsg }, { quoted: fakeObj })
}

handler.help = ['fakec <msg bot> <@tag/numero> <msg quote>']
handler.tags = ['owner']
handler.command = ['fakec']
handler.owner = true

export default handler