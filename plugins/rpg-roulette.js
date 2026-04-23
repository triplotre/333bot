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

const formatTime = (ms) => {
    let m = Math.floor(ms / 60000)
    let s = Math.floor((ms % 60000) / 1000)
    return `${m > 0 ? m + 'm ' : ''}${s}s`
}

let handler = async (m, { conn, usedPrefix, command, args }) => {
    global.russa = global.russa || {}
    let wallet = getWallet()
    let users = global.db.data.users
    let sender = m.sender

    if (!wallet[sender]) wallet[sender] = { money: 0, bank: 0 }
    if (!users[sender].lastrussa) users[sender].lastrussa = 0

    if (args[0] === 'join') {
        let game = global.russa[m.chat]
        if (!game) return m.reply('`𐔌⚠️꒱` Nessuna sfida attiva.')
        if (game.p2) return m.reply('`𐔌🚫꒱` Partita già piena.')
        if (game.p1 === sender) return m.reply('`𐔌🚫꒱` Non puoi sfidare te stesso.')
        
        let cd = 10 * 60 * 1000
        let remaining = cd - (new Date() - users[sender].lastrussa)
        if (remaining > 0) return m.reply(`\`𐔌⏳꒱\` Devi aspettare ancora *${formatTime(remaining)}* prima di sfidare qualcuno.`)

        if (wallet[sender].money < game.bet) return m.reply(`\`𐔌💸꒱\` Ti servono ${game.bet}€ per entrare.`)

        wallet[sender].money -= game.bet
        saveWallet(wallet)
        
        users[sender].lastrussa = new Date() * 1 
        game.p2 = sender
        
        clearTimeout(game.timeout)
        return startBattle(m, conn, game)
    }

    let bet = parseInt(args[0])
    let bullets = parseInt(args[1]) || 1

    if (!bet || isNaN(bet) || bet < 150) return m.reply(`\`𐔌⚠️꒱\` Uso: ${usedPrefix + command} <quota> <proiettili>\nEsempio: \`${usedPrefix + command} 500 2\``)
    
    let cd = 10 * 60 * 1000
    let remaining = cd - (new Date() - users[sender].lastrussa)
    if (remaining > 0) return m.reply(`\`𐔌⏳꒱\` Hai già giocato di recente. Aspetta ancora *${formatTime(remaining)}*.`)

    if (bullets < 1 || bullets > 5) return m.reply('`𐔌⚠️꒱` Da 1 a 5 proiettili.')
    if (wallet[sender].money < bet) return m.reply('`𐔌💸꒱` Non hai abbastanza soldi.')

    wallet[sender].money -= bet
    saveWallet(wallet)
    
    users[sender].lastrussa = new Date() * 1 

    global.russa[m.chat] = {
        p1: sender,
        p2: null,
        bet: bet,
        bullets: bullets,
        timeout: setTimeout(() => {
            if (global.russa[m.chat]) {
                let wall = getWallet()
                wall[sender].money += bet 
                saveWallet(wall)
                conn.sendMessage(m.chat, { text: `\`𐔌⏳꒱\` Sfida scaduta. @${sender.split('@')[0]} rimborsato.`, mentions: [sender] })
                delete global.russa[m.chat]
            }
        }, 20 * 60 * 1000)
    }

    let txt = `╭┈➤ 『 🔫 』 *ROULETTE RUSSA*
┆  『 👤 』 *SFIDANTE:* @${sender.split('@')[0]}
┆  『 💰 』 *QUOTA:* ${bet}€
┆  『 💣 』 *PROIETTILI:* ${bullets}
┆
┆  *Clicca il bottone o scrivi \`${usedPrefix}roulette join\`*
╰┈➤ 『 📦 』 \`annoyed system\``

    const buttons = [{
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({ display_text: "🎮 ENTRA IN PARTITA", id: `${usedPrefix}roulette join` })
    }]

    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    body: { text: txt },
                    footer: { text: "Scade tra 20 minuti" },
                    nativeFlowMessage: { buttons },
                    contextInfo: {
                        mentionedJid: [sender],
                        stanzaId: 'annoyedSystem',
                        participant: '0@s.whatsapp.net',
                        quotedMessage: m.message
                    }
                }
            }
        }
    }

    await conn.relayMessage(m.chat, msg, {})
}

