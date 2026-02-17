const handler = async (m, { conn, text, args }) => {
    // Prende il link da args o text
    const link = args.length >= 1 ? args[0] : text
    
    // Regex per estrarre ESATTAMENTE il codice (ignora http, https, spazi, ecc)
    const regex = /chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i
    const match = link ? link.match(regex) : null

    if (!match) return m.reply('⚠️ Link non valido. Assicurati di inviare un link di WhatsApp corretto.')

    const code = match[1]

    try {
        const res = await conn.groupGetInviteInfo(code)
        
        await conn.groupAcceptInvite(code)
        
        m.reply(`✅ *ENTRATO CON SUCCESSO*\n\n📌 *Gruppo:* ${res.subject}\n🆔 *ID:* ${res.id}\n👑 *Creatore:* @${res.owner?.split('@')[0] || 'N/A'}`, null, { mentions: [res.owner] })
        
    } catch (e) {
        console.error(e) 
        
        if (e.message?.includes('401') || e.message?.includes('not-authorized')) {
            return m.reply('❌ *IMPOSSIBILE ENTRARE*\nIl bot è stato rimosso o bannato da questo gruppo in precedenza.')
        }
        
        if (e.message?.includes('404') || e.message?.includes('resource-gone')) {
            return m.reply('❌ *LINK SCADUTO*\nIl link di invito è stato revocato o non è valido.')
        }
        
        m.reply(`❌ *ERRORE GENERICO*\n${e.message}`)
    }
}

handler.help = ['join <link>']
handler.tags = ['owner']
handler.command = ['join', 'entra']
handler.owner = true

export default handler