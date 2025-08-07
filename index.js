const { Telegraf } = require("telegraf"); // import kardan Telegraf baraye sakhte bot Telegram
require("dotenv").config(); // load kardan environment variable ha az file .env
const ytSearch = require("yt-search"); // import kardan package baraye search kardan to YouTube
const fs = require("fs"); // module asli Node.js baraye kar ba file system
const path = require("path"); // module asli Node.js baraye kar ba path file ha
const util = require("util"); // module asli Node.js baraye kar ba utility functions
const { exec } = require("child_process"); // function exec baraye ejraye dastorat system (shell command)
const fetch = require("node-fetch"); // package baraye ferestadan request HTTP
const ACRCloud = require("acrcloud"); // import kardan SDK ACRCloud baraye shenasaei file haye audio
const unlink = util.promisify(fs.unlink); // tabdil fs.unlink be promise baraye estefade ba async/await
const bot = new Telegraf(process.env.TOKEN_BOT); //inam ke midooni
const FFMPEG_PATH = path.join(__dirname, "ffmpeg");

// ACRCloud setup
const acr = new ACRCloud({
  host: process.env.ACR_HOST,
  access_key: process.env.ACR_ACCESS_KEY,
  access_secret: process.env.ACR_ACCESS_SECRET,
});

const downloadsDir = path.join(__dirname, "downloads"); // sakhte path baraye folder "downloads" ke to hamon directory file asli hast
if (!fs.existsSync(downloadsDir)) {
  // check mikone age folder "downloads" vojood nadare...
  fs.mkdirSync(downloadsDir); // ...folder ro misaze
}

const activeUsers = new Set(); // yek Set misaze baraye zakhire user haye faal (masalan jolo giri az spam)

console.log("🤖 Bot started");

bot.start((ctx) => {
  console.log(`📥 /start from ${ctx.from.username || ctx.from.first_name}`);
  ctx.reply(
    `😁${ctx.from.first_name} سلام خوشگله\nیه تیکه از آهنگ یا اسمشو بفرست تا دانلود کنم 🎶 یا برام ویس بفرست تا حدس بزنم چی بوده 🎧`
  );
});

// text searching
bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const messageId = ctx.message.message_id;
  const text = ctx.message.text.trim();

  if (activeUsers.has(userId)) {
    console.log(`⏳ User ${userId} already in queue`);
    return;
  }
  activeUsers.add(userId);

  if (!/[a-zA-Zآ-ی]/.test(text)) {
    await ctx.reply("❌ این بات فقط از این فرمت پیام پشتیبانی نمی کند");
    activeUsers.delete(userId);
    return;
  }

  const isYouTubeUrl = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//.test(
    text
  );

  if (isYouTubeUrl) {
    await ctx.reply("❌ فقط *اسم آهنگ* رو بفرست، نه لینک");
    activeUsers.delete(userId);
    return;
  }

  await ctx.reply("در حال جستجوی آهنگ... 🔍", {
    reply_to_message_id: messageId,
  });

  handleAudioDownload(ctx, text, messageId, userId).catch((err) => {
    console.error("❌ Background error:", err);
    activeUsers.delete(userId);
  });
});

