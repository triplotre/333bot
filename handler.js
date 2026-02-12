import { smsg } from './lib/simple.js'
import chalk from 'chalk'
import print from './lib/print.js'
import { prima as antiPrivato } from './funzioni/owner/antiprivato.js'
import rispondiGemini from './funzioni/owner/rispondi.js'
import { antilink } from './funzioni/admin/antilink.js'
import store from './lib/store.js'
import fs from 'fs'
import path from 'path'

function initDatabase() {
    const dbPath = path.join(process.cwd(), 'database.json')
    
    if (!fs.existsSync(dbPath)) {
        const initialData = {
            users: {},
            groups: {},
            chats: {},
            settings: {}
        }
        
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8')
        console.log(chalk.green('[Database] ✓ File database.json creato con successo!'))
    }
    
    try {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
        global.db = global.db || {}
        global.db.data = data
        
        global.db.data.users = global.db.data.users || {}
        global.db.data.groups = global.db.data.groups || {}
        global.db.data.chats = global.db.data.chats || {}
        global.db.data.settings = global.db.data.settings || {}
        
    } catch (e) {
        console.error(chalk.red('[Database Error]:'), e.message)
        global.db = { data: { users: {}, groups: {}, chats: {}, settings: {} } }
    }
}

function saveDatabase() {
    const dbPath = path.join(process.cwd(), 'database.json')
    try {
        fs.writeFileSync(dbPath, JSON.stringify(global.db.data, null, 2), 'utf-8')
    } catch (e) {
        console.error(chalk.red('[Database Save Error]:'), e.message)
    }
}

initDatabase()

setInterval(() => {
    if (global.db?.data) {
        saveDatabase()
    }
}, 5000)

