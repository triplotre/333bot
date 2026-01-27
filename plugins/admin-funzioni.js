import fetch from 'node-fetch'

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
    const jid = m.chat
    
    global.db.data.chats[jid] = global.db.data.chats[jid] || {}
    global.db.data.settings[conn.user.jid] = global.db.data.settings[conn.user.jid] || {}
    
    let chat = global.db.data.chats[jid]
    let botSettings = global.db.data.settings[conn.user.jid]

    const adminFeatures = [
        { key: 'welcome', name: 'welcome' },
        { key: 'goodbye', name: 'goodbye' },
        { key: 'rileva', name: 'rileva' },
    ]

    const ownerFeatures = [
        { key: 'antiprivato', name: 'antiprivato' }
    ]

    if (command === 'funzioni' || !args.length) {
        let groupPp, ownerPp
        
        try {
            groupPp = await conn.profilePictureUrl(jid, 'image')
        } catch {
            groupPp = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png'
        }

        try {
            const ownerNumber = global.owner[0][0]
            ownerPp = await conn.profilePictureUrl(ownerNumber + '@s.whatsapp.net', 'image')
        } catch {
            ownerPp = 'https://i.ibb.co/kVdFLyGL/sam.jpg'
        }

        const cards = []

        let adminBody = adminFeatures.map(f => {
            return `${chat[f.key] ? '『 ✅ 』' : '『 ❌ 』'} *${f.name}*`
        }).join('\n')

        cards.push({
            image: { url: groupPp },
            title: `『 🛡️ 』 *\`Impostazioni Admin\`*`,
            body: adminBody,
            footer: '',
            buttons: [
                    {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🌐 Supporto',
                        url: 'https://wa.me/212614769337',
                        merchant_url: 'https://wa.me/212614769337'
                    })
                },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🌐 Dashboard',
                            url: 'https://zexin.vercel.app/',
                            merchant_url: 'https://zexin.vercel.app/'
                        })
                    }
                ]
        })

        if (isOwner) {
            let ownerBody = ownerFeatures.map(f => {
                return `${botSettings[f.key] ? '『 ✅ 』' : '『 ❌ 』'} *${f.name}*`
            }).join('\n')

            cards.push({
                image: { url: ownerPp },
                title: `『 👑 』 *\`Impostazioni Owner\`*`,
                body: ownerBody,
                footer: '',
                buttons: [
                    {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: '🌐 Supporto',
                        url: 'https://wa.me/212614769337',
                        merchant_url: 'https://wa.me/212614769337'
                    })
                },
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({
                            display_text: '🌐 Dashboard',
                            url: 'https://zexin.vercel.app/',
                            merchant_url: 'https://zexin.vercel.app/'
                        })
                    }
                ]
            })
        }

        return await conn.sendMessage(m.chat, {
            text: `⛩️ ╰┈➤ *PANNELLO GESTIONE* `,
            footer: '',
            cards: cards,
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.canale.id,
                    newsletterName: global.canale.nome
                }
            }
        }, { quoted: m })
    }

    let isEnable = /attiva|on|1/i.test(command)
    let type = args[0].toLowerCase()

    if (adminFeatures.some(f => f.key.toLowerCase() === type || f.name.toLowerCase() === type)) {
        let feature = adminFeatures.find(f => f.key.toLowerCase() === type || f.name.toLowerCase() === type)
        chat[feature.key] = isEnable
    } else if (ownerFeatures.some(f => f.key.toLowerCase() === type || f.name.toLowerCase() === type)) {
        if (!isOwner) return m.reply('🏮 Solo l\'owner può gestire questa funzione.')
        let feature = ownerFeatures.find(f => f.key.toLowerCase() === type || f.name.toLowerCase() === type)
        botSettings[feature.key] = isEnable
    } else {
        return m.reply(`🏮 ╰┈➤ Modulo \`${type}\` non trovato.`)
    }

    let confText = `🏮 *Funzione:* \`${type}\`\n🧧 *Stato:* ${isEnable ? '🟢 ATTIVATA' : '🔴 DISATTIVATA'}`

    await conn.sendMessage(jid, { 
        text: confText,
        contextInfo: {
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: global.canale.id,
                newsletterName: global.canale.nome
            }
        }
    }, { quoted: m })
}

handler.help = ['funzioni', 'attiva', 'disattiva']
handler.tags = ['admin']
handler.command = ['funzioni', 'attiva', 'disattiva', 'on', 'off']
handler.group = true

export default handler