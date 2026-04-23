import fs from 'fs'
import path from 'path'

const socialPath = path.join(process.cwd(), 'media/social.json')

const getSocial = () => {
    if (!fs.existsSync(socialPath)) return {}
    try { return JSON.parse(fs.readFileSync(socialPath, 'utf-8')) } catch { return {} }
}

const saveSocial = (data) => {
    fs.writeFileSync(socialPath, JSON.stringify(data, null, 2))
}

let handler = async (m, { conn, usedPrefix, command, args }) => {
    global.social_ask = global.social_ask || {}
    let social = getSocial()
    let sender = m.sender
    
    let target = (m.mentionedJid && m.mentionedJid[0]) 
        ? m.mentionedJid[0] 
        : (m.quoted ? m.quoted.sender : null)

    if (!target && args[0] && args[0].startsWith('@')) {
        target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
    }

    if (!social[sender]) social[sender] = { partner: null, children: [], parent: null }

    if (command === 'sposa' || command === 'adotta') {
        if (args[0] === 'si' || args[0] === 'accetta' || args[0] === 'no') {
            let id = m.chat + sender
            let session = global.social_ask[id]

            if (!session) {
                return m.reply(`\`𐔌⚠️꒱\` Nessuna proposta pendente per te.`)
            }

            if (args[0] === 'no') {
                clearTimeout(session.timeout)
                delete global.social_ask[id]
                return m.reply('`𐔌❌꒱` Richiesta rifiutata.')
            }

            let requester = session.requester
            let type = session.type 
            clearTimeout(session.timeout)
            delete global.social_ask[id]

            if (!social[requester]) social[requester] = { partner: null, children: [], parent: null }
            if (!social[sender]) social[sender] = { partner: null, children: [], parent: null }

            if (type === 'sposa') {
                social[sender].partner = requester
                social[requester].partner = sender
                saveSocial(social)
                
                const quotes = [
                    "_Finché connessione non vi separi._",
                    "_Lunga vita alle e-relationships._",
                    "_Uniti nel database, per sempre._",
                    "_Che il lag non rovini mai questo legame._"
                ]
                let quote = quotes[Math.floor(Math.random() * quotes.length)]
                
                return conn.sendMessage(m.chat, { 
                    text: `\`𐔌💖꒱\` @${sender.split('@')[0]} e @${requester.split('@')[0]} sono ora sposati!\n\n${quote}`, 
                    mentions: [sender, requester] 
                })
            } else if (type === 'adotta') {
                social[sender].parent = requester
                if (!social[requester].children) social[requester].children = []
                social[requester].children.push(sender)
                saveSocial(social)
                
                return conn.sendMessage(m.chat, {
                    text: `\`𐔌🍼꒱\` @${requester.split('@')[0]} ha adottato @${sender.split('@')[0]}!\n\n_Benvenuto nella famiglia._`,
                    mentions: [sender, requester]
                })
            }
            return !0
        }

        if (!target) return m.reply(`\`𐔌⚠️꒱\` Tagga qualcuno per questa azione.`)
        if (target === sender) return m.reply('`𐔌🚫꒱` Non puoi farlo con te stesso.')
        
        if (command === 'sposa') {
            if (social[sender].partner) return m.reply('`𐔌🚫꒱` Sei già sposato.')
            if (social[target]?.partner) return m.reply('`𐔌🚫꒱` Quella persona è già sposata.')
        } else {
            if (social[target]?.parent) return m.reply('`𐔌🚫꒱` Quella persona ha già un genitore.')
        }

        let id = m.chat + target
        if (global.social_ask[id]) clearTimeout(global.social_ask[id].timeout)
        
        global.social_ask[id] = {
            requester: sender,
            type: command, 
            timeout: setTimeout(() => {
                if (global.social_ask[id]) {
                    conn.sendMessage(m.chat, { text: `\`𐔌⏳꒱\` La proposta per @${target.split('@')[0]} è scaduta.`, mentions: [target] })
                    delete global.social_ask[id]
                }
            }, 60000)
        }

        let title = command === 'sposa' ? 'MATRIMONIO 💍' : 'ADOZIONE 👶'
        let actionTxt = command === 'sposa' ? 'vuoi sposare' : 'vuoi essere adottato da'
        let txt = `╭┈➤ 『 ${command === 'sposa' ? '💍' : '👶'} 』 *PROPOSTA DI ${title}*\n┆  @${target.split('@')[0]}, ${actionTxt} @${sender.split('@')[0]}?\n┆\n┆  *Rispondi entro 60 secondi.*\n╰┈➤ 『 📦 』 \`annoyed system\``

        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✅ SI", id: `${usedPrefix}${command} si` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "❌ NO", id: `${usedPrefix}${command} no` }) }
        ]

        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: txt },
                        footer: { text: "annoyed system" },
                        nativeFlowMessage: { buttons },
                        contextInfo: { mentionedJid: [sender, target] }
                    }
                }
            }
        }
        return conn.relayMessage(m.chat, msg, {})
    }

    if (command === 'divorzia') {
        let p = social[sender]?.partner
        if (!p) return m.reply('`𐔌⚠️꒱` Non sei sposato.')
        social[sender].partner = null
        if (social[p]) social[p].partner = null
        saveSocial(social)
        return m.reply('`𐔌💔꒱` Hai divorziato ufficialmente.')
    }

    if (command === 'abbandona') {
        let kids = social[sender]?.children || []
        if (!target || !kids.includes(target)) return m.reply('`𐔌⚠️꒱` Tagga il figlio da abbandonare.')
        social[sender].children = kids.filter(id => id !== target)
        if (social[target]) social[target].parent = null
        saveSocial(social)
        return m.reply(`\`𐔌🫥꒱\` Hai abbandonato @${target.split('@')[0]}.`, null, { mentions: [target] })
    }

    if (command === 'family' || command === 'famiglia') {
        let user = target || sender
        let data = social[user] || { partner: null, children: [], parent: null }

        let txt = `╭┈➤ 『 🏠 』 *FAMILY TREE*\n┆  『 👤 』 *UTENTE:* @${user.split('@')[0]}\n`
        txt += `┆  『 💍 』 *PARTNER:* ${data.partner ? `@${data.partner.split('@')[0]}` : 'Single'}\n`
        txt += `┆  『 👨‍👩‍👧 』 *GENITORE:* ${data.parent ? `@${data.parent.split('@')[0]}` : 'Nessuno'}\n`
        txt += `┆  『 👶 』 *FIGLI:* ${data.children?.length > 0 ? data.children.map(id => `\n┆      • @${id.split('@')[0]}`).join('') : 'Nessuno'}\n`
        txt += `╰┈➤ 『 📦 』 \`annoyed system\``

        let mentions = [user, data.partner, data.parent, ...(data.children || [])].filter(Boolean)
        return conn.sendMessage(m.chat, { text: txt, mentions }, { quoted: m })
    }
}

handler.command = ['sposa', 'adotta', 'divorzia', 'abbandona', 'family', 'famiglia']
handler.group = true
export default handler