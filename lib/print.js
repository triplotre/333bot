import chalk from 'chalk'

export default async function (m, conn = {}) {
  // Estrazione sicura del mittente
  let sender = m.sender || m.key?.remoteJid || ''
  let displayNum = sender.split('@')[0] || 'Sconosciuto'
  
  // Estrazione sicura del nome
  let name = m.name || (conn.getName ? await conn.getName(sender) : displayNum)

  // Estrazione della chat (se è un gruppo o privato)
  let chat = m.chat || m.key?.remoteJid || ''
  let isGroup = chat.endsWith('@g.us')
  let chatName = ''
  
  if (isGroup && conn.getName) {
    chatName = await conn.getName(chat).catch(() => '')
    chatName = chalk.yellow(chatName) + ' '
  }

  let time = new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  
  // Determina il tipo di messaggio
  let type = m.mtype ? m.mtype.replace('Message', '').toUpperCase() : 'MSG'
  let typeColor = m.isCommand ? chalk.magentaBright : chalk.cyan
  
  // STAMPA IN CONSOLE
  console.log(
    `[${chalk.white(time)}] ` +
    `${typeColor(type)} ` +
    `da ${chalk.green(name)} ` +
    `(${chalk.grey(displayNum)}) ` +
    (isGroup ? `in ${chatName}${chalk.grey(chat)}` : `in ${chalk.blue('Privato')}`)
  )

  // Stampa il testo del messaggio se esiste
  let body = m.text || m.msg?.caption || m.msg?.text || ''
  if (body) {
    if (m.isCommand) body = chalk.yellowBright(body)
    console.log(`${chalk.white(' ➜ ')} ${body}\n`)
  }
}