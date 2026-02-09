
import { supabase } from "../../model/supabase.js";

export const eleMonster = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ")
    const name = arg[1]
    if (!name) return sock.sendMessage(chatId, { text: "tolong masukan element setelah !elemonster" }, { quoted: msg });
    const { data, error } = await supabase.from("monster").select("name, element").ilike("element", `%${name}%`);
    if (data.length === 0 || error) return sock.sendMessage(chatId, { text: "element yang anda cari tidak ada" }, { quoted: msg });
    const msgTxt = data.map((item, i) => `${i + 1}. ${item.name}`
    ).join("\n")
    sock.sendMessage(chatId, { text: `Daftar Nama monster  Berdasarkan Element\n${msgTxt}`.trim() }, { quoted: msg })
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
    const msgTxt = data.map((item, i) => `${i + 1}. ${item.name}`
    ).join("\n")
    sock.sendMessage(chatId, { text: `Daftar Nama Bos Berdasarkan Element\n${msgTxt}`.trim() }, { quoted: msg })
  } catch (error) {
    console.log(error)
  }

}


