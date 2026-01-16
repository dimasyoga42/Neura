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
