import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_URL = "https://id.toram.jp";

async function scrapeBoostBoss() {
  try {
    // 1. Ambil halaman utama berita
    const listRes = await fetch(`${BASE_URL}/?type_code=all`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!listRes.ok) throw new Error(`HTTP Error: ${listRes.status}`);

    const listHtml = await listRes.text();
    const $ = cheerio.load(listHtml);

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      let match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(match[1], match[2] - 1, match[3]);
      }
      return null;
    };

    // 2. Cari semua berita "Boost" & "Akhir Pekan"
    const boostNews = [];

    $(".common_list li a").each((i, el) => {
      const title = $(el).find(".news_title").text().trim();
      const titleLower = title.toLowerCase();
      const href = $(el).attr("href");
      const dateStr = $(el).find(".time time").text().trim();

      // Filter judul harus mengandung "boost" DAN "akhir pekan"
      if (titleLower.includes("boost") && titleLower.includes("akhir pekan")) {
        boostNews.push({
          title: title,
          href: href.startsWith("http") ? href : BASE_URL + href,
          date: dateStr,
          parsedDate: parseDate(dateStr)
        });
      }
    });

    if (boostNews.length === 0) {
      return { active: false, bosses: [], message: "Tidak ditemukan berita Boost." };
    }

    // 3. Ambil berita paling baru berdasarkan tanggal
    let latestBoost = boostNews[0];
    for (const news of boostNews) {
      if (news.parsedDate && latestBoost.parsedDate &&
        news.parsedDate > latestBoost.parsedDate) {
        latestBoost = news;
      }
    }

    const boostLink = latestBoost.href;

    // 4. Scrape detail berita
    const detailRes = await fetch(boostLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailRes.ok) throw new Error(`HTTP Error: ${detailRes.status}`);

    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    // 5. Validasi Tanggal Selesai (WIB)
    let eventEndDate = null;
    let readableEndString = "";

    // Loop semua paragraf untuk mencari teks "Selesai :"
    $detail(".pTxt, p").each((i, el) => {
      const text = $detail(el).text().replace(/\s+/g, ' ').trim(); // Normalisasi spasi

      // Regex mencari pola: Selesai : [Hari], [Tgl] [Bulan] [Tahun] pukul [Jam]:[Menit]
      // Contoh: "Selesai : Minggu, 18 Januari 2026 pukul 21:59 WIB"
      const endDateMatch = text.match(/(?:Selesai|Berakhir)\s*[:]\s*.*?,?\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})\s+(?:pukul|jam)?\s*(\d{1,2})[:.](\d{1,2})/i);

      if (endDateMatch) {
        const day = parseInt(endDateMatch[1]);
        const monthName = endDateMatch[2];
        const year = parseInt(endDateMatch[3]);
        const hour = parseInt(endDateMatch[4]);
        const minute = parseInt(endDateMatch[5]);

        const monthMap = {
          'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
          'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
          'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };

        const month = monthMap[monthName.toLowerCase()];

        if (month !== undefined) {
          // KONVERSI KE TIMESTAMP ABSOLUTE (WIB adalah UTC+7)
          // Kita buat tanggal seolah-olah UTC, lalu kurangi 7 jam (dalam ms)
          const utcTime = Date.UTC(year, month, day, hour, minute, 0);
          const wibOffset = 7 * 60 * 60 * 1000; // 7 jam dalam milidetik

          eventEndDate = new Date(utcTime - wibOffset);
          readableEndString = `${day} ${monthName} ${year} ${hour}:${minute < 10 ? '0' + minute : minute} WIB`;
        }
        return false; // Break loop
      }
    });

    // Cek apakah sudah Expired
    const now = new Date();
    let isExpired = false;

    if (eventEndDate) {
      if (now > eventEndDate) {
        isExpired = true;
      }
    } else {
      // Jika tanggal tidak ditemukan di teks berita, kita asumsikan berdasarkan tanggal posting + 3 hari (fallback logic)
      // Tapi lebih aman return warning saja
      console.log("Warning: Tanggal selesai tidak dapat diparsing dari berita.");
    }

    if (isExpired) {
      return {
        active: false,
        bosses: [],
        expired: true,
        lastDate: readableEndString
      };
    }

    // 6. Scrape Boss
    const bosses = [];

    $detail(".subtitle").each((i, el) => {
      const rawText = $detail(el).text().trim();

      // Cek format subtitle Lv...
      if (!rawText.match(/^Lv\d+/)) return;

      const match = rawText.match(/^(Lv\d+)\s+([^(]+)(?:\(([^)]+)\))?/);
      if (!match) return;

      const level = match[1];
      const bossName = match[2].trim();
      const location = match[3] || "";

      // Logika pencarian gambar
      let img = null;
      let currentEl = $detail(el);

      // Cek elemen saudara selanjutnya sampai ketemu gambar
      for (let j = 0; j < 6; j++) {
        currentEl = currentEl.next();
        if (currentEl.length === 0) break;

        // Cek img di dalam div/p
        const foundImg = currentEl.find("img");
        if (foundImg.length > 0) {
          img = foundImg.attr("src");
          break;
        }
        // Cek jika elemen itu sendiri img
        if (currentEl.is("img")) {
          img = currentEl.attr("src");
          break;
        }
      }

      if (img) {
        const imageUrl = img.startsWith("http")
          ? img
          : img.startsWith("/")
            ? BASE_URL + img
            : BASE_URL + "/" + img;

        bosses.push({
          level,
          name: bossName,
          location,
          fullName: `${level} ${bossName}${location ? ` (${location})` : ""}`,
          image: imageUrl
        });
      }
    });

    return {
      active: true,
      bosses,
      endDateStr: readableEndString
    };

  } catch (error) {
    console.error("Error scraping boost boss:", error);
    throw error;
  }
}

// HANDLER
export const bosboost = async (sock, chatId, msg) => {
  try {
    const result = await scrapeBoostBoss();

    // Validasi Aktif/Expired
    if (!result.active) {
      let message = "Tidak ada event Boost Akhir Pekan yang sedang aktif.";

      if (result.expired) {
        message = `⚠️ **Event Sudah Berakhir**\n\nEvent Boost terakhir ditemukan selesai pada:\n📅 ${result.lastDate}`;
      } else if (result.message) {
        message = result.message;
      }

      return sock.sendMessage(
        String(chatId),
        { text: `${message}\n\nBy Neura Sama` },
        msg ? { quoted: msg } : {}
      );
    }

    if (result.bosses.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Event Boost Aktif, namun daftar boss tidak ditemukan di dalam berita.\n\nBy Neura Sama" },
        msg ? { quoted: msg } : {}
      );
    }

    // Info Header
    await sock.sendMessage(
      String(chatId),
      { text: `🔥 **BOOST BOSS EVENT** 🔥\n\nBerakhir pada:\n📅 ${result.endDateStr}\n\nBerikut daftar bossnya:` },
      msg ? { quoted: msg } : {}
    );

    // Kirim Gambar Boss
    for (const boss of result.bosses) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: boss.image },
          caption: `⚔️ **${boss.fullName}**`
        },
        msg ? { quoted: msg } : {}
      );
    }

    // Watermark akhir
    await sock.sendMessage(
      String(chatId),
      { text: `Happy Farming!\nBy Neura Sama` },
      msg ? { quoted: msg } : {}
    );

  } catch (err) {
    console.error("Error in bosboost:", err);
    await sock.sendMessage(
      String(chatId),
      { text: `Gagal mengambil data boost boss.\nError: ${err.message}\n\nBy Neura Sama` },
      msg ? { quoted: msg } : {}
    );
  }
};
