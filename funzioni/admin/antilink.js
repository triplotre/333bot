import { writeFileSync } from 'fs';

export async function antilink(m, { conn, isAdmin, isBotAdmin, users }) {
    if (isAdmin || !isBotAdmin) return false;

    // Estrae il testo da qualsiasi sorgente (testo, didascalie media, bottoni)
    const body = m.text || m.msg?.caption || m.msg?.text || (m.mtype === 'templateButtonReplyMessage' && m.msg?.selectedId) || '';
    
    if (!body) return false;

    // Regex per link https, http, www e wa.me
    const linkRegex = /((https?:\/\/|www\.)[^\s]+|wa\.me\/[^\s]+)/i;
    
    if (linkRegex.test(body)) {
        const jid = m.chat;
        const sender = m.sender;

        // Elimina immediatamente il messaggio
        await conn.sendMessage(jid, { delete: m.key });

        // Inizializzazione e incremento warn
        if (!users[sender].warns) users[sender].warns = {};
        if (!users[sender].warns[jid]) users[sender].warns[jid] = 0;

        users[sender].warns[jid] += 1;
        const count = users[sender].warns[jid];
        const maxWarns = 5;

        await conn.sendMessage(jid, {
            text: `⚠️ *Link Rilevato!* ⚠️\n\n@${sender.split('@')[0]}, l'invio di link è vietato.\n*Warn:* [ ${count} / ${maxWarns} ]`,
            mentions: [sender],
            ...global.newsletter?.()
        });

        // Rimozione al quinto avvertimento
        if (count >= maxWarns) {
            await conn.groupParticipantsUpdate(jid, [sender], 'remove');
            users[sender].warns[jid] = 0; // Reset
            await conn.sendMessage(jid, { 
                text: `🚫 @${sender.split('@')[0]} rimosso per aver raggiunto il limite di 5 warn.`,
                mentions: [sender]
            });
        }

        // Sincronizzazione database
        writeFileSync('./database.json', JSON.stringify(global.db.data, null, 2));
        
        return true; 
    }

    return false;
}