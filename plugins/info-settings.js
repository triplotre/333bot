import fs from 'fs'
import { join } from 'path'

const paths = {
    bio: './media/descrizioni.json',
    compleanno: './media/compleanni.json',
    insta: './media/instagram.json',
    genere: './media/genere.json'
}

const loadDb = (path) => {
    if (!fs.existsSync(path)) fs.writeFileSync(path, JSON.stringify({}))
    return JSON.parse(fs.readFileSync(path, 'utf-8'))
}

const saveDb = (path, data) => {
    fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

const handler = async (m, { conn, text, command, usedPrefix }) => {
    const jid = m.sender
    const input = text?.trim()

    if (command === 'settings' || command === 'set') {
        const dbBio = loadDb(paths.bio)
        const dbComp = loadDb(paths.compleanno)
        const dbInsta = loadDb(paths.insta)
        const dbGen = loadDb(paths.genere)

        const hasBio = !!dbBio[jid]
        const hasComp = !!dbComp[jid]
        const hasInsta = !!dbInsta[jid]
        const userGen = dbGen[jid] || null

        let menu = `╭┈  『 ⚙️ 』 *SETTINGS PROFILO*\n`
        menu += `┆  _Personalizza la tua identità_\n`
        menu += `╰┈───────────────────\n\n`
        menu += `*GENERE:* ${userGen || 'Non impostato'}\n`
        menu += `*INSTA:* ${hasInsta ? '@' + dbInsta[jid] : '❌'}\n`
        menu += `*COMPLEANNO:* ${hasComp ? dbComp[jid] : '❌'}\n\n`
        menu += `*COMANDI DISPONIBILI:*\n`
        menu += `• \`${usedPrefix}setgen maschio/femmina\`\n`
        menu += `• \`${usedPrefix}setbio <testo>\`\n`
        menu += `• \`${usedPrefix}setinsta <username>\`\n`
        menu += `• \`${usedPrefix}setbirth <gg/mm>\` o \`<gg/mm/aaaa>\`\n\n`
        menu += `_Usa il comando senza testo per rimuovere un'info._`

        const buttons = [
            { buttonId: `${usedPrefix}setgen maschio`, buttonText: { displayText: userGen === 'Maschio' ? '🗑️ RIMUOVI MASCHIO' : '♂️ GENERE: MASCHIO' }, type: 1 },
            { buttonId: `${usedPrefix}setgen femmina`, buttonText: { displayText: userGen === 'Femmina' ? '🗑️ RIMUOVI FEMMINA' : '♀️ GENERE: FEMMINA' }, type: 1 },
            { buttonId: `${usedPrefix}setbio`, buttonText: { displayText: hasBio ? '🗑️ RIMUOVI BIO' : '📝 IMPOSTA BIO' }, type: 1 }
        ]

        return conn.sendMessage(m.chat, { 
            text: menu,
            footer: 'annoyed System • Personalizzazione',
            buttons,
            headerType: 1
        }, { quoted: m })
    }

    if (command === 'setgen') {
        let db = loadDb(paths.genere)
        const target = input?.toLowerCase()
        if (!input) return m.reply(`*Specifica il genere:* maschio o femmina.`)
        
        if (db[jid] && db[jid].toLowerCase() === target) {
            delete db[jid]
            saveDb(paths.genere, db)
            return m.reply('`✅` Genere rimosso.')
        }
        
        db[jid] = target === 'maschio' ? 'Maschio' : 'Femmina'
        saveDb(paths.genere, db)
        return m.reply(`\`✅\` Genere impostato su: *${db[jid]}*`)
    }

    if (command === 'setbio') {
        let db = loadDb(paths.bio)
        if (!input) {
            if (db[jid]) {
                delete db[jid]
                saveDb(paths.bio, db)
                return m.reply('`✅` Biografia rimossa.')
            }
            return m.reply(`*Come impostare la Bio:*\nUsa \`${usedPrefix}${command} la tua descrizione\`\n\n_Esempio: ${usedPrefix}${command} Amo la musica techno_`)
        }
        db[jid] = input
        saveDb(paths.bio, db)
        return m.reply('`✅` Biografia aggiornata con successo.')
    }

    if (command === 'setinsta') {
        let db = loadDb(paths.insta)
        if (!input) {
            if (db[jid]) {
                delete db[jid]
                saveDb(paths.insta, db)
                return m.reply('`✅` Instagram rimosso.')
            }
            return m.reply(`*Come impostare Instagram:*\nUsa \`${usedPrefix}${command} username\`\n\n_Esempio: ${usedPrefix}${command} annoyed_bot_`)
        }
        const cleanInsta = input.replace('@', '')
        db[jid] = cleanInsta
        saveDb(paths.insta, db)
        return m.reply(`\`✅\` Instagram impostato: *@${cleanInsta}*`)
    }

    if (command === 'setbirth') {
        let db = loadDb(paths.compleanno)
        if (!input) {
            if (db[jid]) {
                delete db[jid]
                saveDb(paths.compleanno, db)
                return m.reply('`✅` Compleanno rimosso.')
            }
            return m.reply(`*Come impostare il Compleanno:*\nUsa \`${usedPrefix}${command} GG/MM\` oppure \`GG/MM/AAAA\`\n\n_Esempio: ${usedPrefix}${command} 15/05_`)
        }
        
        const dateRegex = /^(\d{2})\/(\d{2})(\/\d{4})?$/
        if (!dateRegex.test(input)) return m.reply('`❌` Formato non valido. Usa: *GG/MM* o *GG/MM/AAAA*')
        
        db[jid] = input
        saveDb(paths.compleanno, db)
        return m.reply(`\`✅\` Compleanno impostato: *${input}*`)
    }
}

handler.command = ['settings', 'set', 'setgen', 'setbio', 'setinsta', 'setbirth']
export default handler