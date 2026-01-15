import { supabase } from "../../model/supabase.js"

export const skill = async (sock, chatId, msg, text) => {
  try {
    const input = text.replace("!skill", "").trim()

    if (!input) {
      return sock.sendMessage(
        chatId,
        { text: "format salah\ncontoh: !skill Assasin" },
        { quoted: msg }
      )
    }

    const { data, error } = await supabase
      .from("skill")
      .select(`
        Skill Tree,
        Nama Skill,
        Type,
        MP Cost,
        Element,
        Range,
        Deskripsi_Indo
      `)
      .ilike("SKill Tree", `%${input}%`)

    console.log(data)

    if (error || !data.length) {
      return sock.sendMessage(
        chatId,
        { text: "skill tidak ditemukan" },
        { quoted: msg }
      )
    }

    const rgMessage = `
*Skill Information By Neura Sama*
*Skill Tree: ${input}*

${data.map((item, i) => `
${i + 1}. *${item["Nama Skill"]}*
• Type: ${item.Type}
• MP Cost: ${item["MP Cost"]}
• Element: ${item.Element}
• Range: ${item.Range}
• Deskripsi: ${item.Deskripsi_Indo}
`
    )
        .join("\n")}
    `.trim()

    await sock.sendMessage(chatId, { text: rgMessage }, { quoted: msg })
  } catch (err) {
    sock.sendMessage(chatId, { text: `[ERROR] ${err.message}` }, { quoted: msg })
  }
}
