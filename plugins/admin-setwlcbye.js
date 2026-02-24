import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'media', 'eventi.json')

let handler = async (m, { text, command, usedPrefix }) => {
    if (!fs.existsSync(path.dirname(dbPath))) fs.mkdirSync(path.dirname(dbPath), { recursive: true })
    let db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    
    let chat = m.chat
    if (!db[chat]) db[chat] = { welcome: '', bye: '' }

    const isWelcome = command.includes('welcome')
    const input = text ? text.trim() : ''

    if (input.toLowerCase() === 'reset') {
        if (isWelcome) db[chat].welcome = ''
        else db[chat].bye = ''
        m.reply('`𐔌✅ ꒱` _Messaggio ripristinato ai valori predefiniti._')
    } else {
        if (!input) return m.reply(`\`𐔌⚠️ ꒱\` _Inserisci il testo. Usa:_ \n\n*&user* (tag)\n*&gruppo* (nome)\n*&membri* (numero)\n\n_Esempio: ${usedPrefix + command} Ciao &user benvenuto in &gruppo!_`)
        
        if (isWelcome) db[chat].welcome = input
        else db[chat].bye = input
        m.reply('`𐔌✅ ꒱` _Messaggio personalizzato salvato!_')
    }

    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2))
}

handler.command = /^(setwelcome|setbye|setaddio)$/i
handler.admin = true
handler.group = true

export default handler