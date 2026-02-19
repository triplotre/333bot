import axios from 'axios'

const handler = async (m, { conn, args, usedPrefix, command }) => {
    let inputLang = args[0]?.toLowerCase()
    let text = args.slice(1).join(' ')

    if (!text && m.quoted?.text) text = m.quoted.text

    // Mappa per l'auto-correzione
    const correction = {
        'italiano': 'it', 'ita': 'it',
        'inglese': 'en', 'ing': 'en', 'eng': 'en',
        'spagnolo': 'es', 'spa': 'es',
        'francese': 'fr', 'fra': 'fr',
        'tedesco': 'de', 'ted': 'de', 'ger': 'de',
        'giapponese': 'ja', 'jap': 'ja',
        'russo': 'ru', 'rus': 'ru',
        'arabo': 'ar', 'ara': 'ar'
    }

    let lang = correction[inputLang] || inputLang

    if (!lang || !text || lang.length !== 2) {
        const istruzioni = `
  ◯  𐙚  *──  t r a d u c i  ──*
  
  Usa \`${usedPrefix + command} [lingua]\` rispondendo a un messaggio.
  
  *Esempio:* \`${usedPrefix + command} en ciao come stai\`
`.trim()
        return m.reply(istruzioni)
    }

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(text)}`
        const res = await axios.get(url)
        
        const traduzione = res.data[0].map(part => part[0]).join('')
        const daLingua = res.data[2]

        const bandiere = {
            'it': '🇮🇹', 'en': '🇬🇧', 'es': '🇪🇸', 'fr': '🇫🇷', 
            'de': '🇩🇪', 'ja': '🇯🇵', 'pt': '🇵🇹', 'ru': '🇷🇺', 'ar': '🇸🇦'
        }

        const flagDa = bandiere[daLingua] || '🌐'
        const flagA = bandiere[lang] || '🌐'

        const caption = `
ㅤㅤ⋆｡˚『 ╭  *TRADUTTORE* ╯ 』˚｡⋆

┌─⭓  ` + "`Da:`" + ` *${daLingua.toUpperCase()} ${flagDa}*
└─⭓  ` + "`A:`" + ` *${lang.toUpperCase()} ${flagA}*

┌─⭓  ` + "`Traduzione:`" + `
└─⭓  *${traduzione}*
`.trim()

        const buttons = [
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🔊 ASCOLTA TRADUZIONE",
                    id: `${usedPrefix}tts ${lang} ${traduzione}`
                })
            },
            {
                name: "quick_reply",
                buttonParamsJson: JSON.stringify({
                    display_text: "🎤 ASCOLTA ORIGINALE",
                    id: `${usedPrefix}tts ${daLingua} ${text}`
                })
            }
        ]

        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        body: { text: caption },
                        footer: { text: "333 bot • translator" },
                        nativeFlowMessage: { buttons: buttons },
                        contextInfo: {
                            ...global.newsletter().contextInfo,
                            mentionedJid: [m.sender],
                            isForwarded: true
                        }
                    }
                }
            }
        }

        await conn.relayMessage(m.chat, msg, { quoted: global.fakecontact(m) })

    } catch (e) {
        m.reply(`❌ Lingua \`${inputLang}\` non riconosciuta o errore API.`)
    }
}

handler.command = ['traduci', 'translate']
export default handler