let handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) return m.reply(`\`𐔌⚠️ ꒱\` _Inserisci il nuovo nome._\n\n_Esempio: ${usedPrefix + command} annoyed._`)

    try {
        await conn.updateProfileName(text)
        m.reply(`\`𐔌✅ ꒱\` _Nome aggiornato in:_ *${text}*`)
    } catch (e) {
        console.error(e)
        m.reply(`\`𐔌❌ ꒱\` _Errore durante il cambio nome._`)
    }
}

handler.help = ['nomebot <testo>']
handler.tags = ['owner']
handler.command = /^(nomebot|setnamebot|botname)$/i
handler.owner = true

export default handler