export async function eventsUpdate(conn, anu) {
    try {
        const { id, participants, action } = anu
        if (!global.db?.data) return
        
        const chat = global.db.data.groups?.[id] || global.db.data.chats?.[id]
        if (!chat || !chat.welcome) return

        const metadata = await conn.groupMetadata(id)
        const groupName = metadata.subject
        const totalMembers = metadata.participants.length

        for (const user of participants) {
            const jid = conn.decodeJid(user)
            let testo = ""
            let display = ""

            if (action === 'add') {
                display = "『 👋 』 𝓦𝓮𝓵𝓬𝓸𝓶𝓮"
                testo = `🎋 ╰┈➤ *@${jid.split('@')[0]}* benvenuto in *${groupName}* 🏮\n╰┈➤ Ora siamo *${totalMembers}* membri! 🎐`
            } else if (action === 'remove') {
                display = "『 👋 』 𝓖𝓸𝓸𝓭𝓫𝔂𝓮"
                testo = `🎐 ╰┈➤ *@${jid.split('@')[0]}* ha lasciato *${groupName}* 🏮\n╰┈➤ Ora siamo *${totalMembers}* membri! 🥀`
            }

            if (!testo) continue

            const fakeContact = {
                key: { participant: '0@s.whatsapp.net', remoteJid: 'status@broadcast' },
                message: {
                    contactMessage: {
                        displayName: display,
                        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;User;;;\nFN:User\nitem1.TEL;waid=${jid.split('@')[0]}:${jid.split('@')[0]}\nEND:VCARD`
                    }
                }
            }

            await conn.sendMessage(id, {
                text: testo,
                mentions: [jid],
                contextInfo: {
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.canale.id,
                        newsletterName: global.canale.nome
                    }
                }
            }, { quoted: fakeContact })
        }
    } catch (e) {
        console.error('[Errore Eventi]:', e)
    }
}