import axios from "axios";
import { sendFancyText } from "../../lib/message.js";

export const qweenAi = async (sock, chatId, msg, text) => {
  try {
    const { ask } = text.replace(".qween", "").trim();
    if (!ask)
      return sendFancyText(sock, chatId, {
        title: "Neura Sama",
        body: "Tolong berikan pertanyaan nya..",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        msg: msg,
      });
    const res = await axios.get(
      `https://api.neoxr.eu/api/qwen3?q=${encodeURIComponent(ask)}&apikey=${process.env.NOXER}`,
    );
    const result = res.data.data;
    sock.sendMessage(chatId, { text: result.message }, { quoted: msg });
  } catch (err) {
    sendFancyText(sock, chatId, {
      title: "Neura Sama",
      body: "Sepertinya ada kendala",
      text: "coba ulang command nya, jika tetap error lapor owner",
      thumbnail:
        "https://i.ibb.co/gMvHLqnY/Kesalahan-server-500-yang-cemas.png",
      msg: msg,
    });
  }
};