// voice searching
bot.on(["voice", "audio", "video"], async (ctx) => {
  const userId = ctx.from.id;
  const messageId = ctx.message.message_id;
  const file = ctx.message.voice || ctx.message.audio || ctx.message.video;

  if (!file) {
    return (
      ctx.reply("😕 فایل قابل شناسایی نبود"),
      console.log("❌ cant detect the file ")
    );
  }

  const fileId = file.file_id;
  const fileLink = await ctx.telegram.getFileLink(fileId);
  const tempPath = path.join(downloadsDir, `temp_${userId}.mp3`);

  const res = await fetch(fileLink.href);
  const buffer = await res.arrayBuffer();
  fs.writeFileSync(tempPath, Buffer.from(buffer));

  await ctx.reply("🔍 در حال شناسایی آهنگ...");
  console.log("✅ detecting music...");
  try {
    const acrRes = await acr.identify(fs.readFileSync(tempPath));
    const metadata = acrRes.metadata?.music?.[0];

    if (!metadata) {
      await ctx.reply("نتونستم آهنگ رو شناسایی کنم 😢");
      console.log("❌ cant detect the music");
      return;
    }

    const title = metadata.title;
    const artist = metadata.artists?.[0]?.name || "";
    const fullQuery = `${title} ${artist}`;

    await ctx.reply(`✅ آهنگ شناسایی شد:\n🎵 ${title}\n🎤 ${artist}`);
    console.log("✅ we can detect music");
    handleAudioDownload(ctx, fullQuery, messageId, userId);
  } catch (err) {
    console.error("❌ ACR error:", err);
    ctx.reply("🚫 خطا در شناسایی آهنگ");
  } finally {
    fs.unlinkSync(tempPath);
  }
});

//tabe download music
async function handleAudioDownload(ctx, query, messageId, userId) {
  const chatId = ctx.chat.id;
  let audioPath = "";
  try {
    const result = await ytSearch(query);
    const video = result.videos.length > 0 ? result.videos[0] : null;

    if (!video) {
      await ctx.reply("آهنگی پیدا نشد 😕");
      return;
    }

    const url = video.url;
    const title = video.title || "audio";
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").slice(0, 50);
    const filename = `audio_${chatId}_${messageId}_${Date.now()}.mp3`;
    audioPath = path.resolve(__dirname, "downloads", filename);

    await ctx.reply(`در حال دانلود "${safeTitle}"... 🎶`, {
      reply_to_message_id: messageId,
    });
    console.log("✅ downloading & convert to MP3");

    // agar platform windows bashe az 'yt-dlp.exe' estefade mikone, dar gheire in soorat 'yt-dlp'
    const ytdlp = path.resolve(
      __dirname,
      process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp"
    );

    // command baraye download kardan behtarin audio az youtube va tabdil be mp3 ba estefade az ffmpeg
    // --ffmpeg-location: masir ffmpeg ro moshakhas mikone
    // -f bestaudio: behtarin quality audio ro migire
    // --extract-audio: faghat audio ro extract mikone
    // --audio-format mp3: format ro mp3 mikone
    // -o: masir va name file khoruji ro moshakhas mikone
    const command = `${ytdlp} --ffmpeg-location "${FFMPEG_PATH}" -f bestaudio --extract-audio --audio-format mp3 -o "${audioPath}" "${url}"`;

    await execPromise(command);

    await ctx.replyWithAudio(
      { source: audioPath, filename: `${safeTitle}.mp3` },
      {
        caption: `🎵 ${safeTitle}`,
        reply_to_message_id: messageId,
      }
    );
    console.log(`✅ music send it! ${safeTitle}`);
  } catch (err) {
    console.error("❌ error:", err.message);
    await ctx.reply("یه مشکلی پیش اومد 😔 لطفاً دوباره امتحان کن");
  } finally {
    activeUsers.delete(userId);
    if (fs.existsSync(audioPath)) {
      await unlink(audioPath);
      console.log("✅ file deleted!");
    }
  }
}
// in function yek command ro (masalan baraye download) ba promise ejra mikone
// ejraye command ba timeout 5 daghighe
// agar error rokh dad error ro log mikone
// va reject mikone promise ro
// agar movafagh bood, natije ro resolve mikone
function execPromise(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, { timeout: 300000 }, (error, stdout, stderr) => {
      if (error) {
        console.error("⛔ exec error:", stderr);
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}

bot.launch();
process.once("SIGINT", () => {
  console.log("🛑 SIGINT received. Shutting down bot...");
  bot.stop("SIGINT");
});
process.once("SIGTERM", () => {
  console.log("🛑 SIGTERM received. Shutting down bot...");
  bot.stop("SIGTERM");
});

//developed by Eilya
