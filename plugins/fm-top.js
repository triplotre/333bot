import axios from 'axios'
import fs from 'fs'

const dbPath = './media/lastfm.json'
const LASTFM_PLACEHOLDER = '2a96cbd8b46e442fc41c2b86b821562f'

const fetchCover = async (item, isAlbum, apiKey) => {
    if (isAlbum) {
        try {
            const imgs = item.image
            if (imgs?.length) {
                const best = imgs.find(i => i.size === 'extralarge' || i.size === 'mega') || imgs[imgs.length - 1]
                const url = best?.['#text']
                if (url?.trim() && !url.includes(LASTFM_PLACEHOLDER)) return url
            }
        } catch {}
        try {
            const q = `${item.artist?.name || ''} ${item.name}`.trim()
            const { data } = await axios.get('https://itunes.apple.com/search', {
                params: { term: q, limit: 1, media: 'music', entity: 'album' },
                timeout: 6000
            })
            const r = data.results?.[0]
            if (r?.artworkUrl100) return r.artworkUrl100.replace('100x100bb', '600x600bb')
        } catch {}
    } else {
        try {
            const { data } = await axios.get('https://ws.audioscrobbler.com/2.0/', {
                params: { method: 'artist.gettopalbums', artist: item.name, api_key: apiKey, limit: 1, format: 'json' },
                timeout: 6000
            })
            const albums = data.topalbums?.album
            if (albums?.length) {
                const imgs = albums[0].image
                const best = imgs?.find(i => i.size === 'extralarge' || i.size === 'mega') || imgs?.[imgs.length - 1]
                const url = best?.['#text']
                if (url?.trim() && !url.includes(LASTFM_PLACEHOLDER)) return url
            }
        } catch {}
        try {
            const { data } = await axios.get('https://itunes.apple.com/search', {
                params: { term: item.name, limit: 1, media: 'music', entity: 'album' },
                timeout: 6000
            })
            const r = data.results?.[0]
            if (r?.artworkUrl100) return r.artworkUrl100.replace('100x100bb', '600x600bb')
        } catch {}
    }
    return null
}

const buildHtml = (data, covers, isAlbum) => {
    const fmt = (n) => Number(n).toLocaleString('it-IT')
    const cover1 = covers[0] || ''

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
    width: 1080px;
    height: 1440px;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
    background: #111114;
    position: relative;
    display: flex;
    flex-direction: column;
}

.bg-cover {
    position: absolute;
    inset: -80px;
    ${cover1 ? `background: url('${cover1}') center/cover no-repeat;` : 'background: #111114;'}
    filter: blur(80px) saturate(140%) brightness(0.22);
    transform: scale(1.1);
    z-index: 0;
}

.bg-vignette {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(ellipse 120% 60% at 50% 0%, transparent 40%, rgba(10,10,12,0.75) 100%),
        radial-gradient(ellipse 100% 50% at 50% 100%, rgba(10,10,12,0.9) 0%, transparent 60%);
    z-index: 0;
}

.header {
    position: relative;
    padding-top: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    z-index: 10;
}

.pill {
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(255,255,255,0.13);
    backdrop-filter: blur(20px);
    border-radius: 100px;
    padding: 10px 34px;
    font-size: 24px;
    font-weight: 500;
    color: rgba(255,255,255,0.38);
    letter-spacing: 4px;
    text-transform: uppercase;
}

h1 {
    font-family: 'Syne', sans-serif;
    font-size: 110px;
    font-weight: 900;
    color: #f0eee8;
    letter-spacing: -5px;
    line-height: 0.88;
    text-align: center;
}

.content-wrapper {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
}

.podium {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
    z-index: 1;
}

.card {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(255,255,255,0.07);
    backdrop-filter: blur(60px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.13);
    position: relative;
}

.card-1 { width: 376px; height: 900px; border-radius: 80px 80px 0 0; z-index: 3; }
.card-2 { width: 348px; height: 750px; border-radius: 80px 0 0 0; z-index: 2; margin-right: -1px; }
.card-3 { width: 348px; height: 600px; border-radius: 0 80px 0 0; z-index: 1; margin-left: -1px; }

.cover-wrap { position: relative; margin-top: -140px; z-index: 5; }
.card-1 .cover-wrap { margin-top: -180px; }

.cover {
    display: block;
    border-radius: 40px;
    object-fit: cover;
    border: 4px solid rgba(255,255,255,0.18);
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
}
.card-1 .cover { width: 280px; height: 280px; }
.card-2 .cover, .card-3 .cover { width: 220px; height: 220px; }

.badge {
    position: absolute;
    bottom: -15px; right: -15px;
    width: 60px; height: 60px;
    border-radius: 50%;
    background: rgba(30,30,34,0.9);
    border: 2px solid rgba(255,255,255,0.18);
    display: flex; align-items: center; justify-content: center;
    font-size: 32px;
}

