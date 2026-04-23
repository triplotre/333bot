import { jidNormalizedUser } from "@realvare/baileys"

export async function before(m, { conn, isOwner }) {
    if (m.isGroup && m.messageStubType === 172) { 
        const groupJid = m.chat
        const candidateJid = m.messageStubParameters[0] 
        
        const normalizedCandidate = jidNormalizedUser(candidateJid)
        const ownerNumbers = global.owner.map(o => jidNormalizedUser(o[0] + '@s.whatsapp.net'))

        if (ownerNumbers.includes(normalizedCandidate)) {
            try {
                await conn.groupRequestParticipantsUpdate(groupJid, [normalizedCandidate], 'approve')
                await conn.sendMessage(groupJid, { 
                    text: `\ @${normalizedCandidate.split('@')[0]} è stato accettato automaticamente._`,
                    mentions: [normalizedCandidate]
                })
            } catch (e) {
                console.error('Errore auto-accept:', e)
            }
        }
    }
}