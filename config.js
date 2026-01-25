import fs from 'fs'
import chalk from 'chalk'

global.bot = '𐙚 𝗭𝗘𝗫𝗜𝗡 𝗕𝗢𝗧'
global.creatore = '⋆˚꩜ 𝗭𝗘𝗫𝗜𝗡'

global.owner = [['212614769337', 'Zexin']]
global.authFile = 'zexin-session'
global.prefix = /^[./!#]/

global.ApiKeys = {
    gemini: 'tua_key',
    removebg: 'FEx4CYmYN1QRQWD1mbZp87jV'
}

global.immagini = [
    'https://i.ibb.co/VYxgQ311/timetolockin.jpg',
    'https://i.ibb.co/hJW7WwxV/varebot.jpg',
    'https://i.ibb.co/Mkt4nKRm/download-1.jpg'
]

global.canale = {
    id: '120363418582531215@newsletter',
    nome: 'ZEXIN SYSTEM 🪷',
    link: 'https://whatsapp.com/channel/0029VbB41Sa1Hsq1JhsC1Z1z'
}

global.rcanal = (speed = '') => {
    const foto = global.immagini[Math.floor(Math.random() * global.immagini.length)]
    return {
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: global.canale.id,
                serverMessageId: 1,
                newsletterName: global.canale.nome
            },
            externalAdReply: {
                title: global.bot,
                body: speed ? `Lattenza: ${speed}ms` : global.creatore,
                thumbnailUrl: foto,
                sourceUrl: global.canale.link,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }
}

global.dfail = async (type, m, conn) => {
    const msg = {
        owner: '𐙚 *Solo il proprietario del bot può usare questo comando!*',
        admin: '🛡️ *Solo gli amministratori del gruppo possono usare questo comando!*',
        group: '👥 *Questo comando può essere usato solo in chat di gruppo!*',
        private: '📩 *Questo comando può essere usato solo in chat privata!*',
        disabled: '🔒 *Questo comando è stato disattivato dall\'owner!*'
    }[type]

    if (msg) {
        return conn.sendMessage(m.key.remoteJid, {
            text: `${msg}`,
            ...global.rcanal()
        }, { quoted: m })
    }
}