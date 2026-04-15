import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, args, usedPrefix, command }) => {
    if (args.length < 2) {
        return m.reply(`\`𐔌⚠️ ꒱\` _Uso corretto: ${usedPrefix + command} <vecchio numero> <nuovo numero>_`)
    }

    const oldNum = args[0].replace(/[^0-9]/g, '')
    const newNum = args[1].replace(/[^0-9]/g, '')

    if (!oldNum || !newNum) {
        return m.reply('\`𐔌⚠️ ꒱\` _I numeri forniti non sono validi._')
    }

    const oldJid = `${oldNum}@s.whatsapp.net`
    const newJid = `${newNum}@s.whatsapp.net`

    let res = {
        utenti: '❌',
        vips: '❌',
        banca: '❌',
        banned: '❌',
        canzoni: '❌',
        cooldown: '❌',
        inventory: '❌',
        lastfm: '❌',
        livelli: '❌',
        mutati: '❌',
        playlists: '❌',
        wallet: '❌'
    }

    if (global.db.data.users[oldJid]) {
        global.db.data.users[newJid] = { ...global.db.data.users[oldJid] }
        delete global.db.data.users[oldJid]
        res.utenti = '✅'
    }

    let foundInGroups = false
    for (let jid in global.db.data.groups) {
        let group = global.db.data.groups[jid]
        if (group.vips && group.vips.includes(oldJid)) {
            group.vips = group.vips.filter(v => v !== oldJid)
            if (!group.vips.includes(newJid)) group.vips.push(newJid)
            foundInGroups = true
        }
    }
    if (foundInGroups) res.vips = '✅'

    const mediaDir = path.join(process.cwd(), 'media')
    
    const migrateJsonFile = (fileName) => {
        const filePath = path.join(mediaDir, fileName)
        if (!fs.existsSync(filePath)) return '❌'
        
        try {
            let data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
            let modified = false

            if (fileName === 'banned.json') {
                if (data.users && data.users.includes(oldJid)) {
                    data.users = data.users.filter(id => id !== oldJid)
                    if (!data.users.includes(newJid)) data.users.push(newJid)
                    modified = true
                }
            } else if (fileName === 'mutati.json') {
                for (let chat in data) {
                    if (data[chat].includes(oldJid)) {
                        data[chat] = data[chat].filter(id => id !== oldJid)
                        if (!data[chat].includes(newJid)) data[chat].push(newJid)
                        modified = true
                    }
                }
            } else {
                if (data[oldJid]) {
                    data[newJid] = data[oldJid]
                    delete data[oldJid]
                    modified = true
                }
                if (data[oldNum]) {
                    data[newNum] = data[oldNum]
                    delete data[oldNum]
                    modified = true
                }
            }

            if (modified) {
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
                return '✅'
            }
        } catch (e) {}
        return '❌'
    }

    res.banca = migrateJsonFile('banca.json')
    res.banned = migrateJsonFile('banned.json')
    res.canzoni = migrateJsonFile('canzoni.json')
    res.cooldown = migrateJsonFile('cooldown_lavoro.json')
    res.inventory = migrateJsonFile('inventory.json')
    res.lastfm = migrateJsonFile('lastfm.json')
    res.livelli = migrateJsonFile('livelli.json')
    res.mutati = migrateJsonFile('mutati.json')
    res.playlists = migrateJsonFile('playlists.json')
    res.wallet = migrateJsonFile('wallet.json')

    let out = `╭┈  『 🔄 』 \`MIGRAZIONE ACCOUNT\`\n`
    out += `┆\n`
    out += `┆  『 📤 』 \`da\` ─  *+${oldNum}*\n`
    out += `┆  『 📥 』 \`a\` ─  *+${newNum}*\n`
    out += `┆\n`
    out += `┆  『 👤 』 \`utenti db\` ─  *${res.utenti}*\n`
    out += `┆  『 💎 』 \`gruppi vips\` ─  *${res.vips}*\n`
    out += `┆  『 🏦 』 \`banca\` ─  *${res.banca}*\n`
    out += `┆  『 🚫 』 \`banned\` ─  *${res.banned}*\n`
    out += `┆  『 🎵 』 \`canzoni\` ─  *${res.canzoni}*\n`
    out += `┆  『 ⏳ 』 \`cooldown\` ─  *${res.cooldown}*\n`
    out += `┆  『 🎒 』 \`inventory\` ─  *${res.inventory}*\n`
    out += `┆  『 🎧 』 \`lastfm\` ─  *${res.lastfm}*\n`
    out += `┆  『 🆙 』 \`livelli\` ─  *${res.livelli}*\n`
    out += `┆  『 🔇 』 \`mutati\` ─  *${res.mutati}*\n`
    out += `┆  『 📜 』 \`playlists\` ─  *${res.playlists}*\n`
    out += `┆  『 👛 』 \`wallet\` ─  *${res.wallet}*\n`
    out += `╰┈➤ 『 📦 』 \`annoyed system\``

    await conn.sendMessage(m.chat, { text: out }, { quoted: m })
}

handler.help = ['migra <vecchio> <nuovo>']
handler.tags = ['owner']
handler.command = /^(migra|migrazione)$/i
handler.owner = true

export default handler