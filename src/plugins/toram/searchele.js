
import { supabase } from "../../model/supabase.js";

export const eleMonster = async (sock, chatId, msg, text) => {
  try {
  } catch (error) {
    console.log(error)
  }
}

export const eleBos = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ")
    const name = arg[1]
    if (!name) return sock.sendMessage(chatId, { text: "tolong masukan element setelah !elebos" }, { quoted: msg });
    const { data, error } = await supabase.from("bosdef").select("name, element").ilike("element", `%${name}%`);
    if (data.length === 0 || error) return sock.sendMessage(chatId, { text: "element yang anda cari tidak ada" }, { quoted: msg });
    const msgTxt = data.map((item, i) => {
      return `${i + 1}. ${item.name}\n`
    })
    sock.sendMessage(chatId, { text: `Daftar Nama Bos Berdasarkan Element\n${msgTxt}`.trim() }, { quoted: msg })
  } catch (error) {

  }

}


