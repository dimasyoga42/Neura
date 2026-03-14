import axios from "axios";
import { sendFancyText } from "../../../lib/message.js";
import { Readable } from "stream";

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

    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const buffer = Buffer.from(audioRes.data);

    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

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
        audio: stream,
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("Error di play:", err);

    await sock.sendMessage(
      chatId,
      { text: `❌ Terjadi error: ${err.message}` },
      { quoted: msg },
    );
  }
};
