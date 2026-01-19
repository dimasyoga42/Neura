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
        pts_stk,
        map
      `)
      .ilike("mets", `%${query}%`);

    if (error) throw error;

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Data tidak ditemukan." },
        { quoted: msg }
      );
    }

    const txts = data
      .map((item) => {
        const dropList = item.drops ? item.drops.split(";").join("\n") : "-";
        const ptsList = item.pts_stk ? item.pts_stk.split(";").join("\n") : "-";

        return (
          `Nama: ${item.nama} (${item.element || "-"})\n` +
          `Map: ${item.map}\n` +
          `Drop:\n${dropList}\n` +
          `Pts/Stk:\n${ptsList}`
        );
      })
      .join("\n-------------------\n");

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
