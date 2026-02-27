let handler = async (m, { conn }) => {
    let owners = global.owner.filter(o => o[0] && o[1] && (o[2] === true || o[2] === 'true'))
    
    if (owners.length === 0) return m.reply('`𐔌⚠️ ꒱` _Nessun proprietario idoneo configurato in config.js_')

    let contacts = []
    for (let [number, name] of owners) {
        contacts.push({
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nORG:staff pazzerello!!\nTEL;type=CELL;type=VOICE;waid=${number.replace(/[^0-9]/g, '')}:+${number.replace(/[^0-9]/g, '')}\nEND:VCARD`
        })
    }

    await conn.sendMessage(m.chat, {
        contacts: {
            displayName: `${contacts.length} Membri Staff`,
            contacts: contacts
        }
    }, { quoted: m })
}

handler.help = ['staff']
handler.tags = ['info']
handler.command = /^(staff|creatore|owner)$/i

export default handler