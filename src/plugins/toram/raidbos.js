import { supabase } from "../../model/supabase.js";

export const raidBos = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ")[1];
    if (!arg) return sock.sendMessage(chatId, { text: "Masukkan nama bos raid yang ingin dicari setelah .rb (nama bos raid)" }, { quoted: msg });
    const bosName = arg.toLowerCase();

    const { data: raidBos, error: raiderr } = await supabase.from("bosraid").select("name, element, stat").ilike("name", `%${arg}%`).limit(1).single();
    if (!raidBos || raiderr) return sock.sendMessage(chatId, { text: `Bos raid dengan nama "${arg}" tidak ditemukan.` }, { quoted: msg });

    const msgTxt = `
    *${raidBos.name}* - ${raidBos.element}
    ${raidBos.stat}
    `.trim();
    await sock.sendMessage(chatId, { text: msgTxt }, { quoted: msg });
  } catch (error) {

  }
}

