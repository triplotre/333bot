import axios from 'axios'
import fs from 'fs'
import { join } from 'path'
import '../config.js'

const BROWSERLESS_KEY = global.APIKeys?.browserless

const handler = async (m, { conn, usedPrefix }) => {
    await conn.sendPresenceUpdate('recording', m.chat)

    const repoPath = "troncarlo/annoyed."
    const userPath = 'troncarlo'
    const repoUrl = `https://github.com/${repoPath}`
    const packageUrl = `${repoUrl}/releases/latest`
    const channelUrl = global.canale.link 
    const sito = `https://realannoyed.vercel.app/`

    let stars = '0', forks = '0', watchers = '0', language = 'JavaScript', description = '', license = ''
    try {
        const repoData = await axios.get(`https://api.github.com/repos/${repoPath}`, {
            headers: { 'Accept': 'application/vnd.github.v3+json' }
        })
        stars = repoData.data.stargazers_count ?? '0'
        forks = repoData.data.forks_count ?? '0'
        watchers = repoData.data.watchers_count ?? '0'
        language = repoData.data.language || 'JavaScript'
        description = repoData.data.description || 'miglior bot zozzapp in italia!!!'
        license = repoData.data.license?.spdx_id || 'MIT'
    } catch (e) {
        stars = '--'; forks = '--'; watchers = '--'
        description = 'miglior bot zozzapp in italia!!!'
        license = 'MIT'
    }

    let avatarBase64 = ''
    try {
        const avatarRes = await axios.get(`https://github.com/${userPath}.png`, { responseType: 'arraybuffer' })
        avatarBase64 = `data:image/png;base64,${Buffer.from(avatarRes.data).toString('base64')}`
    } catch (e) {
        avatarBase64 = ''
    }

    const langColors = {
        JavaScript: '#f1e05a',
        TypeScript: '#3178c6',
        Python: '#3572A5',
        Java: '#b07219',
        default: '#8b949e'
    }
    const langColor = langColors[language] || langColors.default

    const html = `<!DOCTYPE html>
    <html>
    <head>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700&family=Roboto:wght@300;400;500&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            width: 800px;
            height: 800px;
            background: #0d1117;
            font-family: 'Roboto', sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }

        .bg-glow-top {
            position: absolute;
            width: 400px; height: 400px;
            background: radial-gradient(circle, rgba(88,166,255,0.07) 0%, transparent 70%);
            top: -100px; left: 50%;
            transform: translateX(-50%);
        }

        .bg-glow-bottom {
            position: absolute;
            width: 300px; height: 300px;
            background: radial-gradient(circle, rgba(63,185,80,0.05) 0%, transparent 70%);
            bottom: -80px; right: 100px;
        }

        .card {
            position: relative;
            width: 680px;
            background: #161b22;
            border: 1px solid #30363d;
            border-radius: 16px;
            overflow: hidden;
        }

        .card-banner {
            width: 100%;
            height: 90px;
            background: linear-gradient(135deg, #161b22 0%, #1c2128 50%, #161b22 100%);
            border-bottom: 1px solid #21262d;
            position: relative;
            overflow: hidden;
        }

        .banner-dots {
            position: absolute;
            top: 0; left: 0; right: 0; bottom: 0;
            background-image: radial-gradient(circle, #30363d 1px, transparent 1px);
            background-size: 24px 24px;
            opacity: 0.4;
        }

        .banner-line {
            position: absolute;
            bottom: 0; left: 0;
            width: 100%; height: 2px;
            background: linear-gradient(90deg, transparent, #58a6ff44, #58a6ff, #58a6ff44, transparent);
        }

        .avatar-wrapper {
            position: absolute;
            bottom: -36px;
            left: 32px;
            width: 72px; height: 72px;
            border-radius: 50%;
            border: 3px solid #161b22;
            background: #161b22;
            z-index: 2;
        }

        .avatar {
            width: 100%; height: 100%;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid #30363d;
        }

        .avatar-placeholder {
            width: 100%; height: 100%;
            border-radius: 50%;
            background: #21262d;
            border: 2px solid #30363d;
            display: flex; align-items: center; justify-content: center;
            font-size: 28px;
        }

        .card-header {
            padding: 46px 32px 20px;
            border-bottom: 1px solid #21262d;
        }

        .repo-full-name {
            font-size: 22px;
            font-weight: 500;
            color: #58a6ff;
            font-family: 'Google Sans', sans-serif;
            letter-spacing: -0.3px;
            margin-bottom: 6px;
        }

        .repo-full-name span {
            color: #8b949e;
            font-weight: 400;
        }

        .repo-desc {
            font-size: 14px;
            color: #8b949e;
            line-height: 1.6;
            margin-bottom: 14px;
        }

        .badge-row {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
        }

        .badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            border: 1px solid;
        }

        .badge-public {
            background: rgba(35,134,54,0.15);
            border-color: rgba(35,134,54,0.4);
            color: #3fb950;
        }

        .badge-license {
            background: rgba(88,166,255,0.1);
            border-color: rgba(88,166,255,0.3);
            color: #58a6ff;
        }

    
        .card-body {
            padding: 22px 32px;
            border-bottom: 1px solid #21262d;
        }

        .stats-row {
            display: flex;
            gap: 10px;
            margin-bottom: 22px;
            flex-wrap: wrap;
        }

        .stat-chip {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 9px 18px;
            background: #21262d;
            border: 1px solid #30363d;
            border-radius: 100px;
            font-size: 14px;
            color: #e6edf3;
            font-weight: 500;
        }

        .stat-chip .icon { font-size: 14px; }
        .stat-chip .count { color: #e6edf3; font-weight: 700; }
        .stat-chip .label { color: #8b949e; font-size: 13px; }

        .lang-section {}

        .lang-bar-bg {
            width: 100%;
            height: 8px;
            background: #21262d;
            border-radius: 8px;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .lang-bar-fill {
            height: 100%;
            width: 100%;
            background: ${langColor};
            border-radius: 8px;
        }

        .lang-label {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
            color: #8b949e;
        }

        .lang-dot {
            width: 10px; height: 10px;
            border-radius: 50%;
            background: ${langColor};
            flex-shrink: 0;
        }

        .card-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 14px 32px;
            background: #0d1117;
        }

        .watermark {
            font-size: 12px;
            color: #484f58;
            font-family: 'Google Sans', sans-serif;
            letter-spacing: 0.3px;
        }

        .footer-right {
            font-size: 12px;
            color: #484f58;
        }
    </style>
    </head>
    <body>
        <div class="bg-glow-top"></div>
        <div class="bg-glow-bottom"></div>

        <div class="card">

            <div class="card-banner">
                <div class="banner-dots"></div>
                <div class="banner-line"></div>
                <div class="avatar-wrapper">
                    ${avatarBase64
                        ? `<img src="${avatarBase64}" class="avatar" />`
                        : `<div class="avatar-placeholder">⚡</div>`
                    }
                </div>
            </div>

            <div class="card-header">
                <div class="repo-full-name">
                    <span>troncarlo /</span> annoyed.
                </div>
                <div class="repo-desc">${description}</div>
                <div class="badge-row">
                    <span class="badge badge-public">✓ Public</span>
                    <span class="badge badge-license">⚖ ${license}</span>
                </div>
            </div>

            <div class="card-body">
                <div class="stats-row">
                    <div class="stat-chip">
                        <span class="icon">⭐</span>
                        <span class="count">${stars}</span>
                        <span class="label">stars</span>
                    </div>
                    <div class="stat-chip">
                        <span class="icon">🍴</span>
                        <span class="count">${forks}</span>
                        <span class="label">forks</span>
                    </div>
                    <div class="stat-chip">
                        <span class="icon">👁</span>
                        <span class="count">${watchers}</span>
                        <span class="label">watchers</span>
                    </div>
                </div>

                <div class="lang-section">
                    <div class="lang-bar-bg">
                        <div class="lang-bar-fill"></div>
                    </div>
                    <div class="lang-label">
                        <div class="lang-dot"></div>
                        ${language} — 100.0%
                    </div>
                </div>
            </div>

            <div class="card-footer">
                <span class="watermark">github.com/troncarlo/annoyed.</span>
                <span class="footer-right">annoyed bot system</span>
            </div>

        </div>
    </body>
    </html>`

    try {
        const response = await axios.post(`https://chrome.browserless.io/screenshot?token=${BROWSERLESS_KEY}`, {
            html,
            options: { type: 'jpeg', quality: 95 },
            viewport: { width: 800, height: 800 }
        }, { responseType: 'arraybuffer' })

        const tmpFile = join(process.cwd(), `tmp_script_${Date.now()}.jpg`)
        fs.writeFileSync(tmpFile, Buffer.from(response.data))

        const ownerNum = global.owner[0][0]
        const mainText = `『 🚀 』 *BOT SCRIPT*\n\n👤 *Owner:* @${ownerNum}\n⭐ *Stars:* ${stars}\n🍴 *Forks:* ${forks}\n👁 *Watchers:* ${watchers}`

        await conn.sendMessage(m.chat, {
            text: mainText,
            cards: [
                {
                    image: { url: tmpFile },
                    body: '',
                    buttons: [
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({ display_text: '🌐 Repository', url: repoUrl })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({ display_text: '📦 Releases', url: packageUrl })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({ display_text: '📢 Canale', url: channelUrl })
                        },
                        {
                            name: 'cta_url',
                            buttonParamsJson: JSON.stringify({ display_text: '🌐 Sito ufficiale', url: sito })
                        }
                    ]
                }
            ],
            mentions: [ownerNum + '@s.whatsapp.net']
        }, { quoted: m })

        if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile)
    } catch (e) {
        console.error('[SCRIPT ERROR]:', e)
        return m.reply('『 ❌ 』 Errore nel rendering.')
    }
}

handler.command = ['script']
export default handler