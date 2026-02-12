import axios from 'axios'
import fs from 'fs'
import { join } from 'path'
import PhoneNumber from 'awesome-phonenumber'

const BROWSERLESS_KEY = global.APIKeys?.browserless
const LASTFM_API_KEY = global.APIKeys?.lastfm
const tmpDir = './media/tmp/info'
const defCover = 'https://i.ibb.co/hJW7WwxV/varebot.jpg'

// Funzione per rilevare il dispositivo basata sull'ID del messaggio
const getDevice = (m) => {
    const id = m.key.id
    if (id.length > 21) return 'Android'
    if (id.substring(0, 2) === '3A') return 'iOS (iPhone)'
    if (id.length < 20) return 'Desktop / Web'
    return 'WhatsApp'
}

async function apiCall(method, params) {
    try {
        const query = new URLSearchParams({ method, api_key: LASTFM_API_KEY, format: 'json', ...params })
        const res = await axios.get(`https://ws.audioscrobbler.com/2.0/?${query}`, { timeout: 5000 })
        return res.data
    } catch { return {} }
}

const handler = async (m, { conn, usedPrefix, isOwner, isAdmin }) => {
    const device = getDevice(m)
    const jid = m.sender
    const number = jid.split('@')[0]
    
    const nomeUtente = await conn.getName(jid) || m.pushName || number
    const formattedNumber = PhoneNumber('+' + number).getNumber('international')
    
    // Usiamo m.userRole già calcolato dall'handler
    const role = m.userRole || 'MEMBRO'
    
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

    let pfp
    try {
        pfp = await conn.profilePictureUrl(jid, 'image')
    } catch {
        pfp = 'https://i.ibb.co/Gwbg90w/idk17.jpg'
    }

    // --- LETTURA DATI DA GLOBAL.DB.DATA ---
    // L'handler inizializza già l'utente, quindi i dati ci sono sicuramente
    const usersDb = global.db.data.users || {}
    const userData = usersDb[jid] || {}

    let userMsgs = userData.messages || 0
    let warnsCount = userData.warns ? Object.keys(userData.warns).length : 0
    let globalRank = 'N/A'

    // Calcolo Rank filtrando solo gli utenti (escludendo gruppi/newsletter dal calcolo)
    const allUsers = Object.entries(usersDb)
        .filter(([id, data]) => (id.endsWith('@s.whatsapp.net') || id.endsWith('@lid')) && data.messages > 0)
        .sort((a, b) => (b[1].messages || 0) - (a[1].messages || 0))
    
    const rankIndex = allUsers.findIndex(([id]) => id === jid || id === m.senderLid)
    globalRank = rankIndex !== -1 ? rankIndex + 1 : 'N/A'

    const htmlProfilo = `<html><head><style>
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;700;900&display=swap');
        body { margin: 0; padding: 0; width: 1280px; height: 720px; display: flex; align-items: center; justify-content: center; font-family: 'Figtree', sans-serif; background: #000; overflow: hidden; }
        .bg { position: absolute; width: 100%; height: 100%; background: url('${pfp}') center/cover; filter: blur(60px) brightness(0.35); transform: scale(1.1); }
        .container { position: relative; width: 1050px; height: 520px; background: rgba(255, 255, 255, 0.04); backdrop-filter: blur(35px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 60px; display: flex; align-items: center; padding: 50px; box-sizing: border-box; }
        .pfp-circle { width: 340px; height: 340px; border-radius: 50%; border: 8px solid rgba(255,255,255,0.1); background: url('${pfp}') center/cover; box-shadow: 0 25px 50px rgba(0,0,0,0.5); }
        .info { margin-left: 60px; color: white; flex-grow: 1; }
        .name { font-size: 60px; font-weight: 900; margin-bottom: 5px; color: #fff; text-transform: uppercase; letter-spacing: -1.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 550px; }
        .role-tag { display: inline-block; background: rgba(255,255,255,0.15); padding: 5px 18px; border-radius: 14px; font-size: 18px; font-weight: 800; margin-bottom: 25px; color: #00d4ff; text-transform: uppercase; letter-spacing: 1px; }
        .number { font-size: 26px; color: rgba(255,255,255,0.5); margin-bottom: 35px; font-weight: 700; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .stat-card { background: rgba(255,255,255,0.06); padding: 22px 28px; border-radius: 28px; border: 1px solid rgba(255,255,255,0.08); }
        .stat-label { font-size: 13px; text-transform: uppercase; color: rgba(255,255,255,0.4); font-weight: 800; letter-spacing: 2px; margin-bottom: 5px; }
        .stat-value { font-size: 30px; font-weight: 900; color: #fff; }
    </style></head><body>
        <div class="bg"></div>
        <div class="container">
            <div class="pfp-circle"></div>
            <div class="info">
                <div class="name">${nomeUtente}</div>
                <div class="role-tag">${role}</div>
                <div class="number">${formattedNumber}</div>
                <div class="grid">
                    <div class="stat-card"><div class="stat-label">Messaggi</div><div class="stat-value">${userMsgs}</div></div>
                    <div class="stat-card"><div class="stat-label">Warns</div><div class="stat-value">${warnsCount}</div></div>
                    <div class="stat-card"><div class="stat-label">Rank</div><div class="stat-value">#${globalRank}</div></div>
                    <div class="stat-card"><div class="stat-label">Device</div><div class="stat-value">${device}</div></div>
                </div>
            </div>
        </div>
    </body></html>`

    const txtProfilo = `
╭┈  『 👤 』 \`utente\` ─ ${nomeUtente}
┆  『 🛡️ 』 \`ruolo\` ─ *${role}*
┆  『 💬 』 \`statistiche\`
┆  ╰➤  \`messaggi\` ─ *${userMsgs}*
┆  ╰➤  \`warns\` ─ *${warnsCount}*
┆  ╰➤  \`rank\` ─ *#${globalRank}*
╰┈➤ 『 📦 』 \`declare system\`
`.trim()

    try {
        const ssProfilo = await axios.post(`https://chrome.browserless.io/screenshot?token=${BROWSERLESS_KEY}`, {
            html: htmlProfilo,
            options: { type: 'jpeg', quality: 90 },
            viewport: { width: 1280, height: 720 }
        }, { responseType: 'arraybuffer' })

        const fileProfilo = join(tmpDir, `info_${Date.now()}.jpg`)
        fs.writeFileSync(fileProfilo, Buffer.from(ssProfilo.data))

        await conn.sendMessage(m.chat, { image: { url: fileProfilo }, caption: txtProfilo }, { quoted: m })
        
        // Pulizia file temporaneo
        setTimeout(() => { if (fs.existsSync(fileProfilo)) fs.unlinkSync(fileProfilo) }, 10000)

    } catch (e) {
        // Fallback se browserless fallisce
        await conn.sendMessage(m.chat, { image: { url: pfp }, caption: txtProfilo }, { quoted: m })
    }
}

handler.command = ['info', 'profilo', 'profile']
export default handler