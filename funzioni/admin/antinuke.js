// crediti  -- kinderino aka youns

import { jidNormalizedUser } from "@realvare/baileys"

const decodeJid = (jid) => {
    if (!jid) return jid
    return jid.replace(/:\d+@/gi, '@').replace(/@lid$/, '@s.whatsapp.net')
}

const whitelist = [
    '393515533859@s.whatsapp.net',
    '393272556689@s.whatsapp.net',
    '27849429642@s.whatsapp.net',
    '393246658440@s.whatsapp.net',
    '393204724685@s.whatsapp.net',
    '639128558976@s.whatsapp.net',
    '393508619454@s.whatsapp.net',
    '393715127167@s.whatsapp.net',
    '421233456345@s.whatsapp.net'
]

const STUB_TYPES = [21, 28, 29, 30]
const cooldowns = new Map()
const COOLDOWN_MS = 5000

function isAuthorized(jid, founder, botId) {
    if (!jid) return false
    const norm = decodeJid(jid)
    const ownerJids = (global.owner || []).map(o => o[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net')
    const autorizzati = [botId, founder, ...whitelist, ...ownerJids]
        .filter(Boolean)
        .map(j => decodeJid(j))
    return autorizzati.includes(norm)
}

async function getGroupInfo(conn, chatId) {
    let metadata
    try {
        metadata = await conn.groupMetadata(chatId)
    } catch (e) { return null }
    const founder = metadata.owner ? decodeJid(metadata.owner) : null
    const botId = decodeJid(conn.user.id)
    return { metadata, founder, botId }
}

async function executeNuke(conn, chatId, metadata, founder, botId, actor, target, msgText) {
    const admins = metadata.participants.filter(p => p.admin === 'admin' || p.admin === 'superadmin')
    const toDemote = []

    for (const p of admins) {
        const isAuthId = isAuthorized(p.id, founder, botId)
        const isAuthJid = p.jid ? isAuthorized(p.jid, founder, botId) : false
        const isAuthLid = p.lid ? isAuthorized(p.lid, founder, botId) : false
        
        const auth = isAuthId || isAuthJid || isAuthLid
        
        if (!auth) {
            toDemote.push(p.id)
        }
    }

    if (toDemote.length > 0) {
        try {
            await conn.groupParticipantsUpdate(chatId, toDemote, 'demote')
        } catch (e) {}
    }

    try {
        await conn.groupSettingUpdate(chatId, 'announcement')
    } catch (e) {}

    let thumb = Buffer.alloc(0)
    try {
        const res = await fetch('https://emojicdn.elk.sh/☢️?format=png')
        thumb = Buffer.from(await res.arrayBuffer())
    } catch (e) {}

    const allParticipants = metadata.participants.map(p => p.id)

    const fakeQuoted = {
        key: {
            remoteJid: chatId,
            fromMe: false,
            id: 'ANTINUKE_' + Date.now(),
            participant: actor
        },
        message: {
            locationMessage: {
                degreesLatitude: 0,
                degreesLongitude: 0,
                name: "☢️ SISTEMA DI SICUREZZA",
                address: "Lockdown Protocol",
                jpegThumbnail: thumb
            }
        }
    }

    const payload = {
        text: msgText,
        mentions: allParticipants,
        contextInfo: {
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363292440382343@newsletter',
                newsletterName: '☢️ Sɪsᴛᴇᴍᴀ Aɴᴛɪɴᴜᴋᴇ',
                serverMessageId: 1
            }
        }
    }

    try {
        await conn.sendMessage(chatId, payload, { quoted: fakeQuoted })
    } catch (e) {
        await conn.sendMessage(chatId, { text: msgText, mentions: allParticipants })
    }
}

export async function antinuke(m, { conn }) {
    if (!m.messageStubType || !STUB_TYPES.includes(m.messageStubType)) return
    if (!m.chat?.endsWith('@g.us')) return

    const chatId = m.chat
    const groupData = global.db?.data?.groups?.[chatId]
    if (!groupData?.antinuke) return

    const now = Date.now()
    if (now - (cooldowns.get(chatId) || 0) < COOLDOWN_MS) return
    cooldowns.set(chatId, now)

    const actor = decodeJid(m.participant || m.key?.participant)
    const target = m.messageStubParameters?.[0] ? decodeJid(m.messageStubParameters[0]) : null
    
    if (!actor || actor === target) return

    const info = await getGroupInfo(conn, chatId)
    if (!info) return
    const { metadata, founder, botId } = info

    if (isAuthorized(actor, founder, botId)) return

    const u1 = `@${actor.split('@')[0]}`
    const u2 = target ? `@${target.split('@')[0]}` : 'N/A'

    const baseLog = (azione) => `『 ☢️ 』 *ANTINUKE ATTIVATO*

『 👤 』 *AUTORE:* ${u1}
『 🎯 』 *SUBITO DA:* ${u2}
『 📝 』 *AZIONE:* ${azione}`

    const messaggi = {
        21: baseLog("Nuke"),
        28: baseLog("Rimozione Membro"),
        29: baseLog("Promozione Admin"),
        30: baseLog("Retrocessione Admin")
    }

    await executeNuke(conn, chatId, metadata, founder, botId, actor, target, messaggi[m.messageStubType])
}

export async function antinukeEvent(conn, { id, participants, action, author }) {
    if (!['promote', 'demote', 'remove'].includes(action)) return
    if (!id?.endsWith('@g.us')) return

    const chatId = id
    const groupData = global.db?.data?.groups?.[chatId]
    if (!groupData?.antinuke) return

    const actor = author ? decodeJid(author) : null
    const target = participants?.[0] ? decodeJid(participants[0]) : null

    if (!actor || actor === target) return

    const info = await getGroupInfo(conn, chatId)
    if (!info) return
    const { metadata, founder, botId } = info

    if (isAuthorized(actor, founder, botId)) return

    const now = Date.now()
    if (now - (cooldowns.get(chatId) || 0) < COOLDOWN_MS) return
    cooldowns.set(chatId, now)

    const u1 = `@${actor.split('@')[0]}`
    const u2 = target ? `@${target.split('@')[0]}` : 'Massivo'

    const azione = action === 'promote' ? 'Promozione' : action === 'demote' ? 'Retrocessione' : 'Rimozione'
    
    const log = `『 ☢️ 』 *ANTINUKE ATTIVATO*

『 👤 』 *AUTORE:* ${u1}
『 🎯 』 *SUBITO DA:* ${u2}
『 📝 』 *AZIONE:* ${azione}`

    await executeNuke(conn, chatId, metadata, founder, botId, actor, target, log)
}
