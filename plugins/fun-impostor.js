import fs from 'fs'

let lobby = {} 

const handler = async (m, { conn, text, usedPrefix, command }) => {
    const id = m.chat
    const isPrivate = m.chat.endsWith('@s.whatsapp.net')
    const now = Date.now()
    for (const chatId in lobby) {
        for (const name in lobby[chatId]) {
            const game = lobby[chatId][name]
            if (game._createdAt && now - game._createdAt > 30 * 60 * 1000) {
                if (game.timer) clearTimeout(game.timer)
                delete lobby[chatId][name]
            }
        }
        if (Object.keys(lobby[chatId]).length === 0) delete lobby[chatId]
    }

    const dizionario = [
        ['Pizza', 'Cibo italiano'], ['iPhone', 'Smartphone'], ['Calcio', 'Sport di squadra'],
        ['Gatto', 'Animale domestico'], ['Bicicletta', 'Mezzo di trasporto'], ['Libro', 'Oggetto da leggere'],
        ['Venezia', 'Città d\'arte'], ['Chitarra', 'Strumento musicale'], ['Coca Cola', 'Bevanda gassata'],
        ['Orologio', 'Accessorio'], ['Palestra', 'Luogo fisico'], ['Sushi', 'Cibo straniero']
    ]

    const resetGame = (chatId) => {
        if (lobby[chatId]?.timer) clearTimeout(lobby[chatId].timer)
        delete lobby[chatId]
    }

    if (command === 'impostore' && text === 'esci') {
        const game = lobby[id]
        if (!game || !game.partecipanti.includes(m.sender)) return conn.sendMessage(m.chat, { text: '❌ Non sei in nessuna partita.' }, { quoted: m })
        
        game.partecipanti = game.partecipanti.filter(u => u !== m.sender)
        
        if (game.stato !== 'LOBBY' && (m.sender === game.impostore || game.partecipanti.length < 3)) {
            conn.sendMessage(id, { text: `🏃 *@${m.sender.split('@')[0]}* è uscito. Partita terminata (mancano giocatori o l'impostore è fuggito).`, mentions: [m.sender] })
            return resetGame(id)
        }
        
        return conn.sendMessage(id, { text: `🏃 *@${m.sender.split('@')[0]}* ha abbandonato la lobby.`, mentions: [m.sender] })
    }

    if (command === 'impostore' && text?.startsWith('join') && isPrivate) {
        const codice = text.split(' ')[1]?.toUpperCase()
        const targetId = Object.keys(lobby).find(key => lobby[key].codice === codice)
        if (!targetId) return conn.sendMessage(m.chat, { text: '❌ Codice non valido.' }, { quoted: m })
        const game = lobby[targetId]
        if (game.stato !== 'LOBBY') return conn.sendMessage(m.chat, { text: '🚫 Partita già in corso.' }, { quoted: m })
        if (game.partecipanti.includes(m.sender)) return conn.sendMessage(m.chat, { text: '✅ Sei già dentro.' }, { quoted: m })

        game.partecipanti.push(m.sender)
        await conn.sendMessage(m.chat, { text: '✅ Ti sei unito! Torna nel gruppo.' }, { quoted: m })
        return conn.sendMessage(targetId, { text: `👤 *@${m.sender.split('@')[0]}* è entrato! (${game.partecipanti.length} giocatori)`, mentions: [m.sender] })
    }

    if (command === 'impostore' && !isPrivate) {
        if (!text) {
            if (lobby[id]) return conn.sendMessage(m.chat, { text: '⚠️ Lobby già attiva.' }, { quoted: m })
            const codice = Math.random().toString(36).substring(2, 7).toUpperCase()
            lobby[id] = {
                codice, stato: 'LOBBY', owner: m.sender, partecipanti: [],
                parolaMembri: '', indizioImpostore: '', impostore: '',
                descrizioni: {}, voti: {}, votiRicevuti: {}, timer: null,
                _createdAt: Date.now()
            }
            lobby[id].timer = setTimeout(() => {
                if (lobby[id]?.stato === 'LOBBY') {
                    if (lobby[id].partecipanti.length >= 3) {
                        conn.sendMessage(id, { text: '⏰ Tempo scaduto! Avvio automatico...' })
                        handler(m, { conn, text: 'start', usedPrefix, command: 'impostore' })
                    } else {
                        conn.sendMessage(id, { text: '⏰ Tempo scaduto! Giocatori insufficienti.' })
                        resetGame(id)
                    }
                }
            }, 60000)
            return conn.sendMessage(m.chat, { text: `╭┈  『 🕵️‍♂️ 』 *L'IMPOSTORE*\n┆  ╰➤  Codice: *${codice}*\n┆  ╰➤  Minimo: *3 giocatori*\n╰┈➤ *Join:* \`.impostore join ${codice}\` in privato.\n_Start automatico tra 60s_`, ...global.newsletter() }, { quoted: m })
        }

        if (text === 'start') {
            const game = lobby[id]
            if (!game || (game.owner !== m.sender && m.isGroup)) return 
            if (game.partecipanti.length < 3) return conn.sendMessage(m.chat, { text: '👥 Servono almeno 3 giocatori!' }, { quoted: m })

            if (game.timer) clearTimeout(game.timer)
            const set = dizionario[Math.floor(Math.random() * dizionario.length)]
            game.impostore = game.partecipanti[Math.floor(Math.random() * game.partecipanti.length)]
            game.parolaMembri = set[0]
            game.indizioImpostore = set[1]
            game.stato = 'DESCRIZIONE'

            for (let user of game.partecipanti) {
                const info = user === game.impostore ? `🕵️‍♂️ *SEI L'IMPOSTORE!*\nIndizio: *${game.indizioImpostore}*` : `👥 *SEI UN MEMBRO!*\nParola: *${game.parolaMembri}*`
                await conn.sendMessage(user, { text: info })
            }

            game.timer = setTimeout(async () => {
                if (lobby[id]?.stato === 'DESCRIZIONE') {
                    const inattivi = game.partecipanti.filter(u => !game.descrizioni[u])
                    game.partecipanti = game.partecipanti.filter(u => !inattivi.includes(u))
                    
                    if (game.partecipanti.length < 3 || inattivi.includes(game.impostore)) {
                        conn.sendMessage(id, { text: '⚠️ Partita terminata: inattività eccessiva o impostore rimosso.' })
                        return resetGame(id)
                    }
                    
                    game.stato = 'VOTAZIONE'
                    let alert = inattivi.length > 0 ? `⏰ *TEMPO SCADUTO!*\nCacciati per inattività: ${inattivi.map(u => `@${u.split('@')[0]}`).join(', ')}\n\n` : ''
                    const riepilogo = generaRiepilogo(game, conn, usedPrefix, alert)
                    await conn.sendMessage(id, riepilogo)
                }
            }, 30000)

            return conn.sendMessage(m.chat, { text: `🎮 *GIOCO INIZIATO*\nScrivete entro 30s: \`.ans parola\``, ...global.newsletter() }, { quoted: m })
        }
    }

    if (command === 'ans') {
        const game = lobby[id]
        if (!game || game.stato !== 'DESCRIZIONE' || !game.partecipanti.includes(m.sender)) return
        game.descrizioni[m.sender] = text.trim()
        if (Object.keys(game.descrizioni).length === game.partecipanti.length) {
            if (game.timer) clearTimeout(game.timer)
            game.stato = 'VOTAZIONE'
            return conn.sendMessage(m.chat, generaRiepilogo(game, conn, usedPrefix), { quoted: m })
        }
    }

    if (command === 'skip') {
        const game = lobby[id]
        if (!game || game.owner !== m.sender || game.stato !== 'DESCRIZIONE') return
        if (game.timer) clearTimeout(game.timer)
        const inattivi = game.partecipanti.filter(u => !game.descrizioni[u])
        game.partecipanti = game.partecipanti.filter(u => !inattivi.includes(u))
        if (inattivi.includes(game.impostore) || game.partecipanti.length < 3) {
            conn.sendMessage(id, { text: '⚠️ Partita chiusa: impostore skippato o pochi giocatori.' })
            return resetGame(id)
        }
        game.stato = 'VOTAZIONE'
        return conn.sendMessage(m.chat, generaRiepilogo(game, conn, usedPrefix, `⏭️ *SKIP EFFETTUATO BY OWNER*\n`), { quoted: m })
    }

    if (command === 'vota') {
        const game = lobby[id]
        if (!game || game.stato !== 'VOTAZIONE' || !game.partecipanti.includes(m.sender)) return
        if (game.voti[m.sender]) return
        game.voti[m.sender] = text.trim()
        game.votiRicevuti[text.trim()] = (game.votiRicevuti[text.trim()] || 0) + 1
        if (Object.keys(game.voti).length === game.partecipanti.length) {
            const espulso = Object.keys(game.votiRicevuti).reduce((a, b) => game.votiRicevuti[a] > game.votiRicevuti[b] ? a : b)
            const isImpostore = espulso === game.impostore
            let finale = `🗳️ *ESITO VOTI*\n\nL'utente più votato è *@${espulso.split('@')[0]}*\n`
            if (isImpostore) {
                finale += `🎉 *VITTORIA!* Era l'impostore! Parola: *${game.parolaMembri}*.\nPremi: +500 XP.`
                game.partecipanti.filter(u => u !== game.impostore).forEach(u => { if (global.db.data.users[u]) global.db.data.users[u].exp += 500 })
            } else {
                finale += `💀 *SCONFITTA!* Era un membro.\nL'impostore era *@${game.impostore.split('@')[0]}* (+1000 XP).`
                if (global.db.data.users[game.impostore]) global.db.data.users[game.impostore].exp += 1000
            }
            conn.sendMessage(m.chat, { text: finale, mentions: game.partecipanti }, { quoted: m })
            resetGame(id)
        }
    }
}

function generaRiepilogo(game, conn, usedPrefix, extra = '') {
    let txt = `${extra}╭┈  『 🗳️ 』 *VOTAZIONE*\n`
    let buttons = []
    for (let user of game.partecipanti) {
        txt += `┆ ╰➤ @${user.split('@')[0]}: "${game.descrizioni[user] || 'Inattivo'}"\n`
        buttons.push({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({ display_text: `Vota ${user.split('@')[0]}`, id: `${usedPrefix}vota ${user}` })
        })
    }
    return { text: txt + `╰┈➤ Chi è l'impostore?`, buttons, headerType: 1, mentions: game.partecipanti}
}

handler.command = ['impostore', 'ans', 'vota', 'skip']
export default handler