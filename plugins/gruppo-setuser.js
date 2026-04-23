import fs from 'fs'
import { join } from 'path'

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const dbPath = './media/lastfm.json'
    const dirPath = './media'

    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
    
    if (!fs.existsSync(dbPath)) fs.writeFileSync(dbPath, JSON.stringify({}))

    if (!text) return m.reply(`『 ⚠️ 』 Uso corretto:\n${usedPrefix + command} *nome_utente_lastfm*`)

    let db = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
    const userJid = m.sender
    const lastfmUser = text.trim()

    // Salvataggio nel database
    db[userJid] = lastfmUser
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))

    return m.reply(`『 ✅ 』 Account collegato con successo!\n\n*User:* ${lastfmUser}\nOra puoi usare *${usedPrefix}cur* per mostrare cosa stai ascoltando.`)
}

handler.command = ['setuser', 'lastfmset']
export default handler