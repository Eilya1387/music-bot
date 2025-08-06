# 🎵 Telegram Music Finder Bot

A powerful Telegram bot that lets users **search and download songs** by sending:
- A **song name** as text
- A **voice message** (part of the song)
- A **video** or **audio file** (containing the music)

This bot uses:
- `yt-search` + `yt-dlp` + `ffmpeg` to fetch and convert YouTube music
- `ACRCloud` to identify songs in audio/video files or voice messages

---

## 📦 Features

✅ Search for songs by name  
✅ Recognize and download songs from voice messages  
✅ Recognize and download songs from audio/video clips  
✅ Supports Persian, English, and many more languages  
✅ Automatic file cleanup  
✅ Friendly feedback & error messages

---

## 🚀 Getting Started

### 1. Clone the project

```bash
git clone https://github.com/Eilya1387/music-bot.git
cd music-bot
```
2. Install dependencies
```bash
npm install
```
---

3. Setup .env
Create a .env file in the root folder and add:

TOKEN_BOT=your_telegram_bot_token
ACR_ACCESS_KEY=your_acrcloud_access_key
ACR_ACCESS_SECRET=your_acrcloud_access_secret
ACR_HOST=your_acrcloud_host

You can get ACRCloud credentials from:
```bash
👉 https://www.acrcloud.com
```
---

📁 Project Structure

├── downloads/         # Temporary audio files <br/>
├── ffmpeg.exe         # FFmpeg binary (Windows only) <br/>
├── yt-dlp.exe         # yt-dlp binary (Windows only) <br/>
├── index.js           # Main bot logic <br/>
├── .env               # Environment variables  <br/>
├── .gitignore         # Ignore node_modules & .env <br/>
├── package.json <br/>
└── README.md <br/>

---

🧠 How It Works

Text → Searches YouTube for the song title

Voice / Audio / Video → Uses ACRCloud to recognize the song fingerprint

Downloads and converts audio to mp3

Sends the audio file back to the user

---

🛠 Requirements
Node.js v18+

FFmpeg

yt-dlp

ACRCloud account

---
👨‍💻 Developed by Eilya

