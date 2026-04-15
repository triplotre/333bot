import fs from 'fs';
import { join } from 'path';

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
  const jid = m.chat;

  const tagMapping = {
      'admin': '🛡️ COMANDI ADMIN',
      'gruppo': '👥 GESTIONE GRUPPO',
      'impostazioni': '⚙️ IMPOSTAZIONI',
      'owner': '👑 COMANDI OWNER'
  };

  let help = Object.values(global.plugins).filter(plugin => !plugin.disabled && plugin.admin).map(plugin => {
      return {
          help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
          tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
          prefix: 'customPrefix' in plugin,
          enabled: !plugin.disabled,
      }
  });

  let allTags = [...new Set(help.flatMap(p => p.tags))].filter(Boolean);

  let menuContent = '';
  for (let tag of allTags) {
      let groups = help.filter(plugin => plugin.tags && plugin.tags.includes(tag));
      if (groups.length === 0) continue;

      let tagName = tagMapping[tag] || `🛠️ ${tag.toUpperCase()}`;
      
      menuContent += `╭┈  『 ${tagName} 』\n`;
      for (let plugin of groups) {
          if (plugin.help) {
              for (let h of plugin.help) {
                  if (h) menuContent += `┆  ◦ ${usedPrefix}${h}\n`;
              }
          }
      }
      menuContent += `╰┈➤\n\n`;
  }

  let caption = `
  ╭┈  『 🛡️ 』 \`ADMIN PANEL\`
  ┆  *Pannello di Controllo*
  ┆  Qui trovi tutti i comandi
  ┆  riservati agli amministratori.
  ╰┈➤

${menuContent.trim()}`;

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "⚙️ IMPOSTAZIONI", id: `${usedPrefix}funzioni` })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🔙 MENU PRINCIPALE", id: `${usedPrefix}menu` })
    }
  ];

  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: "◯  𐙚  *──  a d m i n  ──*", hasVideoMessage: false },
          body: { text: caption },
          nativeFlowMessage: { buttons: buttons },
          contextInfo: {
            ...global.newsletter().contextInfo,
            mentionedJid: [m.sender],
            isForwarded: true,    
            stanzaId: 'annoyedAdmin',
            participant: '0@s.whatsapp.net',
            quotedMessage: {
                contactMessage: {
                    displayName: `⋆. annoyed 𝜗𝜚˚⋆`,
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

handler.help = ['menuadmin', 'admin'];
handler.tags = ['main'];
handler.command = ['menuadmin', 'admin', 'adminmenu'];
handler.group = true; 

export default handler;