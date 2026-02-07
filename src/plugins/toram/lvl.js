import fetch from "node-fetch"
import * as cheerio from "cheerio"

export const lvl = async (sock, chatId, msg, text) => {
  try {
    const lv = text.replace("!lv", "").trim()
    if (!lv) {
      return sock.sendMessage(chatId, { text: "Masukkan level setelah !lv\nContoh: !lv 299" }, { quoted: msg })
    }

    const res = await fetch(`https://coryn.club/leveling.php?lv=${encodeURIComponent(lv)}&gap=7&bonusEXP=0`)
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)

    const html = await res.text()
    const $ = cheerio.load(html)

    let result = `Leveling Info Lv ${lv}\n\n`
    let found = false

    $(".table-grid.item-leveling").each((_, table) => {
      const title = $(table).find("h3").text().trim()

      if (title === "Boss" || title === "Mini Boss") {
        result += `${title.toUpperCase()}\n`
        $(table).find(".level-row").each((__, row) => {
          const level = $(row).find(".level-col-1 b").text().trim()
          const name = $(row).find(".level-col-2 b a").text().trim()
          const loc = $(row).find(".level-col-2 p").eq(1).text().trim()
          const exp = $(row).find(".level-col-3 p b").first().text().trim()
          if (name && exp) {
            found = true
            result += `- ${level} - ${name} ${loc} ${exp}\n`
          }
        })
        result += "\n"
      }
    })

    if (!found) result += "Tidak ada Boss / Mini Boss untuk level ini"
    await sock.sendMessage(chatId, { text: result.trim() }, { quoted: msg })
  } catch (e) {
    console.error(e)
    await sock.sendMessage(chatId, { text: "Gagal ambil data leveling" }, { quoted: msg })
  }
}
