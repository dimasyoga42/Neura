import { supabase } from "../../model/supabase.js";

export const searchHdb = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!hdb", "").trim();

    if (!arg) {
      return sock.sendMessage(
        chatId,
        { text: "kamu harus tulis nama bos hdb setelah cmd !shdb etoise" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("hdb")
      .select("bosname, stat")
      .ilike("bosname", `%${arg}%`)
      .limit(1);

    if (error) throw error;

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "data hdb tidak ditemukan" },
        { quoted: msg }
      );
    }

    const item = data[0];

    const msgtext = `
*Hdb stat By Neura Sama*
*${item.bosname}*
*Stat def:*
${item.stat}
`.trim();

    await sock.sendMessage(
      chatId,
      { text: msgtext },
      { quoted: msg }
    );
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan sistem" },
      { quoted: msg }
    );
  }
};
