import fs from 'fs';
import { join } from 'path';

let handler = async (m, { conn, usedPrefix, command, args, isOwner }) => {
  const jid = m.chat;

  const tagMapping = {
      'giochi': '🕹️ ARCADE & FUN',
      'rpg': '⚔️ GESTIONALE RPG',
      'casino': '🎰 CASINO & AZZARDO'
  };

  let help = Object.values(global.plugins).filter(plugin => !plugin.disabled).map(plugin => {
      return {
          help: Array.isArray(plugin.tags) ? plugin.help : [plugin.help],
          tags: Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags],
          prefix: 'customPrefix' in plugin,
          enabled: !plugin.disabled,
      }
  });

  let menuContent = '';
  for (let tag in tagMapping) {
      let groups = help.filter(plugin => plugin.tags && plugin.tags.includes(tag));
      if (groups.length === 0) continue;

      menuContent += `╭┈  『 ${tagMapping[tag]} 』\n`;
      for (let plugin of groups) {
          if (plugin.help) {
              for (let h of plugin.help) {
                  if (h) menuContent += `  ┆  ◦ ${usedPrefix}${h}\n`;
              }
          }
      }
      menuContent += `  ╰┈➤\n\n`;
  }

  // Costruzione della didascalia
  let caption = `
  ╭┈  『 🎮 』 \`GAMES CENTER\`
  ┆  *Benvenuto nella sala giochi!*
  ┆  Seleziona un'attività dalla lista
  ┆  o usa i bottoni rapidi.
  ╰┈➤

  ${menuContent.trim()}`;

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "👛 PORTAFOGLIO", id: `${usedPrefix}wallet` })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "💼 LAVORI", id: `${usedPrefix}lavoro` })
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
          header: { title: "◯  𐙚  *──  g i o c h i  ──*", hasVideoMessage: false },
          body: { text: caption },
          nativeFlowMessage: { buttons: buttons },
          contextInfo: {
            ...global.newsletter().contextInfo,
            mentionedJid: [m.sender],
            isForwarded: true,    
            stanzaId: 'zyklonGames',
            participant: '0@s.whatsapp.net',
            quotedMessage: {
                contactMessage: {
                    displayName: `⋆. zyklon 𝜗𝜚˚⋆`,
                    vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;zyklon;;;\nFN:zyklon\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nEND:VCARD`
                }
            }
          }
        }
      }
    }
  };

  return await conn.relayMessage(jid, msg, {});
};

handler.help = ['giochi', 'games'];
handler.tags = ['main'];
handler.command = ['giochi', 'games', 'menu-giochi'];

export default handler;