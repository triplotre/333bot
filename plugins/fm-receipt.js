import axios from 'axios'
import fs from 'fs'

const dbPath = './media/lastfm.json'

const buildReceiptHtml = (data, user, type, totalScrobbles) => {
    const date = new Date().toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@800;900&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
        width: 1080px; height: 1440px; background: #e0e0e0; margin: 0; padding: 0; 
        display: flex; justify-content: center; align-items: center;
        font-family: 'DM Sans', sans-serif;
    }
    .paper {
        width: 820px; background: #fff; padding: 60px 50px;
        position: relative; box-shadow: 0 40px 80px rgba(0,0,0,0.3);
        color: #222;
    }
    .paper::before, .paper::after {
        content: ""; position: absolute; top: 0; bottom: 0; width: 35px;
        background-image: radial-gradient(circle, #e0e0e0 40%, transparent 45%);
        background-size: 35px 50px; z-index: 2;
    }
    .paper::before { left: 8px; }
    .paper::after { right: 8px; }

    .rip {
        position: absolute; left: 0; width: 100%; height: 25px;
        background: linear-gradient(-45deg, #e0e0e0 12px, transparent 0), linear-gradient(45deg, #e0e0e0 12px, transparent 0);
        background-size: 24px 24px;
    }
    .rip-top { top: -1px; transform: rotate(180deg); }
    .rip-bottom { bottom: -1px; }

    .header { text-align: center; border-bottom: 3px dashed #444; padding-bottom: 30px; margin-bottom: 30px; }
    .logo { font-family: 'Syne', sans-serif; font-size: 75px; font-weight: 900; margin: 0; letter-spacing: 8px; }
    
    .item-table { width: 100%; border-collapse: collapse; margin: 30px 0; }
    .item-table th { font-family: 'Syne', sans-serif; border-bottom: 2px solid #444; padding: 12px 0; text-align: left; font-size: 24px; font-weight: 800; }
    .item-row td { padding: 15px 0; font-size: 22px; text-transform: uppercase; font-weight: 500; }
    .qty { width: 60px; color: #666; font-family: 'Syne', sans-serif; }
    .price { text-align: right; font-weight: 700; font-family: 'Syne', sans-serif; }

    .divider { border-top: 3px dashed #444; margin: 30px 0; }
    .total-line { display: flex; justify-content: space-between; font-family: 'Syne', sans-serif; font-size: 40px; font-weight: 900; padding: 15px 0; }
    
    .footer { text-align: center; margin-top: 40px; font-size: 20px; color: #444; }
    .barcode { font-size: 70px; margin-top: 20px; letter-spacing: 12px; opacity: 0.8; }
</style>
</head>
<body>
    <div class="paper">
        <div class="rip rip-top"></div>
        <div class="header">
            <div class="logo">444.FM</div>
            <div style="margin-top: 15px; font-size: 22px; font-weight: 500;">ORDER #${Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
            <div style="font-size: 22px;">UTENTE: @${user}</div>
            <div style="font-size: 22px;">${date}</div>
        </div>

        <div style="text-align: center; font-family: 'Syne', sans-serif; font-weight: 900; font-size: 30px; margin-bottom: 15px; text-transform: uppercase;">
            TOP ${type} (ALL TIME)
        </div>

        <table class="item-table">
            <thead>
                <tr>
                    <th class="qty">#</th>
                    <th>DESCRIPTION</th>
                    <th class="price">SCROBBLES</th>
                </tr>
            </thead>
            <tbody>
                ${data.map((item, i) => `
                <tr class="item-row">
                    <td class="qty">${i + 1}</td>
                    <td>${item.name.substring(0, 20)}${item.name.length > 20 ? '..' : ''}</td>
                    <td class="price">${Number(item.playcount).toLocaleString('it-IT')}</td>
                </tr>`).join('')}
            </tbody>
        </table>

        <div class="divider"></div>
        <div class="total-line">
            <span>TOTAL AMOUNT:</span>
            <span>${totalScrobbles.toLocaleString('it-IT')}</span>
        </div>
        <div class="divider"></div>

        <div class="footer">
            <p>GRAZIE PER AVER USATO 444.FM<br>annoyed system v3.0</p>
            <div class="barcode">|||| || |||| || |||</div>
        </div>
        <div class="rip rip-bottom"></div>
    </div>
</body>
</html>`
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
    const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    const user = db[m.sender]
    const apiKey = global.APIKeys?.lastfm
    const browserlessKey = global.APIKeys?.browserless

    if (!apiKey || !browserlessKey) return m.reply('_API non configurate._')
    if (!user) return m.reply(`_Registrati con ${usedPrefix}fmset_`)

    if (!text) {
        const sections = [{
            title: "Seleziona Formato",
            rows: [
                { title: "Songs", rowId: `${usedPrefix + command} songs`, description: "Classifica canzoni All Time" },
                { title: "Autori", rowId: `${usedPrefix + command} autori`, description: "Classifica artisti All Time" },
                { title: "Album", rowId: `${usedPrefix + command} album`, description: "Classifica album All Time" }
            ]
        }]
        return await conn.sendMessage(m.chat, {
            text: `╭┈➤ 『 🧾 』 *444.FM RECEIPT*\n┆\n┆  Scegli il tipo di scontrino\n┆  per generare la tua top All Time.\n╰┈➤ 『 📦 』 \`annoyed system\``,
            buttonText: "Scegli tipo",
            sections,
            footer: global.creatore,
            ...global.newsletter()
        }, { quoted: m })
    }

    await conn.sendPresenceUpdate('composing', m.chat)

    try {
        let method, typeLabel
        const input = text.toLowerCase()

        if (input === 'autori') {
            method = 'user.gettopartists'; typeLabel = 'autori'
        } else if (input === 'album') {
            method = 'user.gettopalbums'; typeLabel = 'album'
        } else {
            method = 'user.gettoptracks'; typeLabel = 'songs'
        }

        const res = await axios.get(`https://ws.audioscrobbler.com/2.0/`, {
            params: { method, user, api_key: apiKey, period: 'overall', limit: 50, format: 'json' }
        })

        const userRes = await axios.get(`https://ws.audioscrobbler.com/2.0/`, {
            params: { method: 'user.getinfo', user, api_key: apiKey, format: 'json' }
        })

        let rawData = res.data.topartists?.artist || res.data.topalbums?.album || res.data.toptracks?.track
        if (!rawData) return m.reply('_Nessun dato trovato._')

        // Fusione e Ri-ordinamento
        let mergedMap = {}
        rawData.forEach(item => {
            const key = item.name.toLowerCase().trim()
            if (mergedMap[key]) {
                mergedMap[key].playcount = parseInt(mergedMap[key].playcount) + parseInt(item.playcount)
            } else {
                mergedMap[key] = { ...item, playcount: parseInt(item.playcount) }
            }
        })

        const sortedData = Object.values(mergedMap)
            .sort((a, b) => b.playcount - a.playcount)
            .slice(0, 10) // Limitato a 10 per far entrare tutto nel formato 4:3

        const totalScrobbles = userRes.data.user?.playcount || 0
        const html = buildReceiptHtml(sortedData, user, typeLabel, totalScrobbles)

        const screenshot = await axios.post(`https://chrome.browserless.io/screenshot?token=${browserlessKey}`, {
            html: html,
            viewport: { width: 1080, height: 1440 },
            options: { type: 'jpeg', quality: 100, fullPage: false }
        }, { responseType: 'arraybuffer' })

        await conn.sendMessage(m.chat, { image: screenshot.data, ...global.newsletter() }, { quoted: m })

    } catch (e) {
        console.error(e)
        m.reply('_Errore nella generazione dello scontrino._')
    }
}

handler.help = ['receipt', 'scontrino']
handler.tags = ['fm']
handler.command = ['receipt', 'scontrino']

export default handler