.info { padding: 40px 20px 0; text-align: center; }
.name { font-family: 'Syne', sans-serif; font-weight: 800; color: #f0eee8; line-height: 1.1; }
.card-1 .name { font-size: 42px; }
.card-2 .name, .card-3 .name { font-size: 30px; }

.plays {
    margin-top: 20px;
    font-family: 'Syne', sans-serif;
    font-weight: 800;
    color: #f0eee8;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 100px;
    padding: 10px 30px;
    font-size: 24px;
}

.rest {
    position: absolute;
    left: 40px;
    right: 40px;
    bottom: 0;
    z-index: 10;
    background: rgba(15,15,18,0.88);
    backdrop-filter: blur(50px) saturate(160%);
    border: 1px solid rgba(255,255,255,0.15);
    border-bottom: none;
    border-radius: 60px 60px 0 0;
    padding: 85px 60px 20px; 
    box-shadow: 0 -30px 100px rgba(0,0,0,0.9);
}

.row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 22px 0;
    border-bottom: 1px solid rgba(255,255,255,0.08);
}
.row:last-child { border-bottom: none; }

.row-left { display: flex; align-items: center; gap: 30px; }
.row-num { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 900; color: rgba(255,255,255,0.2); width: 45px; }
.row-name { font-family: 'Syne', sans-serif; font-size: 32px; font-weight: 700; color: #f0eee8; }
.row-plays { font-family: 'DM Sans', sans-serif; font-size: 28px; color: rgba(255,255,255,0.4); }

</style>
</head>
<body>
<div class="bg-cover"></div>
<div class="bg-vignette"></div>

<div class="header">
    <div class="pill">7 days · ${isAlbum ? 'albums' : 'artists'}</div>
    <h1>Weekly Chart</h1>
</div>

<div class="content-wrapper">
    <div class="podium">
        <div class="card card-2">
            <div class="cover-wrap">
                <img class="cover" src="${covers[1] || ''}" onerror="this.src='https://placehold.co/600x600/222/555?text=?'">
                <div class="badge">🥈</div>
            </div>
            <div class="info">
                <div class="name">${data[1].name}</div>
                <div class="plays">${fmt(data[1].playcount)} plays</div>
            </div>
        </div>

        <div class="card card-1">
            <div class="cover-wrap">
                <img class="cover" src="${covers[0] || ''}" onerror="this.src='https://placehold.co/600x600/222/555?text=?'">
                <div class="badge">🥇</div>
            </div>
            <div class="info">
                <div class="name">${data[0].name}</div>
                <div class="plays">${fmt(data[0].playcount)} plays</div>
            </div>
        </div>

        <div class="card card-3">
            <div class="cover-wrap">
                <img class="cover" src="${covers[2] || ''}" onerror="this.src='https://placehold.co/600x600/222/555?text=?'">
                <div class="badge">🥉</div>
            </div>
            <div class="info">
                <div class="name">${data[2].name}</div>
                <div class="plays">${fmt(data[2].playcount)} plays</div>
            </div>
        </div>
    </div>

    <div class="rest">
        ${data.slice(3, 5).map((item, i) => `
        <div class="row">
            <div class="row-left">
                <span class="row-num">${i + 4}</span>
                <div class="row-name">${item.name}</div>
            </div>
            <span class="row-plays">${fmt(item.playcount)}</span>
        </div>`).join('')}
    </div>
</div>
</body>
</html>`
}

let handler = async (m, { conn, text, usedPrefix }) => {
    const db = fs.existsSync(dbPath) ? JSON.parse(fs.readFileSync(dbPath, 'utf-8')) : {}
    const user = db[m.sender]
    const apiKey = global.APIKeys?.lastfm
    const browserlessKey = global.APIKeys?.browserless

    if (!apiKey) return m.reply('_Configura LastFM API Key._')
    if (!user) return m.reply(`_Registrati prima con ${usedPrefix}fmset_`)

    await conn.sendPresenceUpdate('composing', m.chat)

    try {
        const isAlbum = text?.toLowerCase() === 'album'
        const method = isAlbum ? 'user.gettopalbums' : 'user.gettopartists'

        const res = await axios.get('https://ws.audioscrobbler.com/2.0/', {
            params: { method, user, api_key: apiKey, period: '7day', limit: 5, format: 'json' }
        })

        const data = res.data.topartists?.artist || res.data.topalbums?.album
        if (!data || data.length < 3) return m.reply('_Dati insufficienti su Last.fm._')

        const covers = await Promise.all(data.slice(0, 3).map(item => fetchCover(item, isAlbum, apiKey)))

        const html = buildHtml(data, covers, isAlbum)

        const screenshot = await axios.post(
            `https://chrome.browserless.io/screenshot?token=${browserlessKey}`,
            {
                html,
                viewport: { width: 1080, height: 1440 },
                options: { type: 'jpeg', quality: 95 }
            },
            { responseType: 'arraybuffer' }
        )

        await conn.sendMessage(m.chat, { image: screenshot.data, ...global.newsletter() }, { quoted: m })
    } catch (e) {
        console.error(e)
        m.reply('_Errore nel rendering._')
    }
}

handler.help = ['fmtop artist', 'fmtop album']
handler.tags = ['fm']
handler.command = ['fmtop']

export default handler