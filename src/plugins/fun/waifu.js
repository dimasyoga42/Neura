import axios from "axios";
import { supabase } from "../../model/supabase.js"
import { fetchdata, registerCommand } from "../../../setting.js";
import { ColdownUser } from "../../admin/coldownChat.js";
export const waifu = async (sock, chatId, msg) => {
  try {

    const data = await fetchdata("https://api.waifu.im/images?IncludedTags=waifu")
    if (!data.items.url) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil foto" },
        { quoted: msg }
      );
    }

    data.items.map((item) => {
      sock.sendMessage(
        chatId,
        {
          image: { url: item.url },
          caption: `ini adalah waifu mu\n> source: ${item.source} || artists: ${item.artists[0].name}`
        },
        { quoted: msg }
      );
    })

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
    const response = await axios.get("https://nekos.best/api/v2/husbando?amount=1");

    const results = response.data.results;

    if (results && results.length > 0) {
      const targetImage = results[0]; // Mengambil indeks ke-0

      console.log("Data Gambar:", targetImage); // Debugging

      await sock.sendMessage(chatId, {
        image: { url: targetImage.url }, // Mengakses properti .url dari objek
        caption: "Nih husbu buat kamu"
      }, { quoted: msg });
    } else {
      throw new Error("API tidak memberikan hasil data gambar.");
    }

  } catch (error) {
    console.error(error);
    await sock.sendMessage(chatId, { text: `[husbu error] ${error.message}` }, { quoted: msg });
  }
}
registerCommand({
  name: "waifu",
  alias: ["waifu"],
  category: "Menu Fun",
  desc: "mendapatkan gambar waifu random",
  run: async (sock, chatId, msg) => {
    const allow = await ColdownUser(sock, chatId, msg, ".waifu");
    if (!allow) return;
    if (isBan(sock, chatId, msg)) return;
    waifu(sock, chatId, msg);
  }
});
