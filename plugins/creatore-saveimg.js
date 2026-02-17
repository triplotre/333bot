import fs from 'fs'
import { downloadContentFromMessage } from '@realvare/based'

const handler = async (m, { conn, text }) => {
    if (!text) return conn.sendMessage(m.chat, { text: '⚠️ Inserisci il nome del file.\nEsempio: *.sf admin*' }, { quoted: m })
    if (!m.quoted) return conn.sendMessage(m.chat, { text: '⚠️ Rispondi a un media (foto, video, sticker, audio).' }, { quoted: m })

    try {
        const q = m.quoted
        const msg = q.message || q
        
        const typeMap = {
            'imageMessage': 'jpg',
            'videoMessage': 'mp4',
            'stickerMessage': 'webp',
            'documentMessage': 'doc',
            'audioMessage': 'mp3'
        }

        const msgType = Object.keys(msg).find(key => typeMap[key])
        
        if (!msgType) return conn.sendMessage(m.chat, { text: '❌ Media non supportato o non trovato.' }, { quoted: m })

        const mediaKey = msgType.replace('Message', '')
        const mediaContent = msg[msgType]

        await conn.sendMessage(m.chat, { text: '⏳ Download in corso...' }, { quoted: m })

        const stream = await downloadContentFromMessage(mediaContent, mediaKey)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        let ext = typeMap[msgType]
        
        if (msgType === 'documentMessage') {
            const fileName = mediaContent.fileName || ''
            const fileExt = fileName.split('.').pop()
            if (fileExt) ext = fileExt
        }
        
        if (msgType === 'audioMessage' && mediaContent.ptt) {
            ext = 'opus'
        }

        const filename = `${text}.${ext}`
        const filepath = `./media/${filename}`

        if (!fs.existsSync('./media')) fs.mkdirSync('./media')
        fs.writeFileSync(filepath, buffer)

        await conn.sendMessage(m.chat, { 
            text: `✅ *FILE SALVATO*\n\n📂 *Percorso:* ${filepath}\n📝 *Estensione:* .${ext}\n⚖️ *Peso:* ${buffer.length} Byte` 
        }, { quoted: m })

    } catch (e) {
        console.error(e)
        await conn.sendMessage(m.chat, { text: `❌ Errore: ${e.message}` }, { quoted: m })
    }
}

handler.help = ['sf <nome>']
handler.tags = ['owner']
handler.command = ['sf', 'savefile']
handler.owner = true

export default handler