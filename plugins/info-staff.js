import fs from 'fs'
import path from 'path'

let handler = async (m, { conn }) => {
    const ownersPath = path.join(process.cwd(), 'media', 'owners.json')
    let dynamicOwners = []

    if (fs.existsSync(ownersPath)) {
        try {
            const data = JSON.parse(fs.readFileSync(ownersPath, 'utf-8'))
            dynamicOwners = data.dynamicOwners || []
        } catch (e) {
            dynamicOwners = []
        }
    }

    let staticOwners = (global.owner || []).filter(o => o[0] && o[1] && o[2] === true)
    
    let contacts = []
    let addedJids = new Set()

    for (let [number, name] of staticOwners) {
        let cleanNumber = number.replace(/[^0-9]/g, '')
        let jid = cleanNumber + '@s.whatsapp.net'
        
        addedJids.add(jid)
        contacts.push({
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nORG:staff annoyedbot\nTEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}\nEND:VCARD`
        })
    }

    for (let ownerObj of dynamicOwners) {
        let jid = ownerObj.jid
        let name = ownerObj.name
        
        if (addedJids.has(jid) || ownerObj.show === false) continue
        
        let num = jid.split('@')[0]
        contacts.push({
            vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;${name};;;\nFN:${name}\nORG:Staff Collaboratore\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD`
        })
    }

    if (contacts.length === 0) return m.reply('`𐔌⚠️ ꒱` _Nessun staff pubblico trovato._')

    await conn.sendMessage(m.chat, {
        contacts: {
            displayName: `Staff`,
            contacts: contacts
        }
    }, { quoted: m })
}

handler.help = ['staff']
handler.tags = ['info']
handler.command = /^(staff|creatore|owner)$/i

export default handler