import axios from "axios";
import { supabase } from "../../model/supabase.js"
export const waifu = async (sock, chatId, msg) => {
  try {

    const { data } = await axios.get("https://api.waifu.pics/sfw/waifu");

    if (!data?.url) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil foto" },
        { quoted: msg }
      );
    }

    await sock.sendMessage(
      chatId,
      {
        image: { url: data.url },
        caption: "waifu"
      },
      { quoted: msg }
    );

  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: `error internal server\n${err.message}` },
      { quoted: msg }
    );
  }
};

export const husbu = async (sock, chatId, msg) => {
  try {
    const data = await axios.get("https://nekos.best/api/v2/husbando?amount=1")
    const imgLink = data.data.results
    sock.sendMessage(chatId, { image: { url: `${imgLink.url}` }, caption: "nih husbu buat kamu" }, { quoted: msg })
  } catch (error) {
    sock.sendMessage(chatId, { text: `[husbu error] ${error.message}` }, { quoted: msg })
  }
}
