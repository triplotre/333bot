import { smsg } from './lib/simple.js'
import chalk from 'chalk'
import print from './lib/print.js'
import { prima as antiPrivato } from './funzioni/owner/antiprivato.js'
import rispondiGemini from './funzioni/owner/rispondi.js'
import { antilink } from './funzioni/admin/antilink.js'
import store from './lib/store.js'
import fs from 'fs'
import { promises as fsAsync } from 'fs'
import path from 'path'
import { downloadContentFromMessage } from '@realvare/baileys'

let dbDirty = false
let isSaving = false

const decodeJid = (jid) => {
    if (!jid) return jid
    if (/:\d+@/gi.test(jid)) {
        const decode = jid.split(':')[0]
        const server = jid.split('@')[1]
        return decode + '@' + server
    }
    return jid
}

const areJidsSameUser = (jid1, jid2) => {
    if (!jid1 || !jid2) return false
    const n1 = jid1.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
    const n2 = jid2.split('@')[0].split(':')[0].replace(/[^0-9]/g, '')
    return n1 === n2
}

function initDatabase() {
    const dbPath = path.join(process.cwd(), 'database.json')
    if (!fs.existsSync(dbPath)) {
        const initialData = { users: {}, groups: {}, chats: {}, settings: {} }
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2), 'utf-8')
    }
    
    if (!global.db) {
        try {
            const data = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
            global.db = {
                data: {
                    users: data.users || {},
                    groups: data.groups || {},
                    chats: data.chats || {},
                    settings: data.settings || {}
                }
            }
        } catch (e) {
            global.db = { data: { users: {}, groups: {}, chats: {}, settings: {} } }
        }
    }
}

async function saveDatabase() {
    if (!dbDirty || !global.db?.data || isSaving) return
    isSaving = true
    const dbPath = path.join(process.cwd(), 'database.json')
    try {
        dbDirty = false 
        
        const cleanDb = ['chats', 'groups']
        for (const type of cleanDb) {
            for (const jid in global.db.data[type]) {
                const chatData = global.db.data[type][jid]
                if (chatData) {
                    delete chatData.metadata
                    delete chatData.participants
                    delete chatData.desc
                    delete chatData.owner
                    delete chatData.ownerLid
                    delete chatData.subjectOwner
                    delete chatData.subjectOwnerLid
                    delete chatData.subjectTime
                    delete chatData.size
                    delete chatData.creation
                    delete chatData.descId
                    delete chatData.descTime
                    delete chatData.linkedParent
                    delete chatData.restrict
                    delete chatData.announce
                    delete chatData.isCommunity
                    delete chatData.isCommunityAnnounce
                    delete chatData.joinApprovalMode
                    delete chatData.memberAddMode
                    
                    if (type === 'chats' && jid.endsWith('@g.us')) {
                        delete global.db.data.chats[jid]
                    }
                }
            }
        }

        await fsAsync.writeFile(dbPath, JSON.stringify(global.db.data, null, 2), 'utf-8')
    } catch (e) {
        console.error(chalk.red('[DB Save Error]:'), e.message)
        dbDirty = true 
    } finally {
        isSaving = false
    }
}

initDatabase()

if (global.db_interval) clearInterval(global.db_interval)
global.db_interval = setInterval(saveDatabase, 15000)

