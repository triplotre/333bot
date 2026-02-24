let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin }) => {
    const jid = m.chat
    const botId = conn.decodeJid(conn.user.id)
    const isGroup = jid.endsWith('@g.us')

    const targetDb = isGroup ? global.db.data.groups : global.db.data.chats
    targetDb[jid] = targetDb[jid] || {}
    global.db.data.settings[botId] = global.db.data.settings[botId] || {}

    let chat = targetDb[jid]
    let botSettings = global.db.data.settings[botId]

    const adminFeatures = [
        { key: 'welcome', name: 'welcome' },
        { key: 'rileva', name: 'rileva' },
        { key: 'antiwhatsapp', name: 'antiwhatsapp' },
        { key: 'antitelegram', name: 'antitelegram' },
        { key: 'antinsta', name: 'antinsta' },
        { key: 'antilinkhard', name: 'antilinkhard' }
    ]

    const ownerFeatures = [
        { key: 'antiprivato', name: 'antiprivato' },
        { key: 'anticall', name: 'anticall' },
     //   { key: 'ai_rispondi', name: 'AI Rispondi' }
    ]

    if (command === 'funzioni' || !args.length) {
        let groupPp, ownerPp
        try { groupPp = await conn.profilePictureUrl(jid, 'image') } catch { groupPp = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png' }
        try { ownerPp = await conn.profilePictureUrl(global.owner[0][0] + '@s.whatsapp.net', 'image') } catch { ownerPp = 'https://i.ibb.co/kVdFLyGL/sam.jpg' }

        const cards = []

        let adminBody = adminFeatures.map(f => {
            return `${chat[f.key] ? '『🟢』' : '『🔴』'} *${f.name}*`
        }).join('\n')

        cards.push({
            image: { url: groupPp },
            body: `╭┈  『 🛡️ 』 \`impostazioni\`\n┆  『 👥 』 \`admin\`\n┆\n${adminBody.split('\n').map(x => `┆  ${x}`).join('\n')}\n╰┈➤ 『 📦 』 \`zykbot system\``,
            buttons: [
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '『🌐』 Dashboard', url: 'https://zyklon.vercel.app/' }) }
            ]
        })

        if (isOwner) {
            let ownerBody = ownerFeatures.map(f => {
                return `${botSettings[f.key] ? '『🟢』' : '『🔴』'} *${f.name}*`
            }).join('\n')

            cards.push({
                image: { url: ownerPp },
                body: `╭┈  『 👑 』 \`impostazioni\`\n┆  『 👤 』 \`owner\`\n┆\n${ownerBody.split('\n').map(x => `┆  ${x}`).join('\n')}\n╰┈➤ 『 📦 』 \`zykbot system\``,
                buttons: [
                    { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '『🌐』 Supporto', url: 'https://wa.me/4915510448603' }) }
                ]
            })
        }

        return await conn.sendMessage(m.chat, {
            text: `╭┈  『 ⚙️ 』 \`pannello\` ─ *GESTIONE*\n╰┈➤ Usa *${usedPrefix}attiva* o *${usedPrefix}disattiva*`,
            cards: cards,
            contextInfo: {
                isForwarded: true,
                ...(global.canale ? {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.canale.id,
                        newsletterName: global.canale.nome
                    }
                } : {})
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
                const textMissing = `╭┈  『 ⛔ 』 \`azione negata\`\n┆  Per attivare \`antilinkhard\` devi\n┆  prima attivare questi filtri:\n┆\n${missing.map(x => `┆  ❌ ${x}`).join('\n')}\n╰┈➤ Usa: *${usedPrefix}attiva <filtro>*`
                return m.reply(textMissing)
            }
        }

        chat[adminF.key] = isEnable

    } else if (ownerF) {
        if (!isOwner) return m.reply('🏮 Solo l\'owner può gestire questa funzione.')
        botSettings[ownerF.key] = isEnable
    } else {
        return m.reply(`╭┈  『 🏮 』 \`errore\`\n┆  Modulo \`${type}\` non trovato.\n╰┈➤ Usa *${usedPrefix}funzioni* per la lista.`)
    }

    let confText = `╭┈  『 ⚙️ 』 \`aggiornamento\`\n┆  『 🧩 』 \`modulo\` ─ *${type}*\n╰┈➤ 『 📊 』 \`stato\` ─ *${isEnable ? '🟢 ATTIVATA' : '🔴 DISATTIVATA'}*`

    await conn.sendMessage(jid, {
        text: confText,
        contextInfo: {
            isForwarded: true,
            ...(global.canale ? {
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.canale.id,
                    newsletterName: global.canale.nome
                }
            } : {})
        }
    }, { quoted: m })
}

handler.help = ['funzioni', 'attiva <funzione>', 'disattiva <funzione>']
handler.tags = ['admin']
handler.command = ['funzioni', 'attiva', 'disattiva', 'on', 'off', 'enable', 'disable']
handler.group = true

export default handler