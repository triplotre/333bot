import { downloadContentFromMessage } from '@realvare/baileys'

let handler = async (m, { conn }) => {
    if (!m.quoted) {
        return m.reply('『 ⚠️ 』- `Rispondi a un media (immagine, video o audio)`')
    }

    try {
        let rawQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage
        if (!rawQuoted) throw 'Impossibile leggere il messaggio citato'

        let msgObj = JSON.parse(JSON.stringify(rawQuoted))
        let mtype = Object.keys(msgObj)[0]

        if (['viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'].includes(mtype)) {
            msgObj = msgObj[mtype].message
            mtype = Object.keys(msgObj)[0]
        }

        const messageContent = msgObj[mtype]
        
        let mediaType
        if (mtype === 'videoMessage') mediaType = 'video'
        else if (mtype === 'imageMessage') mediaType = 'image'
        else if (mtype === 'audioMessage') mediaType = 'audio'
        else throw 'Formato non supportato (usa immagini, video o audio).'

        let stream = await downloadContentFromMessage(messageContent, mediaType)
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length === 0) {
            throw 'Impossibile scaricare il contenuto.'
        }

        if (mediaType === 'audio') {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: messageContent.mimetype || 'audio/mp4',
                ptt: messageContent.ptt || false
            }, { quoted: m })
        } else if (mediaType === 'video') {
            await conn.sendMessage(m.chat, {
                video: buffer
            }, { quoted: m })
        } else if (mediaType === 'image') {
            await conn.sendMessage(m.chat, {
                image: buffer
            }, { quoted: m })
        }

    } catch (e) {
        console.error(e)
        await m.reply('❌ Errore durante l\'invio del file.')
    }
}

handler.help = ['rivela']
handler.tags = ['strumenti']
handler.command = /^(readviewonce|rivela|viewonce|rvo)$/i

export default handler