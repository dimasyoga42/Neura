import axios from "axios";
import fetch from "node-fetch";
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
    if (!data.data)
      return sendFancyText(sock, chatId, {
        title: "Neura Play",
        body: "musik yang anda cari tidak ada",
        text: "",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        msg: msg,
      });
    const data = res.data;
    sendFancyText(sock, chatId, {
      title: "Neura Play",
      body: `music: ${data.title}`,
      thumbnail: data.thumbnail,
      msg: msg,
    });
    sendAudio(sock, chatId, data.data.url, true, msg);
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};
