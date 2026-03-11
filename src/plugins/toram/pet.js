import { supabase } from "../../model/supabase.js";

export const pet = async (sock, chatId, msg) => {
  try {
    const { data, error } = await supabase
      .from("perpus")
      .select("*")
      .ilike("judulPerpus", "%guide%")
      .limit(1);

    if (error) throw error;
    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Data tidak ditemukan." },
        { quoted: msg },
      );
    }

    const item = data[0];
    const text = item.isiPerpus ?? JSON.stringify(item, null, 2);

    sock.sendMessage(chatId, { text }, { quoted: msg });
  } catch (err) {
    console.error("[pet] Error:", err);
  }
};
