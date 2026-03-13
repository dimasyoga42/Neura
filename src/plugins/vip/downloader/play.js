import axios from "axios";
import { sendAudio, sendFancyText } from "../../../lib/message.js";

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(".play", "").trim();
    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "Masukkan judul lagu." },
        { quoted: msg },
      );
    }

    // Panggil API
    const res = await axios.get(
      `https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`,
    );
    const data = res.data;

    if (!data?.data?.url) {
      return await sendFancyText(sock, chatId, {
        title: "Neura Play",
        body: "Musik yang anda cari tidak ada",
        text: "",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        quoted: msg,
      });
    }

    // Kirim info musik
    await sendFancyText(sock, chatId, {
      title: "Neura Play",
      body: `Music: ${data.title}`,
      text: `Channel: ${data.channel}\nDurasi: ${data.fduration}`,
      thumbnail: data.thumbnail,
      quoted: msg,
    });

    // Download audio sebagai buffer
    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    const audioBuffer = Buffer.from(audioRes.data);
    console.log("Buffer size:", audioBuffer.length);

    // Kirim audio ke WhatsApp
    await sock.sendMessage(
      chatId,
      {
        audio: audioBuffer, // pakai buffer, bukan url
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("Error di play:", err.message);
    await sock.sendMessage(
      chatId,
      { text: "Terjadi error: " + err.message },
      { quoted: msg },
    );
  }
};
