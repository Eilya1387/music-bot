🎵 Telegram Music Downloader Bot
A Telegram bot that lets users send the name of a song, and it will search YouTube, download the best quality audio, convert it to MP3 using ffmpeg, and send it back to the user.

🚀 Features
Accepts song names (text messages)

Searches YouTube using yt-search

Downloads the best audio stream with yt-dlp

Converts audio to .mp3 using ffmpeg

Sends the MP3 file back to the user

Ignores links (to prevent spam)

Basic anti-spam: prevents multiple requests per user at the same time

🧰 Requirements
Node.js (v14 or higher)

ffmpeg (included as ffmpeg.exe in this project)

yt-dlp (yt-dlp.exe should be available in the root directory)

A Telegram bot token from @BotFather

---
  
📦 Installation

git clone https://github.com/Eilya1387/telegram-music-bot.git
cd telegram-music-bot
npm install

---

🛠 Configuration
Place your ffmpeg.exe file in the project root or a known directory.

Download the latest yt-dlp.exe and place it in the project root.

Replace the bot token in index.js:

const bot = new Telegraf("YOUR_BOT_TOKEN_HERE");

---
▶️ Run the bot
node index.js

---

The bot will start, and you’ll see:

🤖 Bot started

---

📁 Folder Structure

.
├── downloads/         # Temporary audio files
├── ffmpeg.exe         # ffmpeg binary
├── yt-dlp.exe         # yt-dlp binary
├── index.js           # Main bot code
├── package.json
└── README.md

---

📸 Example Usage
User sends: Shape of You

Bot replies: “Searching...”

Bot sends: 🎵 Shape of You.mp3

⚠️ Notes
Only text messages are supported.

YouTube links will be ignored (only song names are allowed).

Each user can only process one request at a time.

