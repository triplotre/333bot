import axios from 'axios'
import { formatNum } from '../lib/numberfix.js'

const handler = async (m, { conn, text }) => {
    const extra = global.newsletter ? global.newsletter() : {}
    const contextInfo = extra.contextInfo || {}
    
    if (contextInfo.externalAdReply) {
        delete contextInfo.externalAdReply
    }

    const safeGetName = async (id) => {
        try {
            if (id === conn.decodeJid(conn.user?.id)) return global.bot || 'annoyed'
            return conn.getName ? await conn.getName(id) : id.split('@')[0]
        } catch {
            return id.split('@')[0]
        }
    }

    let senderJid = ''
    let quotedText = ''

    if (m.quoted) {
        const qMsg = m.quoted.message || m.quoted
        quotedText = m.quoted.text || qMsg.conversation || qMsg.extendedTextMessage?.text || ''
        senderJid = m.quoted.sender || m.quoted.participant || m.quoted.key?.participant || ''
        
        if (!quotedText && text) quotedText = text
    } else if (m.mentionedJid && m.mentionedJid[0]) {
        senderJid = m.mentionedJid[0]
        const number = senderJid.split('@')[0]
        quotedText = text.replace(new RegExp('@' + number, 'g'), '').trim()
    } else if (text) {
        senderJid = m.sender
        quotedText = text.trim()
    }

    if (!senderJid || !quotedText) {
        return conn.sendMessage(m.chat, {
            text: `╭┈  『 ⚠️ 』 \`errore\`\n╰┈➤ Devi rispondere a un messaggio o inserire del testo.`,
            contextInfo
        }, { quoted: m })
    }

    await conn.sendPresenceUpdate('composing', m.chat)

    const BROWSERLESS_KEY = global.APIKeys?.browserless
    const botName = global.bot || 'annoyed'
    const formattedNum = formatNum(senderJid)
    const caption = ' ' 
    
    let name = await safeGetName(senderJid)
    if (senderJid === m.sender && m.pushName) {
        name = m.pushName
    }
    if (name === 'WhatsApp' || !name) {
        name = senderJid.split('@')[0]
    }
    
    let avatar
    try {
        avatar = await conn.profilePictureUrl(senderJid, 'image')
    } catch {
        avatar = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png'
    }

    const html = `<html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        body { margin: 0; width: 1280px; height: 720px; background: #0a0a0a; display: flex; justify-content: center; align-items: center; font-family: 'Inter', sans-serif; overflow: hidden; position: relative; }
        .bg-glow-1 { position: absolute; width: 600px; height: 600px; background: #00ffcc; filter: blur(200px); top: -150px; left: -150px; opacity: 0.3; }
        .bg-glow-2 { position: absolute; width: 600px; height: 600px; background: #ff007f; filter: blur(200px); bottom: -150px; right: -150px; opacity: 0.3; }
        .glass-container { position: relative; max-width: 950px; background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(35px); border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 30px; padding: 50px; box-shadow: 0 30px 60px rgba(0,0,0,0.6); display: flex; flex-direction: column; gap: 30px; z-index: 10; }
        .header { display: flex; align-items: center; gap: 25px; }
        .avatar { width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid rgba(255,255,255,0.4); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .name-container { display: flex; flex-direction: column; }
        .name { color: #fff; font-size: 30px; font-weight: 700; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); }
        .username { color: rgba(255,255,255,0.5); font-size: 20px; margin-top: 5px; }
        .quote-text { color: #fff; font-size: 38px; font-style: italic; font-weight: 400; line-height: 1.4; word-wrap: break-word; text-shadow: 2px 2px 8px rgba(0,0,0,0.5); }
        .quote-marks { color: rgba(255,255,255,0.15); font-size: 100px; font-weight: 700; position: absolute; top: 10px; right: 40px; font-family: sans-serif; line-height: 1; }
        .watermark { position: absolute; bottom: 20px; right: 30px; color: rgba(255,255,255,0.2); font-size: 20px; font-weight: 700; letter-spacing: 4px; z-index: 20; text-transform: uppercase; }
    </style></head><body>
        <div class="bg-glow-1"></div>
        <div class="bg-glow-2"></div>
        <div class="glass-container">
            <div class="quote-marks">"</div>
            <div class="header">
                <img class="avatar" src="${avatar}" />
                <div class="name-container">
                    <div class="name">${name}</div>
                    <div class="username">${formattedNum}</div>
                </div>
            </div>
            <div class="quote-text">"${quotedText}"</div>
        </div>
        <div class="watermark">${botName}</div>
    </body></html>`

    try {
        const ss = await axios.post(`https://chrome.browserless.io/screenshot?token=${BROWSERLESS_KEY}`, { 
            html: html, 
            viewport: { width: 1280, height: 720 }, 
            options: { type: 'jpeg', quality: 95 } 
        }, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { 
            image: Buffer.from(ss.data),
            caption: caption, 
            buttons: [{ buttonId: '.s', buttonText: { displayText: 'RENDI UNO STICKER' }, type: 1 }],
            contextInfo
        }, { quoted: m })
        return
    } catch (e) {
        return conn.sendMessage(m.chat, {
            text: `╭┈  『 ⚠️ 』 \`errore\`\n╰┈➤ Impossibile generare l'immagine al momento.`,
            contextInfo
        }, { quoted: m })
    }
}

handler.help = ['quote']
handler.tags = ['fun']
handler.command = ['q', 'quote', 'cit']

export default handler