const handler = async (m, { conn, text, participants, command }) => {
  try {
    const users = participants.map((u) => conn.decodeJid(u.id));
    
    if (m.quoted) {
      let rawQuoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      
      if (!rawQuoted) {
        return await conn.sendMessage(m.chat, { forward: m.quoted, mentions: users }, { quoted: m });
      }

      let msgObj = JSON.parse(JSON.stringify(rawQuoted));
      let mtype = Object.keys(msgObj)[0];
      
      if (['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage'].includes(mtype)) {
        msgObj = msgObj[mtype].message;
        mtype = Object.keys(msgObj)[0];
      }
      
      if (mtype === 'conversation') {
        msgObj = {
          extendedTextMessage: {
            text: text || msgObj.conversation,
            contextInfo: { 
              mentionedJid: users,
              stanzaId: m.key.id,
              participant: m.sender,
              quotedMessage: m.message
            }
          }
        };
      } else {
        let content = msgObj[mtype];
        if (content) {
          if (!content.contextInfo) content.contextInfo = {};
          content.contextInfo.mentionedJid = users;
          content.contextInfo.stanzaId = m.key.id;
          content.contextInfo.participant = m.sender;
          content.contextInfo.quotedMessage = m.message;
          
          if (text) {
            if (content.caption !== undefined) content.caption = text;
            else if (content.text !== undefined) content.text = text;
          }
        }
      }
      
      await conn.relayMessage(m.chat, msgObj, {});
      
    } else if (text) {
      await conn.sendMessage(m.chat, {
        text: text,
        mentions: users
      }, { quoted: m });
    } else {
      return m.reply('`𐔌⚠️ ꒱` _Inserisci un testo o rispondi a un messaggio/media/sondaggio/evento._');
    }
    
  } catch (e) {
    console.error('Errore tag/hidetag:', e);
    m.reply('`𐔌❌ ꒱` _Si è verificato un errore durante l\'inoltro del messaggio._');
  }
};

handler.help = ['hidetag', 'totag', 'tag'];
handler.tags = ['gruppo'];
handler.command = /^(\.?hidetag|totag|tag)$/i;
handler.admin = true;
handler.group = true;

export default handler;