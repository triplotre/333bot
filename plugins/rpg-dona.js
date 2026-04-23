import fs from 'fs'
import path from 'path'

const walletPath = path.join(process.cwd(), 'media/wallet.json')

const getWallet = () => {
    if (!fs.existsSync(walletPath)) return {}
    try { return JSON.parse(fs.readFileSync(walletPath, 'utf-8')) } catch { return {} }
}

const saveWallet = (data) => {
    fs.writeFileSync(walletPath, JSON.stringify(data, null, 2))
}

let handler = async (m, { conn, usedPrefix, command, args }) => {
    let wallet = getWallet()
    let sender = m.sender
    
    const owners = (global.owner || [])
        .filter(o => o && o[0])
        .map(o => o[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net')

    let target = m.mentionedJid && m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : (m.quoted ? m.quoted.sender : null)

   if (!target && args[0] && args[0].startsWith('@')) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    let amount = parseInt(args.find(a => !isNaN(a) && a.length < 10))

    if (!target || !amount || isNaN(amount) || amount <= 0) {
        return m.reply(`\`𐔌⚠️꒱\` Uso: ${usedPrefix + command} @tag <quantità>`)
    }

    if (!wallet[sender] || wallet[sender].money < amount) {
        return m.reply('`𐔌💸꒱` Non hai abbastanza contanti.')
    }

    if (target === sender) return m.reply('`𐔌🚫꒱` Non puoi donare a te stesso.')

    let taxPercent = (amount < 1000) ? 0.5 : (amount <= 10000) ? 1.0 : 2.0
    let taxAmount = Math.ceil((amount * taxPercent) / 100)
    let finalAmount = amount - taxAmount

    if (!wallet[target]) wallet[target] = { money: 0, bank: 0 }

    wallet[sender].money -= amount
    wallet[target].money += finalAmount

    if (owners.length > 0) {
        let taxPerOwner = Math.floor(taxAmount / owners.length)
        owners.forEach(ownerJid => {
            if (!wallet[ownerJid]) wallet[ownerJid] = { money: 0, bank: 0 }
            wallet[ownerJid].money += taxPerOwner
        })
    }

    saveWallet(wallet)

    let doneMsg = `╭┈➤ 『 💸 』 *DONAZIONE*
┆  『 📤 』 *DA:* @${sender.split('@')[0]}
┆  『 📥 』 *A:* @${target.split('@')[0]}
┆  『 💰 』 *VALORE:* ${amount}€
┆  『 📈 』 *RICEVUTO:* ${finalAmount}€
┆  『 🏛️ 』 *TASSA DI RETE:* ${taxAmount}€
╰┈➤ 『 📦 』 \`annoyed system\``

    await conn.sendMessage(m.chat, { text: doneMsg, mentions: [sender, target] }, { quoted: m })
}

handler.help = ['dona @tag <quantità>']
handler.tags = ['rpg']
handler.command = /^(dona|pay|donate)$/i
handler.group = true

export default handler