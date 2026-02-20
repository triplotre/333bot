import { writeFileSync } from 'fs'

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
    const jid = m.chat
    const botId = conn.decodeJid(conn.user.id)

    global.db.data.chats[jid] = global.db.data.chats[jid] || {}
    global.db.data.settings[botId] = global.db.data.settings[botId] || {}

    let chat = global.db.data.chats[jid]
    let botSettings = global.db.data.settings[botId]

    const adminFeatures = [
        { key: 'welcome', name: 'welcome' },
        { key: 'goodbye', name: 'goodbye' },
        { key: 'rileva', name: 'rileva' },
        { key: 'antiwhatsapp', name: 'antiwhatsapp' },
        { key: 'antitelegram', name: 'antitelegram' },
        { key: 'antinsta', name: 'antinsta' },
        { key: 'antilinkhard', name: 'antilinkhard' }
    ]

    const ownerFeatures = [
        { key: 'antiprivato', name: 'antiprivato' },
        { key: 'anticall', name: 'anticall' },
        { key: 'ai_rispondi', name: 'rispondi' }
    ]

    if (command === 'funzioni' || !args.length) {
        let groupPp, ownerPp
        try { groupPp = await conn.profilePictureUrl(jid, 'image') } catch { groupPp = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png' }
        try { ownerPp = await conn.profilePictureUrl(global.owner[0][0] + '@s.whatsapp.net', 'image') } catch { ownerPp = 'https://i.ibb.co/kVdFLyGL/sam.jpg' }

        const cards = []

        let adminBody = adminFeatures.map(f => {
            const status = chat[f.key] ? '『🟢』' : '『🔴』'
            return `${status} *${f.name}*`
        }).join('\n')

        cards.push({
            image: { url: groupPp },
            title: `『 🛡️ 』 *\`Impostazioni Admin\`*`,
            body: adminBody,
            buttons: [
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '『🌐』 Dashboard', url: 'https://zyklon.vercel.app/' }) }
            ]
        })

        if (isOwner) {
            let ownerBody = ownerFeatures.map(f => {
                const status = botSettings[f.key] ? '『🟢』' : '『🔴』'
                return `${status} *${f.name}*`
            }).join('\n')

            cards.push({
                image: { url: ownerPp },
                title: `『 👑 』 *\`Impostazioni Owner\`*`,
                body: ownerBody,
                buttons: [
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '『🌐』 Supporto', url: 'https://wa.me/212614769337' }) }
                ]
            })
        }

        return await conn.sendMessage(m.chat, {
            text: `⛩️ ╰┈➤ *PANNELLO GESTIONE*\nUsa *${usedPrefix}attiva <funzione>* o *${usedPrefix}disattiva <funzione>*`,
            cards: cards,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: { newsletterJid: global.canale?.id, newsletterName: global.canale?.nome }
            }
        }, { quoted: m })
    }

    let isEnable = !/disattiva|off|0/i.test(command)
    let type = args[0].toLowerCase()

    let adminF = adminFeatures.find(f => f.key.toLowerCase() === type || f.name.toLowerCase() === type)
    let ownerF = ownerFeatures.find(f => f.key.toLowerCase() === type || f.name.toLowerCase() === type)

    if (adminF) {
        if (!isAdmin && !isOwner) return m.reply('🏮 Solo gli amministratori possono gestire questa funzione.')

        if (adminF.key === 'antilinkhard' && isEnable) {
            const missing = []
            if (!chat.antiwhatsapp) missing.push('antiwhatsapp')
            if (!chat.antitelegram) missing.push('antitelegram')
            if (!chat.antinsta) missing.push('antinsta')

            if (missing.length > 0) {
                return m.reply(
                    `⛔ *AZIONE NEGATA*\n\n` +
                    `Per attivare \`antilinkhard\` (che blocca TUTTI i link), devi prima attivare i filtri specifici mancanti:\n\n` +
                    missing.map(x => `❌ ${x}`).join('\n') +
                    `\n\nUsa:\n` +
                    missing.map(x => `*${usedPrefix}attiva ${x}*`).join('\n')
                )
            }
        }

        chat[adminF.key] = isEnable

    } else if (ownerF) {
        if (!isOwner) return m.reply('🏮 Solo l\'owner può gestire questa funzione.')
        botSettings[ownerF.key] = isEnable
    } else {
        return m.reply(`🏮 ╰┈➤ Modulo \`${type}\` non trovato.\nUsa *${usedPrefix}funzioni* per la lista.`)
    }

    writeFileSync('./database.json', JSON.stringify(global.db.data, null, 2))

    let confText = `🏮 *Funzione:* \`${type}\`\n🧧 *Stato:* ${isEnable ? '🟢 ATTIVATA' : '🔴 DISATTIVATA'}`

    await conn.sendMessage(jid, {
        text: confText,
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: { newsletterJid: global.canale?.id, newsletterName: global.canale?.nome }
        }
    }, { quoted: m })
}

handler.help = ['funzioni', 'attiva <funzione>', 'disattiva <funzione>']
handler.tags = ['admin']
handler.command = ['funzioni', 'attiva', 'disattiva', 'on', 'off', 'enable', 'disable']
handler.group = true
handler.admin = true
handler.isAdmin = true
export default handler