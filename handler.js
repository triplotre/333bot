import { writeFileSync } from 'fs';
import print from './lib/print.js';
import { prima as antiPrivato } from './funzioni/owner/antiprivato.js'

/**
 * Funzione per estrarre il testo da vari tipi di messaggio
 */
function extractMessageText(message) {
    if (!message) return '';
    
    const mtype = Object.keys(message)[0];
    const msg = message[mtype];
    
    // Gestione messaggi di testo standard
    if (message.conversation) return message.conversation;
    if (message.extendedTextMessage?.text) return message.extendedTextMessage.text;
    
    // Gestione bottoni legacy
    if (message.buttonsResponseMessage?.selectedButtonId) {
        return message.buttonsResponseMessage.selectedButtonId;
    }
    
    // Gestione list response
    if (message.listResponseMessage?.singleSelectReply?.selectedRowId) {
        return message.listResponseMessage.singleSelectReply.selectedRowId;
    }
    
    // Gestione template button reply
    if (message.templateButtonReplyMessage?.selectedId) {
        return message.templateButtonReplyMessage.selectedId;
    }
    
    // Gestione bottoni interattivi moderni (caroselli, native flow, ecc.)
    if (message.interactiveResponseMessage) {
        const interactive = message.interactiveResponseMessage;
        
        // Native Flow Response (bottoni moderni di WhatsApp)
        if (interactive.nativeFlowResponseMessage?.paramsJson) {
            try {
                const params = JSON.parse(interactive.nativeFlowResponseMessage.paramsJson);
                return params.id || params.text || params.name || "";
            } catch (e) {
                console.error('Errore parsing nativeFlowResponseMessage:', e);
            }
        }
        
        // Body (testo del messaggio interattivo)
        if (interactive.body) return interactive.body;
    }
    
    // Gestione messaggi con selectedId generico
    if (msg?.selectedId) return msg.selectedId;
    if (msg?.text) return msg.text;
    if (msg?.caption) return msg.caption;
    
    return '';
}

/**
 * Funzione per estrarre mentions/tag
 */
function extractMentions(message) {
    if (!message) return [];
    
    const mentions = [];
    const mtype = Object.keys(message)[0];
    const msg = message[mtype];
    
    // Prendi mentions dal contextInfo
    if (msg?.contextInfo?.mentionedJid) {
        mentions.push(...msg.contextInfo.mentionedJid);
    }
    
    // Prendi mentions dall'extendedTextMessage
    if (message.extendedTextMessage?.contextInfo?.mentionedJid) {
        mentions.push(...message.extendedTextMessage.contextInfo.mentionedJid);
    }
    
    // Rimuovi duplicati
    return [...new Set(mentions)];
}

/**
 * Funzione per estrarre il messaggio quotato (reply)
 */
function extractQuotedMessage(conn, m) {
    const message = m.message;
    if (!message) return null;
    
    const mtype = Object.keys(message)[0];
    const msg = message[mtype];
    const contextInfo = msg?.contextInfo;
    
    if (!contextInfo?.quotedMessage) return null;
    
    const quotedMsg = contextInfo.quotedMessage;
    const quotedType = Object.keys(quotedMsg)[0];
    
    return {
        chat: m.key.remoteJid,
        sender: conn.decodeJid(contextInfo.participant || m.key.remoteJid),
        id: contextInfo.stanzaId,
        mtype: quotedType,
        msg: quotedMsg[quotedType],
        text: extractMessageText(quotedMsg),
        // Informazioni aggiuntive utili
        contextInfo: contextInfo,
        download: async () => {
            // Funzione helper per scaricare media dal messaggio quotato
            if (quotedMsg[quotedType]?.url) {
                return await conn.downloadMediaMessage({
                    key: { 
                        remoteJid: m.key.remoteJid,
                        id: contextInfo.stanzaId 
                    },
                    message: quotedMsg
                });
            }
            return null;
        }
    };
}

