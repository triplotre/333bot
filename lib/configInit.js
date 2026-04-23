import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

const configPath = path.join(process.cwd(), 'config.js')

export function checkConfig() {
    if (!fs.existsSync(configPath)) {
        const configContent = `import fs from 'fs'
import chalk from 'chalk'

global.bot = '⁴⁴⁴bot ❕'
global.creatore = '⋆˚꩜ giuse'
  
global.owner = [
                ['393512102631', 'giuse', true],
                ['393279399297', 'kinder', true],
 ]
global.authFile = 'sessione'
global.prefix = /^[./!#]/

global.APIKeys = {
    gemini: '444bot',
    removebg: '444bot',
    browserless: '444bot',
    lastfm: '444bot',
    chatgpt: '444bot',
    openrouter: '444bot',
    ocr: '444bot',
}

global.api_qr_read = 'https://api.ocr.space/parse/image'
global.api_qr_create = 'https://api.qrserver.com/v1/create-qr-code/'

global.immagini = [
    'https://i.ibb.co/hxC1T34f/damn17.jpg',
    'https://i.ibb.co/fY7W4VZK/ghost17.jpg',
    'https://i.ibb.co/YBG5bywX/nochalante17.jpg',
    'https://i.ibb.co/QvBshB7n/shit17.jpg',
    'https://i.ibb.co/35c7M44F/hurt17.jpg',
    'https://i.ibb.co/Gwbg90w/idk17.jpg',
    'https://i.ibb.co/F4nY0zW8/lifeismusic17.jpg',
    'https://i.ibb.co/NnJbKYhQ/lifenosrs17.jpg',
    'https://i.ibb.co/VWLrC5J6/love17.jpg',
    'https://i.ibb.co/S4McqR4g/normalize17.jpg',
    'https://i.ibb.co/MKPTbMM/redflag.jpg'
]

global.canale = {
    id: '120363408303414353@newsletter',
    nome: global.bot,
    link: 'https://whatsapp.com/channel/0029Vb7sYg3BfxoDGJ2pqi1J'
}

global.fakecontact = (m) => {
    return {
        key: { 
            participant: '0@s.whatsapp.net', 
            remoteJid: '0@s.whatsapp.net', 
            fromMe: false, 
            id: 'zyk' 
        },
        message: {
            contactMessage: {
                displayName: global.bot,
                vcard: \`BEGIN:VCARD\\nVERSION:3.0\\nN:;zyk;;;\\nFN:zyk\\nitem1.TEL;waid=\${m.sender.split('@')[0]}:\${m.sender.split('@')[0]}\\nEND:VCARD\`
            }
        }
    }
}

global.rcanal = (speed = '') => {
    const foto = global.immagini[Math.floor(Math.random() * global.immagini.length)]
    return {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: global.canale.id,
                serverMessageId: 1,
                newsletterName: global.canale.nome
            },
            externalAdReply: {
                title: global.bot,
                body: speed ? \`Lattenza: \${speed}ms\` : global.creatore,
                thumbnailUrl: foto,
                sourceUrl: global.canale.link,
                mediaType: 1,
                renderLargerThumbnail: false
            }
        }
    }
}

global.newsletter = () => {
    return {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: global.canale.id,
                serverMessageId: 1,
                newsletterName: global.canale.nome
            },
        }
    }
}`
        fs.writeFileSync(configPath, configContent)
        console.log(chalk.yellow('\n[ INFO ] ') + chalk.white('Dato che è la prima volta che avvii questo bot, ho creato il file di configurazione per te!'))
        console.log(chalk.yellow('[ INFO ] ') + chalk.cyan('Da ora in avanti potrai personalizzare il bot dal file config.js\n'))
        
        const start = Date.now()
        while (Date.now() - start < 5000) {}
    }
}