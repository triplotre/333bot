import fs from 'fs'

const walletPath = './media/wallet.json'
const inventoryPath = './media/inventory.json'
const bancaPath = './media/banca.json'

const getDb = (path) => {
    if (!fs.existsSync('./media')) fs.mkdirSync('./media')
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const saveDb = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const generateCard = () => {
    const isPremium = Math.random() > 0.8 
    const brand = isPremium ? 'MASTERCARD' : 'VISA'
    const prefix = isPremium ? '5' : '4'
    let number = prefix
    for (let i = 0; i < 15; i++) number += Math.floor(Math.random() * 10)
    
    return {
        brand: brand,
        tier: isPremium ? 'BLACK' : 'STANDARD',
        number: number.match(/.{1,4}/g).join(' '),
        cashback: isPremium ? 0.05 : 0.01,
        color: isPremium ? 'linear-gradient(135deg, #0f0f0f 0%, #zyklon 100%)' : 'linear-gradient(135deg, #002366 0%, #0056b3 100%)'
    }
}

const handler = async (m, { conn, args, usedPrefix, command }) => {
    const jid = m.sender

    let walletDb = getDb(walletPath)
    let inventoryDb = getDb(inventoryPath)
    let bancaDb = getDb(bancaPath)

    if (!walletDb[jid]) walletDb[jid] = { money: 0, bank: 0 }
    if (!inventoryDb[jid]) inventoryDb[jid] = { canna: 0, piccone: 0 }
    if (!bancaDb[jid]) bancaDb[jid] = { hasCard: false }

    if (!args[0]) {
        const caption = `╭┈  『 🛒 』 \`shop\` ─  *NEGOZIO ITEM*
┆  
┆  『 💳 』 \`carta\` ─  *200€* (Limite: 1)
┆  『 🎣 』 \`canna\` ─  *500€* (Limite: 1)
╰┈➤ 『 ⛏️ 』 \`piccone\` ─  *150€* (Nessun limite)`.trim()

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💳 COMPRA CARTA", id: `${usedPrefix}${command} buy carta` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎣 COMPRA CANNA", id: `${usedPrefix}${command} buy canna` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "⛏️ COMPRA PICCONE", id: `${usedPrefix}${command} buy piccone` }) }
        ]

        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: `◯  𐙚  *──  s h o p  ──*`, hasVideoMessage: false },
                        body: { text: caption },
                        footer: { text: "" },
                        nativeFlowMessage: { buttons: buttons },
                        contextInfo: {
                            ...(global.newsletter?.().contextInfo || {}),
                            mentionedJid: [m.sender],
                            isForwarded: true,    
                            stanzaId: 'zyklonbotSystem',
                            participant: '0@s.whatsapp.net',
                            quotedMessage: {
                                contactMessage: {
                                    displayName: `⋆. zyklonbot 𝜗𝜚˚⋆`,
                                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;zyklonbot;;;\nFN:zyklonbot\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nEND:VCARD`
                                }
                            }
                        }
                    }
                }
            }
        }

        return await conn.relayMessage(m.chat, msg, {})
    }

    if (args[0] === 'buy' && args[1]) {
        const item = args[1].toLowerCase()
        const money = walletDb[jid].money

        if (item === 'carta') {
            if (bancaDb[jid].hasCard) return m.reply('⚠️ Hai già acquistato la Carta Magnetica.')
            if (money < 200) return m.reply('❌ Fondi insufficienti. Servono 200€.')
            
            walletDb[jid].money -= 200
            const newCard = generateCard()
            bancaDb[jid] = { hasCard: true, ...newCard, cardNumber: newCard.number }
            
            saveDb(walletPath, walletDb)
            saveDb(bancaPath, bancaDb)
            return m.reply(`✅ *CARTA EMESSA CON SUCCESSO*\nTipologia: ${newCard.brand} ${newCard.tier}`)
        }

        if (item === 'canna') {
            if (inventoryDb[jid].canna >= 1) return m.reply('⚠️ Hai già acquistato una Canna da Pesca.')
            if (money < 500) return m.reply('❌ Fondi insufficienti. Servono 500€.')
            
            walletDb[jid].money -= 500
            inventoryDb[jid].canna = 1
            
            saveDb(walletPath, walletDb)
            saveDb(inventoryPath, inventoryDb)
            return m.reply('✅ *CANNA DA PESCA ACQUISTATA*\nPuoi ora andare a pescare.')
        }

        if (item === 'piccone') {
            if (money < 150) return m.reply('❌ Fondi insufficienti. Servono 150€.')
            
            walletDb[jid].money -= 150
            inventoryDb[jid].piccone += 1
            
            saveDb(walletPath, walletDb)
            saveDb(inventoryPath, inventoryDb)
            return m.reply(`✅ *PICCONE ACQUISTATO*\nTotale posseduti: ${inventoryDb[jid].piccone}`)
        }

        return m.reply('❌ Oggetto non trovato nel negozio.')
    }
}

handler.help = ['shop']
handler.tags = ['rpg']
handler.command = /^(shop|negozio)$/i

export default handler