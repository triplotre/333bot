import { smsg } from './lib/simple.js'
import { writeFileSync, readFileSync, existsSync } from 'fs'
import chalk from 'chalk'
import { toJid } from '@realvare/based'

const dbPath = './database.json'
if (!existsSync(dbPath)) {
    writeFileSync(dbPath, JSON.stringify({ users: {}, groups: {}, chats: {}, settings: {} }, null, 2))
}

global.db = JSON.parse(readFileSync(dbPath))

export async function handler(chatUpdate) {
    this.msgqueues = this.msgqueues || []
    if (!chatUpdate) return
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    try {
        m = smsg(this, m) || m
        if (!m) return
        
        const jid = toJid(m.chat)
        const isGroup = jid.endsWith('@g.us')

        global.db.users = global.db.users || {}
        global.db.groups = global.db.groups || {}

        if (!global.db.users[m.sender]) global.db.users[m.sender] = { messages: 0 }
        global.db.users[m.sender].messages++
        
        if (isGroup) {
            if (!global.db.groups[jid]) global.db.groups[jid] = { messages: 0 }
            global.db.groups[jid].messages++
        }
        
        writeFileSync(dbPath, JSON.stringify(global.db, null, 2))

        if (m.isBaileys) return

        const mText = m.text || ''
        const _prefix = global.prefix || /^[./!#]/
        let usedPrefix = ''

        if (_prefix instanceof RegExp) {
            let match = mText.match(_prefix)
            if (match) usedPrefix = match[0]
        } else if (Array.isArray(_prefix)) {
            usedPrefix = _prefix.find(p => typeof p === 'string' && mText.startsWith(p)) || ''
        } else if (typeof _prefix === 'string') {
            if (mText.startsWith(_prefix)) usedPrefix = _prefix
        }

        const noPrefix = mText.replace(usedPrefix, '').trim()
        const args = noPrefix.split(/ +/)
        const command = args.shift().toLowerCase()
        
        const groupMetadata = (isGroup ? await (this.groupMetadata(jid).catch(() => ({}))) : {}) || {}
        const participants = (isGroup ? groupMetadata.participants : []) || []
        const user = (isGroup ? participants.find(u => this.decodeJid(u.id) === m.sender) : {}) || {} 
        const bot = (isGroup ? participants.find(u => this.decodeJid(u.id) === (this.user?.id ? toJid(this.user.id) : '')) : {}) || {}
        
        const isRowner = global.owner.map(([number]) => toJid(number.replace(/\D/g, '') + '@s.whatsapp.net')).includes(m.sender)
        const isOwner = isRowner || global.owner.map(([number]) => toJid(number.replace(/\D/g, '') + '@s.whatsapp.net')).includes(m.sender)
        const isAdmin = isOwner || user?.admin || false
        const isBotAdmin = bot?.admin || false

        if (!usedPrefix && isGroup) return

        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin || plugin.disabled) continue

            let isAccept = Array.isArray(plugin.command) ? 
                plugin.command.includes(command) : 
                (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command)

            if (isAccept) {
                m.plugin = name
                if (plugin.rowner && !isRowner) {
                    m.reply(global.dfail('rowner', m, this))
                    continue
                }
                if (plugin.owner && !isOwner) {
                    m.reply(global.dfail('owner', m, this))
                    continue
                }
                if (plugin.admin && !isAdmin) {
                    m.reply(global.dfail('admin', m, this))
                    continue
                }
                if (plugin.group && !isGroup) {
                    m.reply(global.dfail('group', m, this))
                    continue
                }
                if (plugin.botAdmin && !isBotAdmin) {
                    m.reply(global.dfail('botAdmin', m, this))
                    continue
                }

                try {
                    await plugin.call(this, m, {
                        conn: this,
                        args,
                        usedPrefix,
                        command,
                        isOwner,
                        isAdmin,
                        isBotAdmin,
                        participants,
                        groupMetadata,
                    })
                } catch (e) {
                    console.error(e)
                }
                break
            }
        }
    } catch (e) {
        console.error(e)
    }
}