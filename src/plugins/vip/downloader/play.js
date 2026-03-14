import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { sendFancyText } from "../../../lib/message.js";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

try {
  const path = execSync("which ffmpeg").toString().trim();
  ffmpeg.setFfmpegPath(path);
} catch {}

const convertToMp3 = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const tmpIn = join(tmpdir(), `neura_${Date.now()}.mp3`);
    const tmpOut = join(tmpdir(), `neura_${Date.now()}_fixed.mp3`);

    const cleanup = () => {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    };

    try {
      writeFileSync(tmpIn, inputBuffer);

      ffmpeg(tmpIn)
        .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
        .format("mp3")
        .on("end", () => {
          try {
            const buffer = readFileSync(tmpOut);
            cleanup();
            resolve(buffer);
          } catch (e) {
            cleanup();
            reject(e);
          }
        })
        .on("error", (err) => {
          cleanup();
          reject(err);
        })
        .save(tmpOut);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
};

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(/^\.play\s*/i, "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "🎵 Masukkan judul lagu." },
        { quoted: msg },
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "⏳ Mencari lagu..." },
      { quoted: msg },
    );

    const res = await axios.get(
      `https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`,
    );

    const data = res.data;

    if (!data?.data?.url) {
      return await sendFancyText(sock, chatId, {
        title: "Neura Play",
        body: "❌ Musik tidak ditemukan",
        text: "",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        quoted: msg,
      });
    }

    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    const mp3Buffer = Buffer.from(audioRes.data);

    let fixedBuffer;

    try {
      fixedBuffer = await convertToMp3(mp3Buffer);
    } catch {
      fixedBuffer = mp3Buffer;
    }

    await sendFancyText(sock, chatId, {
      title: "Neura Play 🎵",
      body: `${data.title}`,
      text: `Channel: ${data.channel}\nDurasi: ${data.fduration}\nViews: ${data.views}\nSize: ${data.data.size}`,
      thumbnail: data.thumbnail,
      quoted: msg,
    });

    await sock.sendMessage(
      chatId,
      {
        audio: fixedBuffer,
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("Play error:", err);

    await sock.sendMessage(
      chatId,
      { text: `❌ Error: ${err.message}` },
      { quoted: msg },
    );
  }
};
