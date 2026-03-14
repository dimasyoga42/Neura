import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "@ffmpeg-installer/ffmpeg";
import { Readable, PassThrough } from "stream";
import { sendFancyText } from "../../../lib/message.js";

ffmpeg.setFfmpegPath(ffmpegPath.path);

// Convert MP3 buffer → OGG Opus (format yang WhatsApp support)
const convertToOpus = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const input = new Readable();
    input.push(inputBuffer);
    input.push(null);

    const output = new PassThrough();
    const chunks = [];

    output.on("data", (chunk) => chunks.push(chunk));
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);

    ffmpeg(input)
      .inputFormat("mp3")
      .audioCodec("libopus")
      .format("ogg")
      .pipe(output);
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

    // Notif loading
    await sock.sendMessage(
      chatId,
      { text: "⏳ Mencari lagu, mohon tunggu..." },
      { quoted: msg },
    );

    // 1. Fetch info lagu dari API
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

    // 2. Download audio sebagai buffer
    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 60000,
    });

    const mp3Buffer = Buffer.from(audioRes.data);
    console.log("Buffer size:", mp3Buffer.length, "bytes");

    // 3. Convert MP3 → OGG Opus
    let audioBuffer;
    let mimetype;

    try {
      audioBuffer = await convertToOpus(mp3Buffer);
      mimetype = "audio/ogg; codecs=opus";
      console.log("Convert opus berhasil, size:", audioBuffer.length, "bytes");
    } catch (convertErr) {
      // Fallback: kirim MP3 langsung kalau convert gagal
      console.warn("Convert gagal, fallback ke MP3:", convertErr.message);
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
