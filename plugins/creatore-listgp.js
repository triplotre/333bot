import { jidNormalizedUser } from "@realvare/baileys"

let handler = async (m, { conn, isOwner }) => {
    if (!isOwner) return

    m.reply(`_🔍 Analisi dei gruppi in corso ..._`)

    try {
        let groups = await conn.groupFetchAllParticipating()
        let groupEntries = Object.values(groups)
        
        let adminGroups = []
        let hiddenGroups = []
        
        let botJid = jidNormalizedUser(conn.user.id)
        let botLid = conn.user.lid ? jidNormalizedUser(conn.user.lid) : null

        for (let metadata of groupEntries) {
            let jid = metadata.id
            let participants = metadata.participants || []
            
            let admins = participants
                .filter(p => p.admin || p.isAdmin || p.isSuperAdmin)
                .map(p => jidNormalizedUser(p.id))

            let isBotAdmin = admins.includes(botJid) || (botLid && admins.includes(botLid))

            if (isBotAdmin) {
                let link = 'Link non disponibile'
                try {
                    let code = await conn.groupInviteCode(jid)
                    link = `https://chat.whatsapp.com/${code}`
                } catch (e) {
                }
                adminGroups.push(`📌 *${metadata.subject}*\n🔗 ${link}\n👥 Membri: ${participants.length}`)
            } else {
                hiddenGroups.push(`${metadata.subject} (${participants.length})`)
            }
        }

        let txt = `*🏰 LISTA GRUPPI (BOT ADMIN)*\n\n`
        txt += adminGroups.length > 0 ? adminGroups.join('\n\n') : '_Nessun gruppo rilevato con permessi admin._'
        
        txt += `\n\n> *Gruppi nascosti:* ${hiddenGroups.length > 0 ? hiddenGroups.join(', ') : 'Nessuno'}.`

        await conn.sendMessage(m.chat, { text: txt }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply(`\`❌\` _Errore:_ ${e.message}`)
    }
}

handler.command = ['listgp']
handler.owner = true

export default handler