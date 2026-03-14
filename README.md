# 🤖 zyklon bot .✦ ݁˖

⤷ ゛Bot WhatsApp basato su [@realvare/baileys](https://npmjs.com/package/@realvare/baileys). Base interamente fatta da zero, rapido e facilmente configurabile! Funziona sia su WhatsApp normale che WhatsApp Business (mod incluse) ⋆˚꩜｡

![Node](https://img.shields.io/badge/Node.js-18%2B-green?style=flat-square&logo=node.js)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)
![Version](https://img.shields.io/badge/version-1.5.0-purple?style=flat-square)
![Platform](https://img.shields.io/badge/platform-Android%20%7C%20Linux%20%7C%20Windows%20%7C%20macOS-lightgrey?style=flat-square)

---

## ⚠️ Note importanti

- *Compatibile con Android 8.1+, Windows 10+, macOS e Linux.*
- *Se al primo avvio ricevi `ERR: 408 Request Timeout`, riavvia il bot: si connetterà correttamente al secondo tentativo.*
- *Il bot usa **ESModules** (`"type": "module"` in package.json) — assicurati di usare Node.js 18+.*

---

## 🔑 Configurazione API Keys

Alcune funzioni richiedono API esterne. Dopo l'installazione, modifica `config.js` e inserisci le tue chiavi in `global.APIKeys`:

| Chiave | Servizio | Usato per |
|--------|----------|-----------|
| `openrouter` | [openrouter.ai](https://openrouter.ai) | AI Rispondi (modello trinity-mini) |
| `browserless` | [browserless.io](https://browserless.io) | Screenshot per profilo, daily, slot, tris, ship, quote |
| `removebg` | [remove.bg](https://remove.bg) | Rimozione sfondo immagini |
| `lastfm` | [last.fm](https://www.last.fm/api) | Comando `.cur` / nowplaying |
| `ocr` | [ocr.space](https://ocr.space/ocrapi) | Lettura QR code |
| `gemini` | Google Gemini | AI opzionale |

---

## 📥 Installazione

### 1️⃣ Android (Termux)

**Requisiti:**
- Android 8.1+ (escluse versioni Go)
- 4 GB di RAM
- 32 GB di memoria interna
- [Termux dal F-Droid](https://f-droid.org/repo/com.termux_1022.apk) *(non usare quello del Play Store)*
- Un secondo dispositivo per scansionare il QR code
```bash
termux-setup-storage && termux-wake-lock
```
```bash
pkg upgrade && pkg update -y
```
```bash
pkg install git nodejs ffmpeg imagemagick yarn libcairo pango libjpeg-turbo giflib libpixman pkg-config freetype fontconfig xorgproto build-essential python libvips sqlite clang make -y
```
```bash
pip install setuptools
export GYP_DEFINES="android_ndk_path=''"
```
```bash
cd ~ && git clone https://github.com/troncare/zyk-bot && cd zyk-bot
```
```bash
npm install --global yarn && yarn install
```
```bash
npm start
```

---

### 2️⃣ Linux (Ubuntu / Debian)

**Requisiti:**
- 3 GB di RAM
- 32 GB di SSD/HDD
- Node.js 18+ (vedi sotto)
```bash
sudo apt update && sudo apt upgrade -y
```
```bash
# Installa Node.js 18+ tramite NodeSource (apt di default spesso è troppo vecchio)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```
```bash
sudo apt install -y git ffmpeg imagemagick python3 python3-pip build-essential
```
```bash
git clone https://github.com/troncare/zyk-bot && cd zyk-bot
```
```bash
npm install
```
```bash
npm start
```

---

### 3️⃣ Windows 10/11

**Requisiti:**
- Node.js 18+ → [nodejs.org](https://nodejs.org)
- Git → [git-scm.com](https://git-scm.com)
- FFmpeg → [ffmpeg.org](https://ffmpeg.org/download.html) *(aggiungerlo al PATH)*
```powershell
git clone https://github.com/troncare/zyk-bot
cd zyk-bot
npm install
npm start
```

---

### 4️⃣ macOS
```bash
# Installa Homebrew se non lo hai
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
```bash
brew install node git ffmpeg imagemagick
```
```bash
git clone https://github.com/troncare/zyk-bot && cd zyk-bot
npm install && npm start
```

---

## 🚀 Avvio e comandi npm

| Comando | Descrizione |
|---------|-------------|
| `npm start` | Avvia il bot normalmente |
| `npm run qr` | Avvia in modalità QR code |
| `npm run code` | Avvia in modalità Pairing Code |

---

## 🧩 Dipendenze principali

| Pacchetto | Versione | Funzione |
|-----------|----------|----------|
| `@realvare/baileys` | latest | Core WebSocket WhatsApp |
| `axios` | ^1.12 | Chiamate API esterne |
| `chalk` | ^5.3 | Output colorato nel terminale |
| `chokidar` | 5.0.0 | Hot-reload plugin |
| `file-type` | ^21.3 | Rilevamento tipo file/media |
| `node-cache` | ^5.1 | Cache contatti e gruppi |
| `pino` | ^8.16 | Logger silenzioso |
| `node-fetch` | ^3.3 | Fetch HTTP nei plugin |
| `moment-timezone` | ^0.5 | Gestione fusi orari |
| `yt-search` | ^2.13 | Ricerca YouTube (`.play`) |

---

## 📁 Struttura del progetto
```
zyk-bot/
├── zyklon.js          # Entry point
├── handler.js         # Gestore messaggi principale
├── config.js          # Configurazione (generato al primo avvio)
├── database.json      # Database locale (generato automaticamente)
├── plugins/           # Comandi del bot
├── funzioni/          # Moduli interni (antilink, welcome, ecc.)
├── lib/               # Librerie (simple.js, store, converter, ecc.)
└── media/             # File di dati (banned, mutati, playlist, ecc.)
```

---

## ❤️ Crediti

- [@troncare](https://github.com/troncare) — creatore della base e dei comandi del bot
- [@realvare](https://github.com/realvare) — fork di Baileys

## 👥 Contributori

<p align="center">
  <a href="https://github.com/troncare/zyk-bot/graphs/contributors">
    <img src="https://contrib.rocks/image?repo=troncare/zyk-bot"/>
  </a>
</p>