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

    const res = await axios.get(
      `https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`,
    );
    const data = res.data;

    if (!data?.data?.url) {
      return await sendFancyText(sock, chatId, {
        title: "Neura Play",
        body: "musik yang anda cari tidak ada",
        text: "",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        quoted: msg,
      });
    }

    await sendFancyText(sock, chatId, {
      title: "Neura Play",
      body: `Music: ${data.title}`,
      text: `Channel: ${data.channel}\nDurasi: ${data.fduration}`,
      thumbnail: data.thumbnail,
      quoted: msg,
    });

    // Download audio
    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      timeout: 60000,
    });

    const audioBuffer = Buffer.from(audioRes.data);
    console.log("Buffer size:", audioBuffer.length); // cek di console

    await sock.sendMessage(
      chatId,
      {
        audio: data.data.url,
        mimetype: "audio/mpeg",
        ptt: false,
        fileLength: audioBuffer.length,
        fileName: data.data.filename,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error(err);
    await sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};
