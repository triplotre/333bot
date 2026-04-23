const handler = async (m, { conn, command, usedPrefix }) => {
    const isClose = (command === 'chiudi' || command === 'chiuso') ? 'announcement' : 'not_announcement'

    await conn.groupSettingUpdate(m.chat, isClose)

    const statusText = isClose === 'announcement' ? 'CHIUSO' : 'APERTO'
    const icon = isClose === 'announcement' ? '🔒' : '🔓'
    const desc = isClose === 'announcement' ? 'Solo admin' : 'Tutti'

    const caption = `╭┈  『 ${icon} 』 ` + "`stato` ─ " + ` *${statusText}*
┆  『 📝 』 ` + "`chat` ─ " + ` *${desc}*
╰┈➤ 『 👮 』 ` + "`admin` ─ " + ` *@${m.sender.split('@')[0]}*`.trim()
    
    const nextCmd = isClose === 'announcement' ? `${usedPrefix}apri` : `${usedPrefix}chiudi`
    const nextLabel = isClose === 'announcement' ? '🔓 APRI GRUPPO' : '🔒 CHIUDI GRUPPO'

    const buttons = [{
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
            display_text: nextLabel,
            id: nextCmd
        })
    }]

    return sendStyled(conn, m, "g r u p p o", caption, buttons)
}

async function sendStyled(conn, m, title, caption, buttons = []) {
    const msg = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: { title: `◯  𐙚  *──  ${title}  ──*`, hasVideoMessage: false },
                    body: { text: caption },
                    footer: { text: "" },
                    nativeFlowMessage: { buttons: buttons }, 
                    contextInfo: {
                        mentionedJid: [m.sender],
                        isForwarded: true,    
                        stanzaId: 'annoyedSystem',
                        participant: '0@s.whatsapp.net',
                        quotedMessage: {
                            contactMessage: {
                                displayName: `⋆. annoyed 𝜗𝜚˚⋆`,
                                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;annoyed;;;\nFN:annoyed\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nEND:VCARD`
                            }
                        }
                    }
                }
            }
        }
    };
    return await conn.relayMessage(m.chat, msg, {});
}

handler.help = ['apri', 'chiudi']
handler.tags = ['group']
handler.command = /^(apri|chiudi|aperto|chiuso)$/i 

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler