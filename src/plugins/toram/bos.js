import { supabase } from "../../model/supabase.js"

function toCodeBlock(text) {
  return "`\n" + text.trim() + "\n`"
}
const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bos", "").trim()
    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Mohon masukkan nama boss setelah perintah !bos" },
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

${toCodeBlock(boss.stat)}
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

export default Bossdef
