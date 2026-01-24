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
    let found = false

    // Cari semua div dengan class table-grid item-leveling
    $('.table-grid.item-leveling').each((idx, table) => {
      const heading = $(table).find('h3').text().trim()

      // Hanya ambil yang Boss
      if (heading === 'Boss') {
        result += "BOSS\n\n"

        $(table).find('.level-row').each((i, row) => {
          const level = $(row).find('.level-col-1 b').text().trim()
          const name = $(row).find('.level-col-2 b a').text().trim()
          const location = $(row).find('.level-col-2 p').eq(1).text().trim()
          const expElement = $(row).find('.level-col-3 p b').first()
          const exp = expElement.text().trim()

          if (name && exp) {
            found = true
            result += `${level} - ${name}\n`
            result += `${location}\n`
            result += `${exp}\n\n`
          }
        })
      }
    })

    if (!found) {
      result += "Tidak ada Boss untuk level ini"
    }

    await sock.sendMessage(chatId, { text: result }, { quoted: msg })

  } catch (err) {
    console.error("Error:", err)
    await sock.sendMessage(chatId, {
      text: "Terjadi error saat mengambil data leveling."
    }, { quoted: msg })
  }
}
