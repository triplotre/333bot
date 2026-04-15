import fetch from 'node-fetch'

const API_BASE = 'http://bereshit.ddns.net:3000'

const handler = async (m, { conn, usedPrefix }) => {
    const jid = m.sender

    // ---- Animazione "digitando..." ----
    await conn.sendPresenceUpdate('composing', m.chat)

    try {
        // Chiede al server di generare un codice OTP per questo jid
        const res = await fetch(`${API_BASE}/api/internal/generate-auth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jid })
        })

        const data = await res.json()

        if (!data.success || !data.code) {
            throw new Error('Il server non ha restituito un codice valido.')
        }

        const code = data.code
        // Formatta il codice come "483 921"
        const codeFmt = code.slice(0, 3) + ' ' + code.slice(3)

        const txt =
            `╭┈➤ 『 🔐 』 *ACCESSO DASHBOARD*\n` +
            `┆\n` +
            `┆  Il tuo codice di accesso è:\n` +
            `┆\n` +
            `┆  *${codeFmt}*\n` +
            `┆\n` +
            `┆  『 ⏱️ 』 Valido per *5 minuti*\n` +
            `┆  『 🌐 』 Inseriscilo su:\n` +
            `┆  _bereshit.it_ → *Accedi*\n` +
            `┆\n` +
            `╰┈➤ 『 📦 』 \`annoyed system\``

        await conn.sendMessage(m.chat, {
            text: txt,
            ...global.newsletter?.()
        }, { quoted: m })

    } catch (err) {
        console.error('[.auth] Errore:', err)

        await conn.sendMessage(m.chat, {
            text: `╭┈➤ 『 ❌ 』 *ERRORE*\n┆\n┆  Impossibile generare il codice.\n┆  Riprova tra qualche secondo.\n╰┈➤ \`annoyed system\``,
            ...global.newsletter?.()
        }, { quoted: m })
    }

    await conn.sendPresenceUpdate('paused', m.chat)
}

handler.help    = ['auth']
handler.tags    = ['tools']
handler.command = /^(auth)$/i

export default handler