export default async function handler(conn, m) {
    try {
        if (!m.message) return;

        const jid = conn.decodeJid(m.key.remoteJid);
        const isGroup = jid.endsWith('@g.us');
        const sender = conn.decodeJid(m.key.participant || m.key.remoteJid);

        m.chat = jid;
        m.sender = sender;
        
        // --- GESTIONE MTYPE MIGLIORATA ---
        let rawMessage = m.message;
        
        // Gestione messageContextInfo (bottoni/liste legacy)
        if (rawMessage.messageContextInfo) {
            if (rawMessage.listResponseMessage) {
                rawMessage = { listResponseMessage: rawMessage.listResponseMessage };
            } else if (rawMessage.buttonsResponseMessage) {
                rawMessage = { buttonsResponseMessage: rawMessage.buttonsResponseMessage };
            }
        }
        
        m.message = rawMessage;
        m.mtype = Object.keys(rawMessage)[0];
        m.msg = rawMessage[m.mtype];

        // --- ESTRAZIONE TESTO COMPLETA ---
        m.text = extractMessageText(rawMessage);
        
        // --- ESTRAZIONE TAG/MENTIONS ---
        m.mentionedJid = extractMentions(rawMessage);
        
        // --- GESTIONE REPLY/QUOTE MIGLIORATA ---
        m.quoted = extractQuotedMessage(conn, m);

        // --- FUNZIONE REPLY MIGLIORATA ---
        m.reply = async (text, chatId, options = {}) => {
            return await conn.sendMessage(
                chatId || m.chat, 
                { text: text, ...global.newsletter?.() }, 
                { quoted: m, ...options }
            );
        };

        // --- DATABASE ---
        global.db.data = global.db.data || { users: {}, groups: {}, chats: {}, settings: {} };
        const users = global.db.data.users;
        const groups = global.db.data.groups;

        const isOwner = global.owner.some(o => o[0] === sender.split('@')[0]);

        await antiPrivato.call(conn, m, { isOwner })
        
        if (!users[sender]) users[sender] = { messages: 0, warns: {} };
        users[sender].messages++;
        
        if (isGroup) {
            if (!groups[jid]) {
                groups[jid] = { messages: 0, rileva: false, welcome: true, antilink: true };
            }
            groups[jid].messages++;
        }

        writeFileSync('./database.json', JSON.stringify(global.db.data, null, 2));
        await print(m, conn);

        if (m.key.fromMe) return;

        // --- PREFISSO E COMANDI ---
        const prefix = global.prefix instanceof RegExp ? 
            (global.prefix.test(m.text) ? m.text.match(global.prefix)[0] : '.') : 
            (global.prefix || '.');
            
        if (!m.text.startsWith(prefix)) return;

        const args = m.text.slice(prefix.length).trim().split(/ +/);
        const command = args.shift().toLowerCase();
        const fullText = args.join(' '); 
        
        // --- METADATI E RUOLI ---
        const groupMetadata = isGroup ? await conn.groupMetadata(jid).catch(() => ({})) : {};
        const participants = isGroup ? (groupMetadata.participants || []) : [];
        
        const botJid = conn.decodeJid(conn.user.id); 
        const senderJid = conn.decodeJid(sender);

        const user = isGroup ? participants.find(u => conn.decodeJid(u.id) === senderJid) : {};
        const bot = isGroup ? participants.find(u => conn.decodeJid(u.id) === botJid) : {};

        // Un utente è admin se user.admin è "admin" o "superadmin" (truthy)
        const isAdmin = !!user?.admin || isOwner;
        const isBotAdmin = !!bot?.admin;

        // --- ESECUZIONE PLUGIN ---
        for (let name in global.plugins) {
            let plugin = global.plugins[name];
            if (!plugin || plugin.disabled) continue;

            const isAccept = Array.isArray(plugin.command) ? 
                plugin.command.includes(command) : 
                (plugin.command instanceof RegExp ? plugin.command.test(command) : plugin.command === command);

            if (isAccept) {
                // Controlli permessi
                if (plugin.group && !isGroup) { 
                    global.dfail('group', m, conn); 
                    continue; 
                }
                if (plugin.admin && !isAdmin) { 
                    global.dfail('admin', m, conn);
                    continue; 
                }     
                if (plugin.botAdmin && !isBotAdmin) { 
                    global.dfail('botAdmin', m, conn); 
                    continue; 
                }  
                if (plugin.owner && !isOwner) { 
                    global.dfail('owner', m, conn); 
                    continue; 
                }

                try {
                    // Supporta sia sintassi nuova (export default { call() }) che vecchia (var handler = async...)
                    if (typeof plugin.call === 'function') {
                        // Sintassi nuova
                        await plugin.call(conn, m, {
                            conn, 
                            args, 
                            text: fullText, 
                            usedPrefix: prefix, 
                            command, 
                            isOwner, 
                            isAdmin, 
                            isBotAdmin, 
                            participants, 
                            groupMetadata
                        });
                    } else if (typeof plugin === 'function') {
                        // Sintassi vecchia (handler è una funzione)
                        await plugin(m, {
                            conn, 
                            args, 
                            text: fullText, 
                            usedPrefix: prefix, 
                            command, 
                            isOwner, 
                            isAdmin, 
                            isBotAdmin, 
                            participants, 
                            groupMetadata
                        });
                    }
                    writeFileSync('./database.json', JSON.stringify(global.db.data, null, 2));
                } catch (e) {
                    console.error(`Errore nel plugin ${name}:`, e);
                    m.reply(`❌ Si è verificato un errore nell'esecuzione del comando.`);
                }
                break;
            }
        }
    } catch (e) {
        console.error('Errore nel handler:', e);
    }
}