async function startBattle(m, conn, game) {
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))
    const { p1, p2, bet, bullets } = game
    const totalPrize = bet * 2
    const name1 = `@${p1.split('@')[0]}`
    const name2 = `@${p2.split('@')[0]}`

    let { key: battleKey } = await conn.sendMessage(m.chat, { 
        text: `🎮 *PARTITA INIZIATA* \n${name1} VS ${name2} \n\n_Preparazione in corso..._`,
        mentions: [p1, p2]
    })

    const steps = [
        `*Caricamento tamburo...* 🔫`,
        `*Il tamburo gira...* 🔄`,
        `*Si inizia... la tensione sale.* 🥶`
    ]

    for (let step of steps) {
        await delay(1500)
        await conn.sendMessage(m.chat, { text: step, edit: battleKey })
    }

    let cylinder = [0, 0, 0, 0, 0, 0]
    for (let i = 0; i < bullets; i++) cylinder[i] = 1
    cylinder = cylinder.sort(() => Math.random() - 0.5)

    let p1Dead = false
    let p2Dead = false
    let battleLog = `╭┈➤ 『 🔫 』 *DIARIO DI GUERRA*\n`

    battleLog += `┆ 👤 ${name1} preme il grilletto...\n`
    await conn.sendMessage(m.chat, { text: battleLog, edit: battleKey, mentions: [p1, p2] })
    await delay(2000)
    
    if (cylinder[0] === 1) {
        p1Dead = true
        battleLog += `┆ 💥 *BOOM!* Il colpo è partito.\n`
    } else {
        battleLog += `┆ 💨 *CLICK!* Camera vuota.\n`
    }
    await conn.sendMessage(m.chat, { text: battleLog, edit: battleKey, mentions: [p1, p2] })
    await delay(1500)

    if (!p1Dead) {
        battleLog += `┆ 👤 ${name2} preme il grilletto...\n`
        await conn.sendMessage(m.chat, { text: battleLog, edit: battleKey, mentions: [p1, p2] })
        await delay(2000)

        if (cylinder[1] === 1) {
            p2Dead = true
            battleLog += `┆ 💥 *BOOM!* Il colpo è partito.\n`
        } else {
            battleLog += `┆ 💨 *CLICK!* Camera vuota.\n`
        }
        await conn.sendMessage(m.chat, { text: battleLog, edit: battleKey, mentions: [p1, p2] })
        await delay(1500)
    }

    battleLog += `╰──────────────────┈`
    await conn.sendMessage(m.chat, { text: battleLog, edit: battleKey, mentions: [p1, p2] })
    await delay(1000)

    let winner = null
    let resultTxt = ''

    if (p1Dead) {
        winner = p2
        resultTxt = `💀 ${name1} è morto. ${name2} vince tutto!`
    } else if (p2Dead) {
        winner = p1
        resultTxt = `💀 ${name2} è morto. ${name1} vince tutto!`
    } else {
        winner = 'draw'
        resultTxt = `🍀 *VIVI:* Entrambi sopravvissuti. Quote restituite.`
    }

    let wallet = getWallet()
    if (winner && winner !== 'draw') {
        wallet[winner].money += totalPrize
    } else if (winner === 'draw') {
        wallet[p1].money += bet
        wallet[p2].money += bet
    }
    saveWallet(wallet)

    let finalMsg = `╭┈➤ 『 ⚰️ 』 *ESITO FINALE*
┆  ${resultTxt}
┆  『 💰 』 *PREMIO:* ${winner === 'draw' ? 'Restituito' : totalPrize + '€'}
╰┈➤ 『 📦 』 \`annoyed system\``

    await conn.sendMessage(m.chat, { text: finalMsg, mentions: [p1, p2] })
    delete global.russa[m.chat]
}

handler.command = ['roulette', 'russa']
handler.group = true
export default handler