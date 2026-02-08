import axios from "axios";
import { supabase } from "../../model/supabase.js"
import { fetchdata, registerCommand } from "../../../setting.js";
import { ColdownUser } from "../../admin/coldownChat.js";
import { isBan } from "../fitur/ban.js";
export const waifu = async (sock, chatId, msg) => {
  try {
    // Melakukan request ke API waifu.im
    const response = await axios.get("https://api.waifu.im/images?IncludedTags=waifu");
    const data = response.data;

    // Validasi apakah properti 'items' ada dan memiliki elemen
    if (!data.items || data.items.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Gagal mengambil foto: Data tidak ditemukan dalam repositori API." },
        { quoted: msg }
      );
    }


    data.items.forEach((item) => {
      const artistName = (item.artists && item.artists.length > 0)
        ? item.artists[0].name
        : "Anonim";

      sock.sendMessage(
        chatId,
        {
          image: { url: item.url },
          caption: `Ini adalah waifu mu\n\nSource: ${item.source}\n Artist: ${artistName}`
        },
        { quoted: msg }
      );
    });

  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: `Error Internal Server:\n${err.message}` },
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
