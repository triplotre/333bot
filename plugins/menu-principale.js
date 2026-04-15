import fs from 'fs';
import { join } from 'path';

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
  const jid = m.chat;
  
  const packageJson = JSON.parse(fs.readFileSync(join(process.cwd(), 'package.json')));
  const botVersion = packageJson.version || '1.0.0';

  let _uptime = process.uptime() * 1000;
  let uptime = clockString(_uptime);
  let totalUsers = Object.keys(global.db.data?.users || {}).length;

  let caption = `  
╭┈  『 🌸 』 \`ciao\` ─  *@${m.sender.split('@')[0]}*
┆  『 🕒 』 \`uptime\` ─  *_${uptime}_*
┆  『 👥 』 \`utenti\` ─  *_${totalUsers}_*
╰┈➤ 『 📦 』 \`versione\` ─  *_${botVersion}_*`.trim();

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🛡️ FUNZIONI", id: `${usedPrefix}funzioni` })
    },{
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🛡️ ADMIN", id: `${usedPrefix}menuadmin` })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🎮 GIOCHI", id: `${usedPrefix}menu-giochi` })
    },
   /* {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🚀 SPEED TEST", id: `${usedPrefix}ping` })
    } */
  ];

  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: "◯  𐙚  *──  m e n u  ──*", hasVideoMessage: false },
          body: { text: caption },
          footer: { text: "" },
          nativeFlowMessage: { buttons: buttons },
          contextInfo: {
            ...global.newsletter().contextInfo,
            mentionedJid: [m.sender],
            isForwarded: true,    
            stanzaId: 'annoyedSystem',
            participant: '0@s.whatsapp.net',
            quotedMessage: {
                contactMessage: {
                    displayName: `${m.sender.split('@')[0]}`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;annoyed;;;\nFN:annoyed\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nEND:VCARD`
                }
            }
          }
        }
      }
    }
  };

  return await conn.relayMessage(jid, msg, {});
};

function clockString(ms) {
  let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
  let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
  let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
}

handler.help = ['menu'];
handler.tags = ['main'];
handler.command = ['menu', 'start', 'help'];

export default handler;