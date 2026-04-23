import fs from 'fs'

const plPath = './media/playlists.json'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    if (!fs.existsSync(plPath)) fs.writeFileSync(plPath, JSON.stringify({}))
    let pl = JSON.parse(fs.readFileSync(plPath, 'utf-8'))

    if (command === 'rinomina') {
        let [oldName, newName] = text.split('|').map(v => v.trim())

        if (!oldName || !newName) {
            return m.reply(`『 ❌ 』 Uso corretto:\n${usedPrefix + command} *NomeVecchio | NomeNuovo*`)
        }

        if (!pl[m.sender] || !pl[m.sender][oldName]) {
            return m.reply(`『 ❌ 』 La playlist *${oldName}* non esiste.`)
        }

        if (pl[m.sender][newName]) {
            return m.reply(`『 ⚠️ 』 Esiste già una playlist chiamata *${newName}*. Scegli un altro nome.`)
        }

        pl[m.sender][newName] = pl[m.sender][oldName]
        delete pl[m.sender][oldName]

        fs.writeFileSync(plPath, JSON.stringify(pl, null, 2))

        return m.reply(`『 ✅ 』 Playlist rinominata:\n*${oldName}* ➔ *${newName}*`)
    }
}

handler.command = ['rinomina']
export default handler