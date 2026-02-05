import { supabase } from "../../model/supabase.js"
export const itemStat = async (sock, chatId, msg, text) => {
  try {
    const stat = text.replace("!itemstat", "");
    if (!stat) return sock.sendMessage(chatId, { text: "tambahkan stat yang ingin di cari setelah !itemstat" }, { quoted: msg });

    const { data, error: errItem } = await supabase.from("item").select("nama, jenis, stat, drop").ilike("stat", `%${stat}%`);
    if (!data || data.length === 0 || errItem) return sock.sendMessage(chatId, { text: "tidak menemukan hasil yang sama gunakan versi bahasa inggris" }, { quoted: msg });

    const msgTxt = `
    Hasil dari Pencarian: ${stat}
    ${data.map((item, i) =>
      `[${i + 1}] ${item.nama}\nTipe: ${item.jenis}\nStat:\n${item.stat}\nDrop: ${item.drop}`
    )}
    >Neura Sama
    `.trim()
    sock.sendMessage(chatId, { text: msgTxt }, { quoted: msg })
  } catch (error) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat mengambil data" }, { quoted: msg });
    console.log(error.message);
  }
}

export const eleMonster = async (sock, chatId, msg, text) => {
  try {

  } catch (error) {

  }
}

