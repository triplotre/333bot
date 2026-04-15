import fs from 'fs'

const handler = async (m, { conn }) => {
    if (!m.quoted) throw '『 ⚠️ 』- `Rispondi al messaggio di cui vuoi ottenere il codice RAW.`'

    try {
        // Estraiamo l'oggetto del messaggio citato
        const rawMessage = m.quoted.message

        // Lo convertiamo in stringa JSON formattata (indentazione a 2 spazi)
        const jsonRaw = JSON.stringify(rawMessage, null, 2)

        // Creiamo un nome file temporaneo basato sull'ID del messaggio
        const fileName = `raw_${m.quoted.id}.json`

        // Inviamo il contenuto come file di testo/json
        await conn.sendMessage(m.chat, {
            document: Buffer.from(jsonRaw),
            mimetype: 'application/json',
            fileName: fileName,
            caption: `╭┈  『 🛠️ 』 \`debug raw\`\n┆  『 🆔 』 \`id\` ─ *${m.quoted.id}*\n┆  『 📑 』 \`tipo\` ─ *${m.quoted.mtype}*\n╰┈➤ 『 📦 』 \`annoyed system\``
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('❌ Si è verificato un errore durante la generazione del file RAW.')
    }
}

handler.help = ['toraw']
handler.tags = ['owner', 'tools']
handler.command = /^(toraw|raw|json)$/i
handler.owner = true // Solo tu puoi vedere le strutture interne per sicurezza

export default handler