export default async function handler(conn, chatUpdate) {
    if (!chatUpdate) return
    let m = chatUpdate
    
    if (!conn.loadMessage) {
        conn.loadMessage = (jid, id) => store.loadMessage(jid, id)
    }
    
    try {
        m = smsg(conn, m)
        if (!m || !m.message) return

        const fixDownload = (msg) => {
            if (!msg) return
            msg.download = async () => {
                try {
                    let mtype = msg.mtype || msg.mediaType || Object.keys(msg.message || msg.msg || {})[0]
                    if (mtype === 'viewOnceMessage' || mtype === 'viewOnceMessageV2') {
                        const innerMsg = msg.message[mtype].message
                        mtype = Object.keys(innerMsg)[0]
                        msg.msg = innerMsg[mtype]
                    }
                    const rawContent = msg.msg || msg.message || msg
                    const mediaObj = rawContent[mtype] || rawContent
                    
                    const stream = await downloadContentFromMessage(mediaObj, mtype.replace('Message', ''))
                    let buffer = Buffer.from([])
                    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk])
                    return buffer
                } catch (e) {
                    console.error('[Download Error]:', e.message)
                    return null
                }
            }
        }
        fixDownload(m)
        if (m.quoted) fixDownload(m.quoted)

        const msgType = Object.keys(m.message)[0]
        const msgContent = m.message[msgType]
        
        let txt = m.message.conversation || 
                  m.message.extendedTextMessage?.text || 
                  m.message.imageMessage?.caption || 
                  m.message.videoMessage?.caption || 
                  m.message.buttonsResponseMessage?.selectedButtonId || 
                  m.message.listResponseMessage?.singleSelectReply?.selectedRowId || 
                  m.message.templateButtonReplyMessage?.selectedId || 
                  m.message.interactiveResponseMessage?.body?.text || 
                  msgContent?.text || 
                  msgContent?.caption || 
                  m.text || ''
        
        m.text = txt.trim()

        const contextInfo = msgContent?.contextInfo
        if (contextInfo?.quotedMessage) {
            const quotedMsg = {
                key: {
                    remoteJid: m.chat,
                    fromMe: contextInfo.participant === conn.decodeJid(conn.user.id),
                    id: contextInfo.stanzaId,
                    participant: contextInfo.participant
                },
                message: contextInfo.quotedMessage,
                messageTimestamp: contextInfo.quotedStanzaID || Date.now()
            }
            m.quoted = smsg(conn, quotedMsg)
            fixDownload(m.quoted) 
        }

        const jid = m.chat
        const isGroup = jid.endsWith('@g.us')
        const isChannel = jid.endsWith('@newsletter')
        
        const botId = decodeJid(conn.user.id)
        const sender = decodeJid(m.sender)
        const senderLid = m.key.participant?.endsWith('@lid') ? decodeJid(m.key.participant) : null
        
        m.senderLid = senderLid || 'N/A'
        
        const senderNum = sender.split('@')[0].replace(/[^0-9]/g, '')
        const isOwner = global.owner.some(o => o[0].replace(/[^0-9]/g, '') === senderNum)

        const bannedPath = path.join(process.cwd(), 'media', 'banned.json')
        if (!fs.existsSync(path.dirname(bannedPath))) fs.mkdirSync(path.dirname(bannedPath), { recursive: true })
        if (!fs.existsSync(bannedPath)) fs.writeFileSync(bannedPath, JSON.stringify({ users: [], chats: [] }, null, 2))
        
        let bannedData = { users: [], chats: [] }
        try { bannedData = JSON.parse(fs.readFileSync(bannedPath, 'utf-8')) } catch (e) {}

        if (!isOwner) {
            if ((bannedData.users && bannedData.users.includes(sender)) || 
                (bannedData.chats && bannedData.chats.includes(jid))) {
                return 
            }
        }
      

        let isAdmin = false
        let isBotAdmin = false
        let isRealAdmin = false 
        let participants = []
        let groupAdmins = []

        if (isGroup) {
            participants = conn.chats?.[jid]?.metadata?.participants || []
            
            if (!participants.length) {
                try {
                    const groupMetadata = await conn.groupMetadata(jid)
                    participants = groupMetadata.participants || []
                } catch (e) {
                    participants = []
                }
            }
            
            const userObj = participants.find(p => {
                const pJid = p.jid ? decodeJid(p.jid) : null
                const pId = decodeJid(p.id)
                
                if (pJid && areJidsSameUser(pJid, sender)) return true
                if (areJidsSameUser(pId, sender)) return true
                
                if (senderLid) {
                    const pLid = p.lid ? decodeJid(p.lid) : null
                    if (pLid && areJidsSameUser(pLid, senderLid)) return true
                    if (pId.endsWith('@lid') && areJidsSameUser(pId, senderLid)) return true
                }
                return false
            })

            const botObj = participants.find(p => {
                const pJid = p.jid ? decodeJid(p.jid) : null
                const pId = decodeJid(p.id)
                
                if (pJid && areJidsSameUser(pJid, botId)) return true
                if (areJidsSameUser(pId, botId)) return true
                
                if (conn.user.lid) {
                    const botLid = decodeJid(conn.user.lid)
                    const pLid = p.lid ? decodeJid(p.lid) : null
                    if (pLid && areJidsSameUser(pLid, botLid)) return true
                    if (pId.endsWith('@lid') && areJidsSameUser(pId, botLid)) return true
                }
                return false
            })

            isRealAdmin = (userObj?.admin === 'admin' || userObj?.admin === 'superadmin')
            isBotAdmin = (botObj?.admin === 'admin' || botObj?.admin === 'superadmin')
            isAdmin = isRealAdmin || isOwner

            groupAdmins = participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        } else {
            isAdmin = isOwner
            isRealAdmin = false
        }

        m.isAdmin = isAdmin
        m.isBotAdmin = isBotAdmin
        m.isOwner = isOwner
        m.isRealAdmin = isRealAdmin
        m.groupAdmins = groupAdmins

        m.userRole = isOwner ? 'OWNER' : (isAdmin ? 'ADMIN' : 'MEMBRO')
        m.botRole = isBotAdmin ? 'ADMIN' : 'MEMBRO'

        if (!global.db.data.users[sender]) {
            global.db.data.users[sender] = { messages: 0, warns: {} }
        }
        global.db.data.users[sender].messages += 1
        dbDirty = true

        if (isGroup) {
            if (!global.db.data.groups[jid]) {
                global.db.data.groups[jid] = { messages: 0, rileva: false, welcome: true, antilink: true }
            }
            global.db.data.groups[jid].messages += 1
            dbDirty = true
        } else if (isChannel) {
            if (!global.db.data.chats[jid]) global.db.data.chats[jid] = { messages: 0, type: 'channel' }
            global.db.data.chats[jid].messages += 1
            dbDirty = true
        } else {
            if (!global.db.data.chats[jid]) global.db.data.chats[jid] = { messages: 0, type: 'private' }
            global.db.data.chats[jid].messages += 1
            dbDirty = true
        }

        if (isGroup && global.db.data.groups[jid]?.antilink) {
            if (await antilink(m, { conn, isAdmin, isBotAdmin, users: global.db.data.users })) return
        }

        await print(m, conn)
        
        if (m.key.fromMe) return

        if (!isGroup && !isOwner && m.text) {
            const buttons = global.owner.map(o => {
                const ownerNum = o[0].replace(/[^0-9]/g, '')
                const ownerName = o[1] || 'Owner'
                const waLink = `https://wa.me/${ownerNum}`
                
                return {
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: `💬 Contatta ${ownerName}`,
                        url: waLink,
                        merchant_url: waLink
                    })
                }
            })

            const interactiveMessage = {
                viewOnceMessage: {
                    message: {
                        interactiveMessage: {
                            header: { title: '', hasMediaAttachment: false },
                            body: { 
                                text: "Ciao, sono un bot WhatsApp e quindi non sono in grado di risponderti in modo autonomo, contatta un mio proprietario per esprimere la tua richiesta.\n\n> Premi un bottone in basso per contattare un proprietario" 
                            },
                            footer: { text: "" },
                            nativeFlowMessage: {
                                buttons: buttons,
                                messageParamsJson: ''
                            },
                            contextInfo: {
                                mentionedJid: [m.sender],
                                quotedMessage: m.message
                            }
                        }
                    }
                }
            }

            await conn.relayMessage(m.chat, interactiveMessage, {})
            return 
        }

        await antiPrivato.call(conn, m, { isOwner })
        
        if (global.db.data.settings?.[botId]?.ai_rispondi && m.text) {
            try { await rispondiGemini(m, { conn, isOwner }) } catch (e) {}
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
            if (!plugin) continue
            
            const isAccept = Array.isArray(plugin.command) ? 
                plugin.command.includes(command) : 
                (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command)

            if (isAccept) {
                if (plugin.disabled || plugin.restricted) {
                    await global.dfail('disabled', m, conn, { usedPrefix, command })
                    continue
                }

                if (plugin.owner && !isOwner) { await global.dfail('owner', m, conn); continue }
                if (plugin.group && !isGroup) { await global.dfail('group', m, conn); continue }
                if (plugin.private && isGroup) { await global.dfail('private', m, conn); continue }
                if (plugin.admin && !isAdmin) { await global.dfail('admin', m, conn); continue }
                if (plugin.botAdmin && !isBotAdmin) { await global.dfail('botAdmin', m, conn); continue }

                try {
                    await plugin(m, { 
                        conn, args, text, usedPrefix, command, 
                        isOwner, isAdmin, isBotAdmin, 
                        participants, groupAdmins, isGroup 
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

global.dfail = async (type, m, conn, extra = {}) => {
    if (type === 'disabled' || type === 'restricted') {
        const ownerNum = global.owner[0][0].replace(/[^0-9]/g, '')
        const ownerName = global.owner[0][1]
        const p = extra.usedPrefix || ''
        const c = extra.command || ''
        
        const textMsg = `Ciao ${ownerName}, il comando ${p}${c} è disattivato. Per quale motivo?`
        const waLink = `https://wa.me/${ownerNum}?text=${encodeURIComponent(textMsg)}`
        const canale = 'https://shortzyk.vercel.app/zykwzp'
        
        const msg = {
            viewOnceMessage: {
                message: {
                    interactiveMessage: {
                        header: { title: '', hasMediaAttachment: false },
                        body: { text: "`𐔌🔒 ꒱` _*Questo comando è stato disabilitato, contatta l'owner per info.*_" },
                        footer: { text: "" },
                        nativeFlowMessage: {
                            buttons: [
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '💬 Contatta Owner',
                                        url: waLink,
                                        merchant_url: waLink
                                    })
                                },
                                {
                                    name: 'cta_url',
                                    buttonParamsJson: JSON.stringify({
                                        display_text: '💬 Controlla il Canale',
                                        url: canale,
                                        merchant_url: canale
                                    })
                                }
                            ],
                            messageParamsJson: ''
                        },
                        contextInfo: {
                            mentionedJid: [m.sender],
                            stanzaId: m.key.id,
                            participant: m.sender,
                            quotedMessage: m.message
                        }
                    }
                }
            }
        }
        return conn.relayMessage(m.chat, msg, {})
    }

    const msgTexts = {
        owner: '`𐔌👑꒱` _*Solo il proprietario del bot può usare questo comando!*_',
        admin: '`𐔌🛡️ ꒱` _*Solo gli amministratori del gruppo possono usare questo comando!*_',
        group: '`𐔌👥 ꒱` _*Questo comando può essere usato solo in chat di gruppo!*_',
        private: '`𐔌📩 ꒱` _*Questo comando può essere usato solo in chat privata!*_',
        botAdmin: '`𐔌🤖 ꒱` _*Devo essere admin per eseguire questo comando!*_'
    }

    if (msgTexts[type]) {
        return conn.sendMessage(m.chat, {
            text: msgTexts[type],
            ...global.newsletter()
        }, { quoted: m })
    }
}

export { initDatabase, saveDatabase }