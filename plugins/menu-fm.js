let handler = async (m, { conn, usedPrefix }) => {
  const jid = m.chat;

  let help = Object.values(global.plugins).filter(plugin => {
      if (plugin.disabled) return false
      const tags = Array.isArray(plugin.tags) ? plugin.tags : [plugin.tags]
      return tags.includes('fm')
  }).map(plugin => ({
      help: Array.isArray(plugin.help) ? plugin.help : [plugin.help],
  }))

  let menuContent = ''
  if (help.length === 0) {
      menuContent = '┆  _Nessun comando fm disponibile._\n'
  } else {
      menuContent += `╭┈  『 🎶 COMANDI FM 』\n`
      for (let plugin of help) {
          for (let h of plugin.help) {
              if (h) menuContent += `┆  ◦ ${usedPrefix}${h}\n`
          }
      }
      menuContent += `╰┈➤\n\n`
  }

  let caption = `
  ╭┈  『 🎶 』 \`FM PANEL\`
  ┆  *Pannello FM*
  ┆  Qui trovi tutti i comandi
  ┆  riservati riguardo la musica.
  ╰┈➤

${menuContent.trim()}`

  const buttons = [
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🛡️ MENU ADMIN", id: `${usedPrefix}menuadmin` })
    },
    {
      name: "quick_reply",
      buttonParamsJson: JSON.stringify({ display_text: "🔙 MENU PRINCIPALE", id: `${usedPrefix}menu` })
    }
  ]

  const msg = {
    viewOnceMessage: {
      message: {
        interactiveMessage: {
          header: { title: "◯  𐙚  *──  4 4 4 . f m  ──*", hasVideoMessage: false },
          body: { text: caption },
          nativeFlowMessage: { buttons: buttons },
          contextInfo: {
            ...global.newsletter().contextInfo,
            mentionedJid: [m.sender],
            isForwarded: true,
            stanzaId: 'annoyedMod',
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
  }

  return await conn.relayMessage(jid, msg, {})
}

handler.help = ['menufm']
handler.tags = ['main']
handler.command = ['menufm', 'fmmenu']
handler.group = true

export default handler