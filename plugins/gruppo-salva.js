import fs from 'fs'

const plPath = './media/playlists.json'
const songsDbPath = './media/canzoni.json'

const handler = async (m, { conn, usedPrefix, command, text }) => {
    if (!fs.existsSync(plPath)) fs.writeFileSync(plPath, JSON.stringify({}))
    if (!fs.existsSync(songsDbPath)) fs.writeFileSync(songsDbPath, JSON.stringify({}))
    
    let pl = JSON.parse(fs.readFileSync(plPath, 'utf-8'))
    let songsDb = JSON.parse(fs.readFileSync(songsDbPath, 'utf-8'))

    if (command === 'delplaylist') {
        if (!text || !pl[m.sender]?.[text]) return m.reply('『 ❌ 』 Playlist non trovata.')
        delete pl[m.sender][text]
        fs.writeFileSync(plPath, JSON.stringify(pl, null, 2))
        return m.reply(`『 ✅ 』 Playlist *${text}* eliminata.`)
    }

    if (command === 'delbrano') {
        let [plName, index] = text.split('|').map(v => v.trim())
        if (!pl[m.sender]?.[plName]) return m.reply('『 ❌ 』 Playlist non trovata.')
        let i = parseInt(index) - 1
        if (isNaN(i) || !pl[m.sender][plName][i]) return m.reply('『 ❌ 』 Numero brano non valido.')
        let removed = pl[m.sender][plName].splice(i, 1)
        fs.writeFileSync(plPath, JSON.stringify(pl, null, 2))
        return m.reply(`『 ✅ 』 Rimosso: *${removed[0].title}*`)
    }

    if (command === 'salva') {
        let parts = text.split('|').map(v => v.trim())
        let songTitle = parts[0]
        let songAuthor = parts[1]
        let plName = parts[2]

        if (!songTitle) return m.reply(`『 ❌ 』 Uso: ${usedPrefix}salva Brano | Autore | Playlist`)
        
        if (!pl[m.sender] || Object.keys(pl[m.sender]).length === 0) {
            return m.reply('『 ⚠️ 』 Non hai playlist. Creane una con: .crea nome')
        }

        if (!plName) {
            let buttons = Object.keys(pl[m.sender]).map(name => {
                let count = pl[m.sender][name].length
                return {
                    name: 'quick_reply',
                    buttonParamsJson: JSON.stringify({
                        display_text: `${name} (${count})`,
                        id: `${usedPrefix}salva ${songTitle} | ${songAuthor || ''} | ${name}`
                    })
                }
            })

            // Invio pulito senza contextInfo/newsletter per evitare blocchi
            return conn.sendMessage(m.chat, {
                text: `In quale playlist vuoi salvare *${songTitle}*?`,
                footer: 'Zexin-Bot Playlist System',
                buttons: buttons,
                headerType: 1,
                viewOnce: true
            }, { quoted: m })
        }

        if (!pl[m.sender][plName]) return m.reply(`『 ❌ 』 La playlist *${plName}* non esiste.`)

        let searchKey = songAuthor ? `${songTitle} ${songAuthor}`.toLowerCase() : songTitle.toLowerCase()
        let songData = songsDb[searchKey] || songsDb[songTitle.toLowerCase()]
        
        if (!songData) {
            return m.reply(`『 ❌ 』 Brano non trovato nel database.\nEsegui prima *.cur* su questo brano per registrarlo.`)
        }

        if (!Array.isArray(pl[m.sender][plName])) {
            pl[m.sender][plName] = []
        }

        const exists = pl[m.sender][plName].some(s => s.title.toLowerCase() === songData.title.toLowerCase())
        if (exists) return m.reply(`『 ⚠️ 』 *${songData.title}* è già presente in *${plName}*.`)

        pl[m.sender][plName].push(songData)
        fs.writeFileSync(plPath, JSON.stringify(pl, null, 2))
        
        return m.reply(`『 ✅ 』 *${songData.title}* salvata in *${plName}*!`)
    }
}

handler.command = ['salva', 'delplaylist', 'delbrano']
export default handler