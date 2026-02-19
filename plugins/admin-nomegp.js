const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!text) {
        const errorCaption = `╭┈  『 ⚠️ 』 ` + "`errore` ─ " + ` *Manca il nome*\n╰┈➤ 『 📝 』 ` + "`uso` ─ " + ` *${usedPrefix + command} Nuovo Nome*`.trim()
        return sendStyled(conn, m, "n o m e  g r u p p o", errorCaption, [])
    }

    let oldName = ''
    try {
        const metadata = await conn.groupMetadata(m.chat)
        oldName = metadata.subject
    } catch (e) {
        oldName = 'Nome Precedente'
    }

    try {
        await conn.groupUpdateSubject(m.chat, text)

        const caption = `╭┈  『 ✏️ 』 ` + "`azione` ─ " + ` *Cambio Nome*\n┆  『 ⏪ 』 ` + "`vecchio` ─ " + ` *${oldName}*\n╰┈➤ 『 ⏩ 』 ` + "`nuovo` ─ " + ` *${text}*`.trim()

        const buttons = [
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "📋 Copia Vecchio",
                    copy_code: oldName
                })
            },
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "📋 Copia Nuovo",
                    copy_code: text
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "↩️ Ripristina",
                    id: `${usedPrefix + command} ${oldName}`
                })
            }
        ]

        return sendStyled(conn, m, "n o m e  g r u p p o", caption, buttons)
    } catch (e) {
        const failCaption = `╭┈  『 ❌ 』 ` + "`errore` ─ " + ` *Impossibile cambiare*\n╰┈➤ 『 💡 』 ` + "`info` ─ " + ` *Nome troppo lungo o permessi mancanti*`.trim()
        return sendStyled(conn, m, "n o m e  g r u p p o", failCaption, [])
    }
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
                        stanzaId: '333botSystem',
                        participant: '0@s.whatsapp.net',
                        quotedMessage: {
                            contactMessage: {
                                displayName: `⋆. 333bot 𝜗𝜚˚⋆`,
                                vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;333bot;;;\nFN:333bot\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nEND:VCARD`
                            }
                        }
                    }
                }
            }
        }
    };
    return await conn.relayMessage(m.chat, msg, {});
}

handler.help = ['nomegp <nome>']
handler.tags = ['group']
handler.command = /^nomegp$/i 

handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler