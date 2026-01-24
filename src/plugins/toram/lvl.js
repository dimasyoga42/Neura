import fetch from "node-fetch"
import * as cheerio from "cheerio"

export const lvl = async (sock, chatId, msg, text) => {
  try {
    const lv = text.replace("!lv", "").trim();

    if (!lv) {
      return sock.sendMessage(chatId, {
        text: "Masukkan level Anda setelah !lv\nContoh: !lv 299"
      }, { quoted: msg })
    }

    const res = await fetch(`https://coryn.club/leveling.php?lv=${encodeURIComponent(lv)}&gap=7&bonusEXP=0`)

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    let result = `Leveling Info untuk Level ${lv}\n\n`

    // Ambil hanya section Boss
    const bossSection = $('h3:contains("Boss")').parent()

    if (bossSection.length > 0) {
      result += "BOSS\n"

      bossSection.find('.level-row').each((i, element) => {
        const level = $(element).find('.level-col-1 b').text().trim()
        const name = $(element).find('.level-col-2 b a').text().trim()
        const location = $(element).find('.level-col-2 p:nth-child(2)').text().trim()
        const exp = $(element).find('.level-col-3 p:first b').text().trim()

        if (name && exp) {
          result += `${level} - ${name}\n`
          result += `Lokasi: ${location}\n`
          result += `EXP: ${exp}\n\n`
        }
      })
    } else {
      result += "Tidak ada Boss untuk level ini\n"
    }

    await sock.sendMessage(chatId, { text: result }, { quoted: msg })

  } catch (err) {
    console.error("Error:", err)
    await sock.sendMessage(chatId, {
      text: "Terjadi error saat mengambil data leveling. Pastikan level yang Anda masukkan valid."
    }, { quoted: msg })
  }
}
