import axios from 'axios'

const handler = async (m, { conn, args, usedPrefix, command }) => {
    let lang = args[0]
    let text = args.slice(1).join(' ')

    if (!text && m.quoted?.text) text = m.quoted.text
    
    if (!lang || !text || lang.length !== 2) {
        const lingue = `
  ◯  𐙚  *──  v o c e  ──*
  
  Specifica lingua e testo o rispondi a un messaggio.
  
  *Esempio:* \`${usedPrefix + command} it ciao 333\`
  *Lingue comuni:* \`it, en, es, fr, ja, de\`
`.trim()
        return m.reply(lingue)
    }

    try {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`
        const res = await axios({
            method: 'get',
            url: url,
            responseType: 'arraybuffer',
            headers: {
                'Referer': 'http://translate.google.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        await conn.sendMessage(m.chat, { 
            audio: Buffer.from(res.data), 
            mimetype: 'audio/mpeg', 
            ptt: true 
        }, { quoted: global.fakecontact(m) })

    } catch (e) {
        m.reply(`❌ Errore nella generazione audio. Lingua \`${lang}\` supportata?`)
    }
}

handler.command = ['tts', 'parla', 'dici']
export default handler