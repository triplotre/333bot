import { detectDevice } from '../lib/device.js'

const handler = async (m, { conn, args, usedPrefix }) => {
    const metadata = await conn.groupMetadata(m.chat)
    const groupName = metadata.subject
    const inviteCode = await conn.groupInviteCode(m.chat)
    const linkgruppo = 'https://chat.whatsapp.com/' + inviteCode
    
    let ppUrl
    try {
        ppUrl = await conn.profilePictureUrl(m.chat, 'image')
    } catch {
        ppUrl = 'https://i.ibb.co/3Fh9V6p/avatar-group-default.png'
    }

    const device = detectDevice(m.key.id)
    const forceIos = args[0]?.toLowerCase() === 'ios'

    if (device === 'ios' || forceIos) {
        const messageText = `╭┈➤ 『 🔗 』 *LINK GRUPPO*\n┆  『 👥 』 \`membri\` ─ ${metadata.participants.length}\n┆  『 🌐 』 \`link\` ─ ${linkgruppo}\n╰┈➤ 『 📦 』 \`annoyed system\``

        return await conn.sendMessage(m.chat, {
            text: messageText,
            contextInfo: {
                ...global.newsletter().contextInfo,
                externalAdReply: {
                    title: groupName,
                    body: `Link d'invito ufficiale`,
                    thumbnailUrl: ppUrl,
                    sourceUrl: linkgruppo,
                    mediaType: 1,
                    renderLargerThumbnail: false
                }
            }
        }, { quoted: m })
    }

    try {
        const linkCard = {
            image: { url: ppUrl },
            title: `『 🔗 』 *\`link gruppo:\`*`,
            body: `- *${metadata.participants.length} Membri* \n- *${linkgruppo}*`,
            footer: '',
            buttons: [
                {
                    name: 'cta_copy',
                    buttonParamsJson: JSON.stringify({
                        display_text: '📎 Copia Link',
                        copy_code: linkgruppo
                    })
                },
            ]
        }
        await conn.sendMessage(
            m.chat,
            {
                text: `*${groupName}*`,
                footer: 'ꪶ 𖤓 ꫂ',
                cards: [linkCard]
            },
            { quoted: m }
        )

    } catch (error) {
        const interactiveButtons = [
            {
                name: "cta_copy",
                buttonParamsJson: JSON.stringify({
                    display_text: "Copia link 📎",
                    copy_code: linkgruppo
                })
            },
        ]

        const messageText = `*\`Link gruppo:\`*\n- *${groupName}*\n- *${linkgruppo}*`

        await conn.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: messageText,
            footer: 'ꪶ 𖤓 ꫂ',
            buttons: interactiveButtons,
            headerType: 4,
            viewOnce: true,
            contextInfo: {
                ...global.newsletter().contextInfo
            }
        }, { quoted: m })
    }
}

handler.help = ['link', 'link ios']
handler.tags = ['gruppo']
handler.command = /^link$/i
handler.group = true
handler.botAdmin = true

export default handler