import fs from 'fs'
import { join } from 'path'
import { formatNum } from '../../lib/numberfix.js'

export async function eventsUpdate(conn, anu) {
    try {
        const { id, participants, action, author } = anu
        
        if (!['add', 'remove', 'leave'].includes(action)) return

        const dbPath = './media/eventi.json'
        const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
        
        const chatData = global.db.data.groups?.[id] || global.db.data.chats?.[id]
        if (!chatData || !chatData.welcome) return

        const metadata = await conn.groupMetadata(id)
        const groupName = metadata.subject
        const totalMembers = metadata.participants.length
        const groupIcon = await conn.profilePictureUrl(id, 'image').catch(() => 'https://i.ibb.co/hxC1T34f/damn17.jpg')

        for (const user of participants) {
            const jid = conn.decodeJid(user)
            const authorJid = author ? conn.decodeJid(author) : jid
            
            const pushName = conn.contacts?.[jid]?.name || conn.contacts?.[jid]?.notify || jid.split('@')[0]
            const userFormatted = formatNum(jid)
            const displayName = `${pushName} (${userFormatted})`

            let userIcon = groupIcon
            try {
                userIcon = await conn.profilePictureUrl(jid, 'image')
            } catch (e) {
            }

            const isKick = (action === 'remove' || action === 'leave') && authorJid !== jid

            let rawText = ''
            if (action === 'add') {
                rawText = db[id]?.welcome || '🎋 ╰┈➤ benvenuto &user in &gruppo, ora siamo in &membri 🏮'
            } else if (isKick) {
                rawText = '🎋 ╰┈➤ &author ha rimosso &user, ora siamo in &membri 🏮'
            } else {
                rawText = db[id]?.bye || '🎋 ╰┈➤ &user ha abbandonato il gruppo, ora siamo in &membri 🏮'
            }
            
            const caption = rawText
                .replace(/&user/g, `@${jid.split('@')[0]}`)
                .replace(/&author/g, `@${authorJid.split('@')[0]}`)
                .replace(/&gruppo/g, groupName)
                .replace(/&membri/g, totalMembers)

            const title = action === 'add' ? `Benvenuto/a` : (isKick ? `Rimozione` : `Addio`)
            const body = action === 'add' ? `siamo ${totalMembers} membri ora!` : `immagina quittare!! 😒`

            const mentionsList = isKick ? [jid, authorJid] : [jid]

            const newsletterData = global.newsletter().contextInfo || {}

            await conn.sendMessage(id, {
                text: caption,
                mentions: mentionsList,
                contextInfo: {
                    ...newsletterData, 
                    externalAdReply: {
                        title: `${title}`,
                        body: `${body}`,
                        thumbnailUrl: userIcon, 
                        mediaType: 1,
                        renderLargerThumbnail: false, 
                        showAdAttribution: true
                    }
                }
            })
        }
    } catch (e) {
        console.error('[Event Update Error]:', e)
    }
}