export default async function handler(conn, chatUpdate) {
    if (!chatUpdate) return
    let m = chatUpdate
    
    if (!conn.loadMessage) {
        conn.loadMessage = (jid, id) => store.loadMessage(jid, id)
    }
    
    try {
        m = smsg(conn, m)
        if (!m || !m.message) return

        let txt = m.message.conversation || 
                  m.message.extendedTextMessage?.text || 
                  m.message.imageMessage?.caption || 
                  m.message.videoMessage?.caption || 
                  m.message.buttonsResponseMessage?.selectedButtonId || 
                  m.message.listResponseMessage?.singleSelectReply?.selectedRowId || 
                  m.message.templateButtonReplyMessage?.selectedId || 
                  m.message.interactiveResponseMessage?.body?.text ||
                  m.msg?.text || 
                  m.msg?.caption || 
                  m.text || ''
        
        m.text = txt.trim()

        const msg = m.message
        const type = Object.keys(msg)[0]
        const contextInfo = msg[type]?.contextInfo

        if (contextInfo?.quotedMessage) {
            const quotedMsg = {
                key: {
                    remoteJid: m.chat,
                    fromMe: contextInfo.participant === conn.decodeJid(conn.user.id),
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant || m.chat
                },
                message: contextInfo.quotedMessage,
                messageTimestamp: contextInfo.quotedStanzaID || Date.now()
            }
            
            let quoted = smsg(conn, quotedMsg)
            
            const qType = Object.keys(contextInfo.quotedMessage)[0]
            if (contextInfo.quotedMessage[qType]?.mimetype && !quoted.mimetype) {
                quoted.mimetype = contextInfo.quotedMessage[qType].mimetype
            }
            
            if (!quoted.mediaMessage && contextInfo.quotedMessage[qType]?.url) {
                const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage']
                if (mediaTypes.includes(qType)) {
                    quoted.mediaMessage = contextInfo.quotedMessage
                    quoted.mediaType = qType
                }
            }
            
            m.quoted = quoted
        }

        const jid = m.chat
        const isGroup = jid.endsWith('@g.us')
        const isChannel = jid.endsWith('@newsletter')
        const botId = conn.decodeJid(conn.user.id)
        
        const sender = m.sender
        m.senderLid = m.key.participant?.endsWith('@lid') ? m.key.participant : 'N/A'
        const senderNum = sender.replace(/[^0-9]/g, '')
        const isOwner = global.owner.some(o => o[0].replace(/[^0-9]/g, '') === senderNum)

        let isAdmin = false
        let isBotAdmin = false
        let participants = []
        let groupMetadata = {}

        if (isGroup) {
            groupMetadata = await conn.groupMetadata(jid).catch(() => ({}))
            participants = groupMetadata.participants || []
            
            const userObj = participants.find(p => 
                p.id === sender || p.id === m.senderLid || p.lid === sender || p.lid === m.senderLid
            )
            const botObj = participants.find(p => p.id === botId || p.id === conn.user.lid)

            isAdmin = userObj?.admin !== null || isOwner
            isBotAdmin = botObj?.admin !== null
        } else {
            isAdmin = isOwner
        }

        m.isAdmin = isAdmin
        m.isBotAdmin = isBotAdmin
        m.isOwner = isOwner
        m.userRole = isOwner ? 'OWNER' : (isAdmin ? 'ADMIN' : 'MEMBRO')
        m.botRole = isBotAdmin ? 'ADMIN' : 'MEMBRO'

        if (!global.db?.data) {
            initDatabase()
        }

        if (sender) {
            if (!global.db.data.users[sender]) {
                global.db.data.users[sender] = {
                    messages: 0,
                    warns: {}
                }
            }
            global.db.data.users[sender].messages = (global.db.data.users[sender].messages || 0) + 1
        }

        if (isGroup) {
            // Chat di gruppo
            if (!global.db.data.groups[jid]) {
                global.db.data.groups[jid] = {
                    messages: 0,
                    rileva: false,
                    welcome: true,
                    antilink: true
                }
            }
            global.db.data.groups[jid].messages = (global.db.data.groups[jid].messages || 0) + 1
            
        } else if (isChannel) {
            // Canale (newsletter)
            if (!global.db.data.chats[jid]) {
                global.db.data.chats[jid] = {
                    messages: 0,
                    type: 'channel'
                }
            }
            global.db.data.chats[jid].messages = (global.db.data.chats[jid].messages || 0) + 1
            
        } else {
            if (!global.db.data.chats[jid]) {
                global.db.data.chats[jid] = {
                    messages: 0,
                    type: 'private'
                }
            }
            global.db.data.chats[jid].messages = (global.db.data.chats[jid].messages || 0) + 1
        }

        if (isGroup && global.db.data.groups[jid]?.antilink) {
            if (await antilink(m, { conn, isAdmin, isBotAdmin, users: global.db.data.users })) return
        }

        await print(m, conn)
        
        if (m.key.fromMe) return

        await antiPrivato.call(conn, m, { isOwner })
        
        if (global.db.data.settings?.[botId]?.ai_rispondi && m.text) {
            try {
                await rispondiGemini(m, { conn, isOwner })
            } catch (e) {
                console.error(chalk.red('[Gemini Error]:'), e.message)
            }
        }

        const messageText = m.text || ''
        let usedPrefix = ''
        const _prefix = global.prefix

        if (_prefix instanceof RegExp) {
            if (_prefix.test(messageText)) usedPrefix = messageText.match(_prefix)[0]
        } else if (typeof _prefix === 'string' && messageText.startsWith(_prefix)) {
            usedPrefix = _prefix
        }

        if (!usedPrefix) return

        const args = messageText.slice(usedPrefix.length).trim().split(/ +/)
        const command = args.shift().toLowerCase()
        const text = args.join(' ')

        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue
            
            const isAccept = Array.isArray(plugin.command) ? 
                plugin.command.includes(command) : 
                (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command)

            if (isAccept) {
                if (plugin.owner && !isOwner) { await global.dfail('owner', m, conn); continue }
                if (plugin.restricted && !isAdmin) { await global.dfail('restricted', m, conn); continue }
                if (plugin.group && !isGroup) { await global.dfail('group', m, conn); continue }
                if (plugin.private && isGroup) { await global.dfail('private', m, conn); continue }
                if (plugin.admin && !isAdmin) { await global.dfail('admin', m, conn); continue }
                if (plugin.botAdmin && !isBotAdmin) { await global.dfail('botAdmin', m, conn); continue }

                try {
                    await plugin(m, { 
                        conn, args, text, usedPrefix, command, 
                        isOwner, isAdmin, isBotAdmin, 
                        participants, groupMetadata, isGroup 
                    })
                } catch (e) {
                    console.error(e)
                }
                break
            }
        }
    } catch (e) {
        console.error(chalk.red('[Handler Error]:'), e)
    }
}

global.dfail = async (type, m, conn) => {
    const msg = {
        owner: '`𐔌👑꒱` _*Solo il proprietario del bot può usare questo comando!*_',
        admin: '`𐔌🛡️ ꒱` _*Solo gli amministratori del gruppo possono usare questo comando!*_',
        restricted: '`𐔌🚫 ꒱` _*Questo comando è limitato solo agli amministratori!*_',
        group: '`𐔌👥 ꒱` _*Questo comando può essere usato solo in chat di gruppo!*_',
        private: '`𐔌📩 ꒱` _*Questo comando può essere usato solo in chat privata!*_',
        disabled: '`𐔌🔒 ꒱` _*Questo comando è stato disattivato dall\'owner!*_',
        botAdmin: '`𐔌🤖 ꒱` _*Devo essere admin per eseguire questo comando!*_'
    }[type]

    if (msg) {
        return conn.sendMessage(m.chat, {
            text: msg,
            ...global.newsletter()
        }, { quoted: m })
    }
}

export { initDatabase, saveDatabase }