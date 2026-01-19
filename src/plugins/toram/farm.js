import { supabase } from "../../model/supabase.js";

export const farm = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace("!listfarm", "").trim();

    if (!query) {
      return sock.sendMessage(chatId, {
        text: "Format salah.\nContoh: !listfarm metal\nKategori: Metal, Cloth, Wood, Medicine, Beast, Mana"
      }, { quoted: msg });
    }

    const { data, error } = await supabase
      .from("farm")
      .select("mets, nama, element, drops, pts/stk, map")
      .ilike("mets", `%${query}%`);

    if (error) throw new Error(error.message);

    if (!data || data.length === 0) {
      return sock.sendMessage(chatId, { text: "Data tidak ditemukan." }, { quoted: msg });
    }

    const txts = data.map((item) => {
      return `Nama: ${item.nama} (${item.element})\nMap: ${item.map}\nDrop: ${item.drop}\nPts/Stk: ${item["pt/stk"]}`;
    }).join("\n---\n");

    await sock.sendMessage(chatId, { text: txts }, { quoted: msg });

  } catch (error) {
    console.error(error);
    await sock.sendMessage(chatId, { text: "Terjadi kesalahan sistem." }, { quoted: msg });
  }
};
