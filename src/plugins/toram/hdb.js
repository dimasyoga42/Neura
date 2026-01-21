import { supabase } from "../../model/supabase.js"
export const searchHdb = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!hdb", "");
    if (!arg) return sock.sendMessage(chatId, { text: "kamu harus tulis nama bos hdb setelah cmd !hdb etoise" }, { quoted: msg })

    const res = await supabase.from("hdb").select("bosname, stat").ilike("bosname", `%${arg}%`)

    const msgtext = `
    *Hdb stat By Neura Sama*
    *${res.bosname}*
    *Stat def:*
    ${res.stat}
    `.trim()

    sock.sendMessage(chatId, { text: msgtext }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg })
  }
}
