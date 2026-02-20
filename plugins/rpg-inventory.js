import fs from 'fs'

const walletPath = './media/wallet.json'
const inventoryPath = './media/inventory.json'
const bancaPath = './media/banca.json'

const getDb = (path) => {
    if (!fs.existsSync('./media')) fs.mkdirSync('./media')
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const handler = async (m, { conn, usedPrefix }) => {
    const jid = m.sender

    let walletDb = getDb(walletPath)
    let inventoryDb = getDb(inventoryPath)
    let bancaDb = getDb(bancaPath)

    if (!walletDb[jid]) walletDb[jid] = { money: 0, bank: 0 }
    if (!inventoryDb[jid]) inventoryDb[jid] = { canna: 0, piccone: 0 }
    if (!bancaDb[jid]) bancaDb[jid] = { hasCard: false }

    const money = walletDb[jid].money || 0
    const bank = walletDb[jid].bank || 0
    const card = bancaDb[jid].hasCard ? `${bancaDb[jid].brand} ${bancaDb[jid].tier}` : 'Nessuna'
    const canna = inventoryDb[jid].canna >= 1 ? '1x 🎣' : 'Nessuna'
    const piccone = inventoryDb[jid].piccone > 0 ? `${inventoryDb[jid].piccone}x ⛏️` : 'Nessuno'

    const caption = `╭┈  『 🎒 』 ` + "`inventario` ─ " + ` *@${m.sender.split('@')[0]}*
┆  
┆  『 💵 』 ` + "`contanti` ─ " + ` *€${money.toLocaleString()}*
┆  『 🏦 』 ` + "`banca` ─ " + ` *€${bank.toLocaleString()}*
┆  『 💳 』 ` + "`carta` ─ " + ` *${card}*
┆  
┆  『 🎣 』 ` + "`canna` ─ " + ` *${canna}*
╰┈➤ 『 ⛏️ 』 ` + "`piccone` ─ " + ` *${piccone}*`.trim()

    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: { title: `◯  𐙚  *──  I N V E N T A R I O  ──*`, hasVideoMessage: false },
                    body: { text: caption },
                    footer: { text: "" },
                    nativeFlowMessage: { 
                        buttons: [
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({ display_text: "🛒 NEGOZIO", id: `${usedPrefix}shop` })
                            }
                        ] 
                    },
                    contextInfo: {
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

handler.help = ['inventory']
handler.tags = ['rpg']
handler.command = /^(inv|inventory|inventario)$/i

export default handler