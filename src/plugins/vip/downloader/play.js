import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { sendFancyText } from "../../../lib/message.js";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

ffmpeg.setFfmpegPath(execSync("which ffmpeg").toString().trim());

// Convert MP3 → OGG Opus via temp file (lebih stabil)
const convertToOpus = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const tmpIn = join(tmpdir(), `neura_in_${Date.now()}.mp3`);
    const tmpOut = join(tmpdir(), `neura_out_${Date.now()}.ogg`);

    try {
      // Tulis buffer ke file sementara
      writeFileSync(tmpIn, inputBuffer);

      ffmpeg(tmpIn)
        .audioFrequency(48000)
        .audioChannels(1)
        .audioCodec("libopus")
        .outputOptions(["-application voip"])
        .format("ogg")
        .on("end", () => {
          try {
            const result = readFileSync(tmpOut);
            // Hapus file sementara
            unlinkSync(tmpIn);
            unlinkSync(tmpOut);
            if (result.length === 0) return reject(new Error("Output kosong"));
            resolve(result);
          } catch (e) {
            reject(e);
          }
        })
        .on("error", (err) => {
          // Cleanup kalau error
          if (existsSync(tmpIn)) unlinkSync(tmpIn);
          if (existsSync(tmpOut)) unlinkSync(tmpOut);
          reject(err);
        })
        .save(tmpOut);
    } catch (e) {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
      reject(e);
    }
  });
};

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(/^\.play\s*/i, "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "🎵 Masukkan judul lagu yang ingin dicari." },
        { quoted: msg },
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "⏳ Mencari lagu, mohon tunggu..." },
      { quoted: msg },
    );

    // 1. Fetch info lagu
    const res = await axios.get(
      `https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`,
    );

    const data = res.data;

    if (!data?.data?.url) {
      return await sendFancyText(sock, chatId, {
        title: "Neura Play",
        body: "❌ Musik yang kamu cari tidak ditemukan",
        text: "",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        quoted: msg,
      });
    }

    // 2. Download MP3
    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 60000,
    });

    const mp3Buffer = Buffer.from(audioRes.data);
    console.log("MP3 buffer:", mp3Buffer.length, "bytes");

    // 3. Convert ke Opus via temp file
    let audioBuffer;
    let mimetype;

    try {
      audioBuffer = await convertToOpus(mp3Buffer);
      mimetype = "audio/ogg; codecs=opus";
      console.log("Opus buffer:", audioBuffer.length, "bytes");
    } catch (convertErr) {
      console.warn("Convert gagal, fallback MP3:", convertErr.message);
      audioBuffer = mp3Buffer;
      mimetype = "audio/mpeg";
    }

    // 4. Kirim info lagu
    await sendFancyText(sock, chatId, {
      title: "Neura Play 🎵",
      body: `${data.title}`,
      text: `Channel: ${data.channel}\nDurasi: ${data.fduration}\nViews: ${data.views}\nSize: ${data.data.size}`,
      thumbnail: data.thumbnail,
      quoted: msg,
    });

    // 5. Kirim audio
    await sock.sendMessage(
      chatId,
      {
        audio: audioBuffer,
        mimetype: mimetype,
        fileName: `${data.title}.mp3`,
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("Error di play:", err.message);
    await sock.sendMessage(
      chatId,
      { text: `❌ Terjadi error: ${err.message}` },
      { quoted: msg },
    );
  }
};
