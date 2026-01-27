import { generateWAMessageFromContent, proto } from '@realvare/based'

const handler = async (m, { conn }) => {

    const buttons = [
        { buttonId: '.ping', buttonText: { displayText: 'sborra' }, type: 1 },
        { buttonId: '.funzioni', buttonText: { displayText: 'trattieniti' }, type: 1 }
    ]

    const buttonMessage = {
        text: "sto per sborrare",
        footer: "sborrarararar",
        buttons: buttons,
        headerType: 1
    }

    try {
        const msg = await generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    buttonsMessage: buttonMessage
                }
            }
        }, { quoted: m })

        await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        console.log('--- BUTTONS INVIATI ---')
    } catch (e) {
        console.error('--- ERRORE BUTTONS ---', e)
        m.reply('Errore: ' + e.message)
    }
}

handler.command = ['test3']
export default handler