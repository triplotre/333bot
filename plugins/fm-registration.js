import fs from 'fs'
const dbPath = './media/lastfm.json'

let handler = async (m, { text, usedPrefix, command }) => {
    if (!text) return m.reply(`Uso: ${usedPrefix + command} [username]`)
    if (!fs.existsSync('./media')) fs.mkdirSync('./media')
    let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    db[m.sender] = text
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
    m.reply(`✅ Account collegato: \`${text}\``)
}

handler.help = ['fmset', 'fmreg']
handler.tags = ['fm']
handler.command = ['fmset', 'fmreg']

export default handler