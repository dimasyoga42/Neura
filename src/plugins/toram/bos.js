import axios from "axios"

const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bos", "").trim()
    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Masukkan nama boss setelah !bos" },
        { quoted: msg }
      )
    }

    const res = await axios.get(
      `https://monster-toram.vercel.app/api/monsters/search/${encodeURIComponent(name)}`
    )

    const { count, data } = res.data

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: `Boss "${name}" tidak ditemukan.` },
        { quoted: msg }
      )
    }

    const blacklistKey = ["id"]

    const result = data.map((boss, i) => {
      const details = Object.entries(boss)
        .filter(([key, value]) => {
          if (blacklistKey.includes(key)) return false
          if (key.startsWith("unnamed")) return false
          return value !== null && value !== ""
        })
        .map(([key, value]) => {
          const cleanKey = key.replace(/_/g, " ").toUpperCase()
          const cleanValue =
            typeof value === "string"
              ? value.replace(/\n/g, " ")
              : value
          return `${cleanKey} : ${cleanValue}`
        })
        .join("\n")

      return `
[${i + 1}]
${details}
`.trim()
    }).join("\n\n")

    const message = `
Hasil pencarian: ${name}
Ditemukan: ${count} boss

${result}
`.trim()

    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    )

  } catch (err) {
    console.error(err)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat mengambil data boss." },
      { quoted: msg }
    )
  }
}

export default Bossdef

