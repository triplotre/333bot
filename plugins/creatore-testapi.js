import axios from 'axios'

let handler = async (m, { conn }) => {
    const keys = global.APIKeys || {}
    if (Object.keys(keys).length === 0) return m.reply('_Oggetto APIKeys non trovato nel config._')

    await conn.sendPresenceUpdate('composing', m.chat)
    let report = `╭┈➤ 『 ⚙️ 』 *DEEP API TESTER*\n`
    
    for (let [key, value] of Object.entries(keys)) {
        if (!value || value === 'zyk' || value === 'undefined') {
            report += `┆  ⚠️ *${key.toUpperCase()}* ─ \`Non configurata\`\n`
            continue
        }

        let status = '❌', detail = 'Error'

        try {
            switch (key.toLowerCase()) {
                case 'lastfm':
                    const rf = await axios.get(`https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=rj&api_key=${value}&format=json`)
                    status = rf.data.user ? '✅' : '❌'
                    detail = 'Valid'
                    break
                case 'browserless':
                    const rb = await axios.get(`https://chrome.browserless.io/status?token=${value}`)
                    status = rb.status === 200 ? '✅' : '❌'
                    detail = 'Active'
                    break
                case 'openrouter':
                    const ro = await axios.get('https://openrouter.ai/api/v1/auth/key', {
                        headers: { 'Authorization': `Bearer ${value}` }
                    })
                    status = ro.data.data ? '✅' : '❌'
                    detail = 'Authorized'
                    break
                case 'ocr':
                    const rc = await axios.get(`https://api.ocr.space/parse/imageurl?apikey=${value}&url=${global.api_qr_create}test`)
                    status = rc.data.OCRExitCode === 1 ? '✅' : '❌'
                    detail = 'Valid'
                    break
                default:
                    status = '🟡'
                    detail = 'Configured'
            }
        } catch (e) {
            detail = e.response?.data?.error?.message || 'Failed'
        }
        report += `┆  ${status} *${key.toUpperCase()}* ─ \`${detail}\`\n`
    }

    report += `╰┈➤ 『 📦 』 \`annoyed system\``
    m.reply(report)
}

handler.command = /^(testapi|apitest)$/i
handler.owner = true
export default handler