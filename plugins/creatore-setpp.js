import pkg from 'file-type';
const { fileTypeFromBuffer } = pkg;
import { downloadContentFromMessage } from '@realvare/baileys';

let handler = async (m, { conn, isOwner }) => {
    const q = m.quoted ? m.quoted : m
    let mtype = q.mtype || Object.keys(q.message || {})[0] || ''
    let msgNode = q.message || q.msg || {}

    while (['viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage', 'interactiveMessage', 'templateMessage', 'buttonsMessage'].includes(mtype)) {
        if (mtype === 'viewOnceMessage' || mtype === 'viewOnceMessageV2') {
            msgNode = msgNode[mtype]?.message || msgNode
            mtype = Object.keys(msgNode)[0]
        } else if (mtype === 'interactiveMessage') {
            msgNode = msgNode[mtype]?.header || msgNode
            mtype = msgNode.hasMediaAttachment && msgNode.imageMessage ? 'imageMessage' : mtype
            if (mtype === 'imageMessage') msgNode = { imageMessage: msgNode.imageMessage }
        } else if (mtype === 'documentWithCaptionMessage') {
            msgNode = msgNode[mtype]?.message || msgNode
            mtype = Object.keys(msgNode)[0]
        } else {
            break
        }
    }

    let mediaObj = msgNode[mtype] || msgNode
    let mime = mediaObj?.mimetype || mtype

    if (/image/i.test(mime) && !/webp/i.test(mime)) {
        try {
            const stream = await downloadContentFromMessage(mediaObj, mtype.replace('Message', ''))
            let buffer = Buffer.from([])
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])

            if (!buffer || buffer.length === 0) throw new Error('Download fallito')
            
            await conn.updateProfilePicture(conn.user.id, buffer)
            m.reply('`𐔌✅ ꒱` _Immagine del profilo aggiornata con successo!_')
        } catch (e) {
            console.error(e)
            m.reply('`𐔌❌ ꒱` _Errore durante il download o l\'impostazione dell\'immagine._')
        }
    } else {
        m.reply('`𐔌📸 ꒱` _Rispondi a un\'immagine con il comando_ *.setpp* _per cambiare la foto del bot._')
    }
}

handler.command = /^setpp$/i
handler.owner = true

export default handler