import { smsg } from './lib/simple.js'
import { format } from 'util'
import { fileURLToPath } from 'url'
import path, { join } from 'path'
import { unwatchFile, watchFile, writeFileSync, readFileSync } from 'fs'
import chalk from 'chalk'
import NodeCache from 'node-cache'
import { getAggregateVotesInPollMessage, toJid } from '@realvare/based'

global.db = JSON.parse(readFileSync('./database.json'))

export async function handler(chatUpdate) {
    this.msgqueues = this.msgqueues || []
    if (!chatUpdate) return
    this.pushMessage(chatUpdate.messages).catch(console.error)
    let m = chatUpdate.messages[chatUpdate.messages.length - 1]
    if (!m) return
    if (global.db.data == null) await global.loadDatabase()
    try {
        m = smsg(this, m) || m
        if (!m) return
        m.exp = 0
        m.euro = 0
        
        const jid = m.chat
        const isGroup = jid.endsWith('@g.us')

        // Database Update
        if (!global.db.users[m.sender]) global.db.users[m.sender] = { messages: 0 }
        global.db.users[m.sender].messages++
        if (isGroup) {
            if (!global.db.groups[jid]) global.db.groups[jid] = { messages: 0 }
            global.db.groups[jid].messages++
        }
        writeFileSync('./database.json', JSON.stringify(global.db, null, 2))

        if (m.isBaileys) return
        m.exp += Math.ceil(Math.random() * 10)

        const usedPrefix = (global.prefix.find(p => m.text.startsWith(p)) || '')
        const noPrefix = m.text.replace(usedPrefix, '').trim()
        const args = noPrefix.split(/ +/)
        const command = args.shift().toLowerCase()
        
        const groupMetadata = (isGroup ? await (global.groupCache.get(m.chat) || this.groupMetadata(m.chat)) : {}) || {}
        const participants = (isGroup ? groupMetadata.participants : []) || []
        const user = (isGroup ? participants.find(u => conn.decodeJid(u.id) === m.sender) : {}) || {} 
        const bot = (isGroup ? participants.find(u => conn.decodeJid(u.id) === this.user.jid) : {}) || {}
        
        const isRowner = global.owner.map(([number]) => number).map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isOwner = isRowner || global.owner.map(([number]) => number).map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender)
        const isAdmin = isOwner || user?.admin || false
        const isBotAdmin = bot?.admin || false

        for (let name in global.plugins) {
            let plugin = global.plugins[name]
            if (!plugin) continue
            if (plugin.disabled) continue
            const prefixReg = global.prefix instanceof RegExp ? global.prefix : /^[./!#]/
            let isAccept = plugin.command instanceof RegExp ? plugin.command.test(command) : Array.isArray(plugin.command) ? plugin.command.includes(command) : plugin.command === command

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