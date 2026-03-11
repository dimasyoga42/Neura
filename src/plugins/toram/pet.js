import { supabase } from "../../model/supabase.js";

export const pet = async (sock, chatId, msg) => {
  try {
    const { data } = await supabase
      .from("perpus")
      .select("*")
      .ilike("judulPerpus", "guide")
      .limit(1);
    sock.sendMessage(chatId, { text: `${data.isiBuku}` }, { quoted: msg });
  } catch (err) {
    console.error("[pet] Error:", err);
  }
};
