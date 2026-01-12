import path from "path"
import fs from "fs"
const db = path.resolve("database", "wc.json")
export const setWellcome = async (sock, chatId, msg, text) => {
  try {
    const msgRes = text.replace(/^!setwc/i, "").trim()

    if (!msgRes) {
      return sock.sendMessage(
        chatId,
        {
          text:
            `Format salah!

Cara penggunaan:
!setwc teks welcome

Tag yang tersedia:
@user = mention user yang masuk
@decs = deskripsi grup`
        },
        { quoted: msg }
      )
    }

    // Pastikan file ada
    if (!fs.existsSync(db)) {
      fs.writeFileSync(db, JSON.stringify({}, null, 2))
    }

    // Baca database
    const data = JSON.parse(fs.readFileSync(db))

    // Simpan welcome per grup
    data[chatId] = msgRes

    fs.writeFileSync(db, JSON.stringify(data, null, 2))

    await sock.sendMessage(
      chatId,
      { text: "Welcome message berhasil disimpan!" },
      { quoted: msg }
    )

  } catch (err) {
    console.error("[SET WC ERROR]", err)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat menyimpan welcome" },
      { quoted: msg }
    )
  }
}


export const handleWelcome = async (sock, update) => {
  try {
    const { id, participants, action } = update

    // Hanya untuk member masuk
    if (action !== "add") return

    if (!fs.existsSync(db)) return
    const data = JSON.parse(fs.readFileSync(db))

    const wcText = data[id]
    if (!wcText) return // jika grup belum set welcome

    for (const user of participants) {
      let text = wcText

      // Replace tag
      text = text.replace(/@user/gi, `@${user.split("@")[0]}`)
      text = text.replace(/@decs/gi, update?.desc || "Tidak ada deskripsi grup")

      await sock.sendMessage(
        id,
        {
          text,
          mentions: [user]
        }
      )
    }

  } catch (err) {
    console.error("[WELCOME ERROR]", err)
  }
}
