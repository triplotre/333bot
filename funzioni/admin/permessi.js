import chalk from 'chalk'

export async function groupUpdate(conn, anu) {
    try {
        const { id, participants, action, author } = anu
        
        if (!global.db || !global.db.data) return
        
        const chat = global.db.data.groups?.[id] || global.db.data.chats?.[id]
        if (!chat || !chat.rileva) return

        if (action !== 'promote' && action !== 'demote') return

        const user = participants && participants[0] ? participants[0] : ''
        const admin = author || id
        
        if (!user) return

        const userNum = user.split('@')[0]
        const userStr = `@${userNum}`
        const adminStr = author ? `@${admin.split('@')[0]}` : 'Il Sistema'

        let testo = ""
        if (action === 'promote') {
            testo = `🎋 ${adminStr} ha promosso ${userStr}`
        } else if (action === 'demote') {
            testo = `🎐 ${adminStr} ha retrocesso ${userStr}`
        }

        const fakeContact = {
            key: { participant: '0@s.whatsapp.net'},
            message: {
                contactMessage: {
                    displayName: `+${userNum}`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Utente;;;\nFN:Utente\nitem1.TEL;waid=${userNum}:${userNum}\nEND:VCARD`
                }
            }
        }

        const mentionsList = [user]
        if (author) mentionsList.push(author)

        await conn.sendMessage(id, { 
            text: testo, 
            mentions: mentionsList,
            contextInfo: {
                isForwarded: true,
                ...(global.canale ? {
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: global.canale.id,
                        newsletterName: global.canale.nome
                    }
                } : {})
            }
        }, { quoted: fakeContact })

    } catch (e) {
        console.error(chalk.red('[Errore Log Permessi]:'), e)
    }
}