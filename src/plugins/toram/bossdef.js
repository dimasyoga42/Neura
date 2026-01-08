import fs from "fs"
import path from "path"

const __dirname = new URL(".", import.meta.url).pathname
const BOS_PATH = path.join(__dirname, "../../../data/bos.json")

const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace("!bos", "").trim().toLowerCase()

    const raw = fs.readFileSync(BOS_PATH, "utf-8")
    let data = JSON.parse(raw)

    if (!Array.isArray(data) || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Data boss kosong." },
        { quoted: msg }
      )
    }

    // 🔍 SEARCH (nama / difficulty / element / type / dll)
    if (query) {
      data = data.filter(boss =>
        Object.values(boss)
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    }

    if (data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: `Boss dengan kata "${query}" tidak ditemukan.` },
        { quoted: msg }
      )
    }

    const result = data.map((boss, i) => {
      const details = Object.entries(boss)
        .filter(([key, value]) => {
          if (key === "id") return false
          if (key === "picture") return false
          return value !== null && value !== ""
        })
        .map(([key, value]) => {
          const cleanKey = key
            .replace(/_/g, " ")
            .replace(/\b\w/g, c => c.toUpperCase())

          return `${cleanKey} : ${value}`
        })
        .join("\n")

      return `
[${i + 1}]
${details}
`.trim()
    }).join("\n\n")

    await sock.sendMessage(
      chatId,
      { text: result },
      { quoted: msg }
    )

  } catch (err) {
    console.error(err)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat search boss." },
      { quoted: msg }
    )
  }
}

export default Bossdef
