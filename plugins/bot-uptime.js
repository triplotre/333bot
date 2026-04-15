let handler = async (m, { conn }) => {
    let _uptime = process.uptime() * 1000
    let uptime = clockString(_uptime)
    
    let message = {
        interactiveMessage: {
            body: {
                text: `『 🕒 』 *UPTIME* ─ *${uptime}*`
            },
            footer: {
                text: "annoyed System"
            },
            header: {
                hasMediaAttachment: false
            },
            nativeFlowMessage: {
                buttons: [
                    {
                        name: "cta_url",
                        buttonParamsJson: JSON.stringify({
                            display_text: "SUPPORTO",
                            url: `https://wa.me/${global.owner[0][0]}`,
                            merchant_url: `https://wa.me/${global.owner[0][0]}`
                        })
                    }
                ]
            },
            contextInfo: {
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: global.newsletter,
                    newsletterName: "annoyed Update",
                    serverMessageId: -1
                },
                forwardingScore: 999
            }
        }
    }

    await conn.relayMessage(m.chat, { viewOnceMessage: { message } }, { quoted: m })
}

handler.help = ['uptime']
handler.tags = ['main']
handler.command = /^(uptime)$/i

export default handler

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':')
}