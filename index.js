const { Telegraf } = require("telegraf");
require("dotenv").config();
const ytSearch = require("yt-search");
const fs = require("fs");
const path = require("path");
const util = require("util");
const { exec } = require("child_process");
const unlink = util.promisify(fs.unlink);
const bot = new Telegraf(process.env.TOKEN_BOT);
const FFMPEG_PATH = path.join(__dirname, "ffmpeg.exe");

const downloadsDir = path.join(__dirname, "downloads");
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir);
}

const activeUsers = new Set();

console.log("🤖 Bot started");

bot.start((ctx) => {
  console.log(`📥 /start from ${ctx.from.username || ctx.from.first_name}`);
  ctx.reply(
    `😁${ctx.from.first_name} سلام خوشگله\nیه تیکه از آهنگ یا اسمشو بفرست تا دانلود کنم`
  );
});

bot.on("text", async (ctx) => {
  const userId = ctx.from.id;
  const messageId = ctx.message.message_id;
  const text = ctx.message.text.trim();

  if (activeUsers.has(userId)) {
    console.log(`⏳processing... user ${userId} already send request`);
    return;
  }

  activeUsers.add(userId);

  if (!/[a-zA-Zآ-ی]/.test(text)) {
    await ctx.reply("❌این بات فقط از پیام متنی پشتیبانی می‌کند");
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
  console.log("✅ searching the music...");
  handleAudioDownload(ctx, text, messageId, userId).catch((err) => {
    console.error("❌ Background error:", err);
    activeUsers.delete(userId);
  });
});

async function handleAudioDownload(ctx, query, messageId, userId) {
  const chatId = ctx.chat.id;

  try {
    const result = await ytSearch(query);
    const video = result.videos.length > 0 ? result.videos[0] : null;

    if (!video) {
      await ctx.reply("آهنگی پیدا نشد 😕");
      return;
    } else {
      console.log("✅ music found!");
    }

    const url = video.url;
    const title = video.title || "audio";
    const safeTitle = title.replace(/[<>:"/\\|?*]/g, "").slice(0, 50);
    const filename = `audio_${chatId}_${messageId}_${Date.now()}.mp3`;
    const audioPath = path.resolve(downloadsDir, filename);

    await ctx.reply(`در حال دانلود "${safeTitle}"... 🎶`, {
      reply_to_message_id: messageId,
    });

    const ytdlp = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
    const command = `${ytdlp} --ffmpeg-location "${FFMPEG_PATH}" -f bestaudio --extract-audio --audio-format mp3 -o "${audioPath}" "${url}"`;

    console.log(`✅ downloading & convert to mp3 audio`);
    await execPromise(command);
    console.log(`✅ download complete: ${safeTitle}`);

    try {
      await ctx.replyWithAudio(
        { source: audioPath, filename: `${safeTitle}.mp3` },
        {
          caption: `🎵 ${safeTitle}`,
          reply_to_message_id: messageId,
        }
      );
      console.log(`✅ send it! user: ${ctx.from.id} music name : ${safeTitle}`);
    } catch (err) {
      console.error(
        "❌we have problem while send music user: ${ctx.from.id} music name : ${safeTitle}",
        err
      );
    }

    await unlink(audioPath);
    console.log("🗑️ File deleted");
  } catch (err) {
    console.error("❌ error:", err.message);
    await ctx.reply("یه مشکلی پیش اومد 😔 لطفاً دوباره امتحان کن");
  } finally {
    activeUsers.delete(userId);
  }
}

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


// developed by Eilya