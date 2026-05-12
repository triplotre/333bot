import axios from 'axios'
import fs from 'fs'

const dbPath = './media/lastfm.json'

let handler = async (m, { conn }) => {
    const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : m.sender)
    const user = db[target]
    const apiKey = global.api?.lastfm

    if (!user) return m.reply('_Utente non registrato._')

    try {
        const res = await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=${user}&api_key=${apiKey}&limit=1&format=json`)
        const track = res.data.recenttracks?.track?.[0]
        if (!track) return m.reply('_Nessun brano trovato._')

        const isNow = track['@attr']?.nowplaying === 'true'
        let img = track.image.find(i => i.size === 'extralarge')['#text'] || 'https://i.ibb.co/6fs5B1V/triplo3.jpg'
        
        let cap = `🎵 *${track.name}*\n👤 *${track.artist['#text']}*\n💿 *${track.album['#text']}*\n✨ *${isNow ? 'In riproduzione...' : 'Ultimo ascolto'}*`

        await conn.sendMessage(m.chat, { image: { url: img }, caption: cap }, { quoted: m })
    } catch (e) {
        m.reply('_Errore API LastFM._')
    }
}

handler.help = ['fm', 'nowplaying']
handler.tags = ['fm']
handler.command = ['fm', 'nowplaying']

export default handler