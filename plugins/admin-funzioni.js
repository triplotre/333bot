import { detectDevice } from '../lib/device.js'

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
        { key: 'benvenuto',     name: 'benvenuto'     },
        { key: 'rileva',        name: 'rileva'         },
        { key: 'soloadmin',     name: 'soloadmin'      },
        { key: 'antiwhatsapp',  name: 'antiwhatsapp'   },
        { key: 'antitg',        name: 'antitg'         },
        { key: 'antinsta',      name: 'antinsta'       },
        { key: 'antilink',      name: 'antilink'       },
        { key: 'antilinkuni',   name: 'antilinkuni'    },
        { key: 'antinuke',      name: 'antinuke'       }
    ]

    const ownerFeatures = [
        { key: 'antiprivato',   name: 'antiprivato'    },
        { key: 'anticall',      name: 'anticall'       }
    ]

    if (command === 'funzioni' || !args.length) {
        let groupPp, ownerPp
        try { groupPp = await conn.profilePictureUrl(jid, 'image') } catch { groupPp = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png' }
        try { ownerPp = await conn.profilePictureUrl(global.owner[0][0] + '@s.whatsapp.net', 'image') } catch { ownerPp = 'https://i.ibb.co/kVdFLyGL/sam.jpg' }

        let adminBody = adminFeatures.map(f => {
            return `${chat[f.key] ? '『🟢』' : '『🔴』'} *${f.name}*`
        }).join('\n')

        let ownerBody = ownerFeatures.map(f => {
            return `${botSettings[f.key] ? '『🟢』' : '『🔴』'} *${f.name}*`
        }).join('\n')

        let device = 'unknown'
        try {
            device = detectDevice(m.key.id)
        } catch (e) {
            device = m.key.id.length > 21 ? 'android' : m.key.id.substring(0, 2) === '3A' ? 'ios' : 'web'
        }

        if (device === 'ios' || String(device).toLowerCase().includes('ios')) {
            let fallbackText = `╭┈  『 ⚙️ 』 \`pannello\` ─ *GESTIONE*\n╰┈➤ Usa *${usedPrefix}attiva* o *${usedPrefix}disattiva*\n\n`
            fallbackText += `╭┈  『 🛡️ 』 \`impostazioni\`\n┆  『 👥 』 \`admin\`\n┆\n${adminBody.split('\n').map(x => `┆  ${x}`).join('\n')}\n╰┈➤ 『 📦 』 \`zykbot system\``

            if (isOwner) {
                fallbackText += `\n\n╭┈  『 👑 』 \`impostazioni\`\n┆  『 👤 』 \`owner\`\n┆\n${ownerBody.split('\n').map(x => `┆  ${x}`).join('\n')}\n╰┈➤ 『 📦 』 \`zykbot system\``
            }

            return await conn.sendMessage(m.chat, {
                text: fallbackText,
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

        const cards = []

        cards.push({
            image: { url: groupPp },
            body: `╭┈  『 🛡️ 』 \`impostazioni\`\n┆  『 👥 』 \`admin\`\n┆\n${adminBody.split('\n').map(x => `┆  ${x}`).join('\n')}\n╰┈➤ 『 📦 』 \`zykbot system\``,
            buttons: [
                { name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: '『🌐』 Dashboard', url: 'https://annoyed.vercel.app/' }) }
            ]
        })

        if (isOwner) {
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
        if (!isAdmin && !isOwner) return conn.sendMessage(m.chat, { text: '🏮 Solo gli amministratori possono gestire questa funzione.' }, { quoted: m })

        chat[adminF.key] = isEnable

        if (adminF.key === 'antilinkuni' && isEnable) {
            chat.antilink = true
            chat.antitg = true
            chat.antinsta = true
            chat.antiwhatsapp = true
        }

    } else if (ownerF) {
        if (!isOwner) return conn.sendMessage(m.chat, { text: '🏮 Solo l\'owner può gestire questa funzione.' }, { quoted: m })
        botSettings[ownerF.key] = isEnable
    } else {
        return conn.sendMessage(m.chat, { text: `╭┈  『 🏮 』 \`errore\`\n┆  Modulo \`${type}\` non trovato.\n╰┈➤ Usa *${usedPrefix}funzioni* per la lista.` }, { quoted: m })
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
handler.command = ['funzioni', 'attiva', '1', 'disattiva', 'on', 'off', 'enable', 'disable', '0']
handler.group = true

export default handler