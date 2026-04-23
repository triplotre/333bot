import fs from 'fs'

const plPath = './media/playlists.json'

const formatTotalTime = (ms) => {
    const hours = Math.floor(ms / 3600000), mins = Math.floor((ms % 3600000) / 60000)
    return hours > 0 ? `${hours} h ${mins} min` : `${mins} min`
}

const handler = async (m, { conn, usedPrefix, text }) => {
    let pl = JSON.parse(fs.readFileSync(plPath, 'utf-8'))
    const name = text.trim()

    if (!name || !pl[m.sender]?.[name]) return m.reply('『 ❌ 』 Playlist non trovata.')
    
    const songs = pl[m.sender][name]
    if (songs.length === 0) return m.reply('『 📁 』 Playlist vuota.')

    const lastSong = songs[songs.length - 1]
    const totalMs = songs.reduce((a, s) => a + (s.duration || 0), 0)
    const botNumber = conn.user.id.split(':')[0]
    
    const mainText = `『 🎧 』 *PLAYLIST COMPLETA*\n\n📄 *Playlist:* ${name}\n📊 *Brani:* ${songs.length}\n🕒 *Durata:* ${formatTotalTime(totalMs)}\n\n Premi il bottone per ricevere la tua playlist "${name} in privato.`

    await conn.sendMessage(m.chat, {
        text: mainText,
        cards: [
            {
                image: { url: lastSong.image },
                body: ``,
                buttons: [
                    {
                        name: 'cta_url',
                        buttonParamsJson: JSON.stringify({ 
                            display_text: '📄 Lista Completa', 
                            url: `https://wa.me/${botNumber}?text=${usedPrefix}fullps ${name}` 
                        })
                    }
                ]
            }
        ]
    }, { quoted: m })
}

handler.command = ['pcompleta']
export default handler