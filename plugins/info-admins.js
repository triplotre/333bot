const handler = async (m, { conn }) => {
    const jid = m.chat
    const groupMetadata = await conn.groupMetadata(jid)
    const participants = groupMetadata.participants || []
    const admins = participants.filter(p => p.admin !== null)

    const toRaw = (id) => id ? id.split('@')[0].split(':')[0].replace(/[^0-9]/g, '') : ''

    let text = `────୨ৎ────\n*𐙚 LISTA ADMIN*\n\n`
    let mentions = []
    let buttons = []

    for (let admin of admins) {
        let adminJid = admin.id
        let lid = 'N/A'

        if (adminJid.endsWith('@lid')) {
            lid = adminJid
            const contact = Object.values(conn.contacts || {}).find(c => c.lid === lid)
            if (contact && contact.id) {
                adminJid = contact.id
            }
        } else {
            if (conn.contacts?.[adminJid]?.lid) {
                lid = conn.contacts[adminJid].lid
            }
        }

        const decodedJid = conn.decodeJid(adminJid)
        const number = toRaw(decodedJid)
        
        text += `➤ *Numero:* ${number}\n`
        text += `➤ *JID:* \`${decodedJid}\`\n`
        if (lid !== 'N/A') {
            text += `➤ *LID:* \`${lid}\`\n`
        }
        text += `➤ *Tag:* @${number}\n\n`
        
        mentions.push(decodedJid)

        if (buttons.length < 10) {
            let copyData = lid !== 'N/A' ? `JID: ${decodedJid}\nLID: ${lid}` : `JID: ${decodedJid}`
            
            buttons.push({
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: `Copia Dati ${number}`,
                    id: `copy_data_${number}`,
                    copy_code: copyData
                })
            })
        }
    }

    text += `. ܁₊ ⊹ . ܁ ⟡ ܁ . ⊹ ₊ ܁.`

    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: { title: "", hasVideoMessage: false },
                    body: { text: text.trim() },
                    nativeFlowMessage: { buttons: buttons },
                    contextInfo: {
                        mentionedJid: mentions
                    }
                }
            }
        }
    }

    await conn.relayMessage(jid, msg, {})
}

handler.command = ['admin', 'admins']
handler.group = true
export default handler