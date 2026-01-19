import { supabase } from "../../model/supabase.js";





const parseStat = (stat) => {
  if (!stat) return "-";

  const result = [];
  const regex = /([a-zA-Z% ]+)\s*(-?\d+(?:\.\d+)?)/g;

  let match;
  while ((match = regex.exec(stat)) !== null) {
    const label = match[1].trim();
    const value = match[2];
    result.push(`${label} : ${value}`);
  }

  return result.length ? result.join("\n- ") : "-";
};
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
      .map((item, i) => {
        return (
          `${i + 1}.\n` +
          `Nama: ${item.nama} (${item.element || "-"})\n` +
          `Map: ${item.map}\n` +
          `Drop: ${parseStat(item.drops)}\n` +
          `Pts/Stk: ${parseStat(item.pts_stk)}`
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
