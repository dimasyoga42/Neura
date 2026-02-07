import { supabase } from "../../model/supabase.js"

function toCodeBlock(text) {
  return "```\n" + text.trim() + "\n```"
}
const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace(".bos", "").trim()
    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Mohon masukkan nama boss setelah perintah .bos" },
        { quoted: msg }
      )
    }

    const { data, error } = await supabase
      .from("bosdef")
      .select("*")
      .ilike("name", `%${name}%`)
      .limit(1)

    if (error) {
      console.error("Supabase Error:", error)
      return sock.sendMessage(
        chatId,
        { text: "Terjadi kesalahan saat mengambil data boss." },
        { quoted: msg }
      )
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Boss tidak ditemukan dalam database Neura." },
        { quoted: msg }
      )
    }

    const boss = data[0]

    const msgtxt = `
*Boss Information By Neura Sama*
Search: ${name}

General Information:
Name: ${boss.name}
Element:
${boss.element}
Spawn: ${boss.spawn}

${toCodeBlock(boss.stat)}\n> source: Phantom library
    `.trim()

    await sock.sendMessage(
      chatId,
      {
        image: { url: boss.image_url },
        caption: msgtxt
      },
      { quoted: msg }
    )

  } catch (err) {
    console.error("Kesalahan Sistem:", err)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan internal saat memproses data boss." },
      { quoted: msg }
    )
  }
}

export const setBos = async (sock, chatId, msg, text) => {
  try {
    const args = text.split("|")
    const name = args[1]
    const spawn = args[2]
    const image_url = args[3]
    const element = args[4]
    const stat = args[5]
    const type = args[6]
    if (!name || !spawn || !image_url || !stat) {
      return sock.sendMessage(chatId, { text: "Format input tidak valid. Pastikan semua parameter wajib terisi." }, { quoted: msg });
    }

    const { data, error } = await supabase.from("bosdef").insert({
      name,
      type: type || "General",
      image_url,
      spawn,
      element: element || "Neutral",
      stat
    });

    if (error) throw error;

    await sock.sendMessage(chatId, { text: `Data bos "${name}" berhasil ditambahkan ke database.` }, { quoted: msg });

  } catch (error) {
    console.error("Database Error:", error);
    await sock.sendMessage(chatId, { text: "Terjadi kesalahan internal saat mencoba menyimpan data ke database." }, { quoted: msg });
  }
}

export const listboss = async (sock, chatId, msg) => {
  try {
    const { data, error } = await supabase
      .from("bosdef")
      .select("name")

    if (error) {
      console.error("Supabase Error:", error)
      return sock.sendMessage(
        chatId,
        { text: "Gagal mengambil data boss dari database." },
        { quoted: msg }
      )
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Daftar boss kosong atau tidak ditemukan." },
        { quoted: msg }
      )
    }

    const listText = data
      .map((item, i) => `${i + 1}. ${item.name}`)
      .join("\n")

    const ctx = `
*Daftar Boss*
Total: ${data.length}

${toCodeBlock(listText)}
    `.trim()

    await sock.sendMessage(
      chatId,
      { text: ctx },
      { quoted: msg }
    )

  } catch (err) {
    console.error("Kesalahan Sistem:", err)
    await sock.sendMessage(
      chatId,
      { text: "internal server error" },
      { quoted: msg }
    )
  }
}


export default Bossdef
