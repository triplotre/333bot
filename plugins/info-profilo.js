import fs from 'fs'

const loadJson = (path) => {
    try { return JSON.parse(fs.readFileSync(path, 'utf-8')) } catch { return {} }
}

const handler = async (m, { conn, usedPrefix }) => {
    const jid = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender)
    const isSelf = jid === m.sender
    
    const nomeUtente = (jid === m.sender) ? m.pushName : (conn.getName ? await conn.getName(jid) : jid.split('@')[0])
    
    const walletDb = loadJson('./media/wallet.json')
    const livelliDb = loadJson('./media/livelli.json')
    const compleanniDb = loadJson('./media/compleanni.json')
    const usersDb = global.db.data.users || {}

    const userData = usersDb[jid] || {}
    const userWallet = walletDb[jid] || { money: 0, bank: 0 }
    const userLvl = livelliDb[jid] || { level: 1, xp: 0 }

    const totalCash = (userWallet.money || 0) + (userWallet.bank || 0)
    const compleanno = compleanniDb[jid] ?? 'Non impostato'
    
    let globalRank = (Object.entries(usersDb)
        .filter(([id, data]) => id.endsWith('@s.whatsapp.net') && (data.messages > 0))
        .sort((a, b) => (b[1].messages || 0) - (a[1].messages || 0))
        .findIndex(([id]) => id === jid) + 1) || 'N/A'

    const bio = loadJson('./media/descrizioni.json')[jid] ?? 'Nessuna descrizione impostata.'
    const genere = loadJson('./media/genere.json')[jid] ?? 'N/A'
    const lingua = loadJson('./media/lingua.json')[jid] ?? 'Italiano'
    const genereIcon = genere.toLowerCase() === 'maschio' ? '♂️' : genere.toLowerCase() === 'femmina' ? '♀️' : 'N/A'

    const level = userLvl.level || 1
    const currentExp = userLvl.xp || 0
    const nextExp = level * 50
    const expPercent = Math.min(100, Math.floor((currentExp / nextExp) * 100))

    const fmt = n => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : String(n)

    const fakeContact = {
        key: { fromMe: false, participant: jid, remoteJid: 'status@broadcast' },
        message: {
            contactMessage: {
                displayName: nomeUtente,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${nomeUtente};;;\nFN:${nomeUtente}\nTEL;type=CELL;type=VOICE;waid=${jid.split('@')[0]}:+${jid.split('@')[0]}\nEND:VCARD`
            }
        }
    }

    let info = `╭┈➤ 『 📊 』 *STATISTICHE*\n`
    info += `┆  『 🆙 』 \`livello\` ─ *${level}*\n`
    info += `┆  『 ✨ 』 \`xp\` ─ *${currentExp}/${nextExp}* (_${expPercent}%_)\n`
    info += `┆  『 💬 』 \`messaggi\` ─ *${fmt(userData.messages || 0)}*\n`
    info += `┆  『 📈 』 \`rank\` ─ *#${globalRank}*\n`
    info += `┆\n`
    info += `╭┈➤ 『 🏦 』 *ECONOMIA*\n`
    info += `┆  『 💰 』 \`complessivo\` ─ *${fmt(totalCash)}€*\n`
    info += `┆  『 💵 』 \`contanti\` ─ *${fmt(userWallet.money || 0)}€*\n`
    info += `┆  『 🏛️ 』 \`banca\` ─ *${fmt(userWallet.bank || 0)}€*\n`
    info += `┆\n`
    info += `╭┈➤ 『 👤 』 *INFORMAZIONI*\n`
    
    // Logica dinamica per Instagram
    if (userData.ig) {
        info += `┆  『 📸 』 *instagram.com/${userData.ig}*\n`
    } else {
        info += `┆  『 📸 』 \`ig\` ─ *Non impostato*\n`
    }

    info += `┆  『 🧬 』 \`genere\` ─ *${genereIcon}*\n`
    info += `┆  『 🎂 』 \`bday\` ─ *${compleanno}*\n`
    info += `┆  『 🌐 』 \`lingua\` ─ *${lingua.toUpperCase()}*\n`
    info += `┆\n`
    info += `╭┈➤ 『 📝 』 *BIOGRAFIA*\n`
    info += `┆  _${bio}_\n`
    info += `╰┈➤ 『 📦 』 \`annoyed system\``

    const buttons = isSelf ? [
        { buttonId: `${usedPrefix}settings`, buttonText: { displayText: '⚙️ IMPOSTAZIONI' }, type: 1 },
        { buttonId: `${usedPrefix}topmessaggi globale`, buttonText: { displayText: '📈 TOP MESSAGGI' }, type: 1 },
        { buttonId: `${usedPrefix}topmessaggi gruppo`, buttonText: { displayText: '📈 TOP MESSAGGI GRUPPO' }, type: 1 }
    ] : []

    await conn.sendMessage(m.chat, {
        text: info,
        buttons: buttons,
        headerType: 1,
        mentions: [jid],
        ...global.newsletter()
    }, { quoted: fakeContact })
}

handler.help = ['info', 'profilo']
handler.tags = ['rpg']
handler.command = /^(info|profilo|profile)$/i

export default handler