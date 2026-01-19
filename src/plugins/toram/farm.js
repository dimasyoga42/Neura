import { supabase } from "../../model/supabase.js";

export const farm = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace("!listfarm", "").trim();

    if (!query) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "Format salah.\n" +
            "Contoh: !listfarm metal\n" +
            "Kategori: Metal, Cloth, Wood, Medicine, Beast, Mana"
        },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("farmList")
      .select(`
        nama,
        element,
        drops,
        map,
        "pts/stk": pts_stk
      `)
      .ilike("material", `%${query}%`);

    if (error) throw error;

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Data tidak ditemukan." },
        { quoted: msg }
      );
    }

    const txts = data
      .map((item, i) => {
        return (
          `${i + 1}.\n` +
          `Nama: ${item.nama} (${item.element || "-"})\n` +
          `Map: ${item.map}\n` +
          `Drop: ${item.drops}\n` +
          `Pts/Stk: ${item.pts_stk}`
        );
      })
      .join("\n---\n");

    await sock.sendMessage(
      chatId,
      { text: txts },
      { quoted: msg }
    );
  } catch (error) {
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan sistem." },
      { quoted: msg }
    );
  }
};
