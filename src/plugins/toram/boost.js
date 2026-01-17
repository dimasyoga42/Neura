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

    // 2. Cari berita "Boost Akhir Pekan" terbaru
    let boostLink = null;

    $(".common_list li a").each((i, el) => {
      const title = $(el).find(".news_title").text().trim().toLowerCase();
      const href = $(el).attr("href");

      if (title.includes("boost") && title.includes("akhir pekan")) {
        boostLink = href.startsWith("http") ? href : BASE_URL + href;
        return false; // break loop - ambil yang paling atas
      }
    });

    if (!boostLink) {
      return { active: false, bosses: [] };
    }

    // 3. Ambil detail berita boost
    const detailRes = await fetch(boostLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailRes.ok) throw new Error(`HTTP Error: ${detailRes.status}`);

    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    // 4. Validasi tanggal - Cek apakah event masih berlangsung
    let eventEndDate = null;

    $detail(".pTxt, p").each((i, el) => {
      const text = $detail(el).text();

      // Parse tanggal selesai event
      // Format: "Selesai : Minggu, 18 Januari 2026 pukul 21:59 WIB"
      const endDateMatch = text.match(/Selesai[\s:]*[^,]+,\s*(\d+)\s+(\w+)\s+(\d{4})\s+pukul\s+(\d{2}):(\d{2})/i);
      if (endDateMatch) {
        const day = parseInt(endDateMatch[1]);
        const monthName = endDateMatch[2];
        const year = parseInt(endDateMatch[3]);
        const hour = parseInt(endDateMatch[4]);
        const minute = parseInt(endDateMatch[5]);

        // Map nama bulan Indonesia ke angka
        const monthMap = {
          'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
          'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
          'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
        };

        const month = monthMap[monthName.toLowerCase()];
        if (month !== undefined) {
          // WIB = UTC+7, jadi kurangi 7 jam untuk get UTC time
          eventEndDate = new Date(year, month, day, hour - 7, minute);
        }
        return false;
      }
    });

    // Validasi: Cek apakah event masih berlangsung
    if (eventEndDate) {
      const now = new Date();
      if (now > eventEndDate) {
        // Event sudah berakhir
        return { active: false, bosses: [], expired: true };
      }
    }

    // 5. Scrape daftar boss
    const bosses = [];

    $detail(".subtitle").each((i, el) => {
      const rawText = $detail(el).text().trim();

      // Cek apakah ini subtitle boss (dimulai dengan Lv)
      if (!rawText.match(/^Lv\d+/)) return;

      // Parse level, nama boss, dan lokasi
      // Format: "Lv112 Ifrid(Graben Membara)"
      const match = rawText.match(/^(Lv\d+)\s+([^(]+)(?:\(([^)]+)\))?/);
      if (!match) return;

      const level = match[1];
      const bossName = match[2].trim();
      const location = match[3] || "";

      // Cari gambar di elemen berikutnya
      // Struktur: <div class="subtitle">...</div> <br> <div align="center"><img></div>
      let img = null;
      let currentEl = $detail(el);

      // Cek 5 elemen selanjutnya
      for (let j = 0; j < 5; j++) {
        currentEl = currentEl.next();
        if (currentEl.length === 0) break;

        // Cari img di dalam element atau di element itu sendiri
        const foundImg = currentEl.find("img").first();
        if (foundImg.length > 0) {
          img = foundImg.attr("src");
          break;
        }

        // Cek jika element sendiri adalah img
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
      bosses
    };

  } catch (error) {
    console.error("Error scraping boost boss:", error.message);
    throw error;
  }
}

export const bosboost = async (sock, chatId, msg) => {
  try {
    const result = await scrapeBoostBoss();

    if (!result.active) {
      let message = "Tidak ada event Boost Akhir Pekan yang aktif saat ini.";
      if (result.expired) {
        message = "Event Boost Akhir Pekan sudah berakhir.";
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
        { text: "Event ditemukan tapi tidak ada daftar boss.\n\nBy Neura Sama" },
        msg ? { quoted: msg } : {}
      );
    }

    // Kirim gambar setiap boss
    for (const boss of result.bosses) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: boss.image },
          caption: `${boss.fullName}\n\nBy Neura Sama`
        },
        msg ? { quoted: msg } : {}
      );
    }

  } catch (err) {
    console.error("Error in bosboost:", err);

    await sock.sendMessage(
      String(chatId),
      { text: `Gagal mengambil data boost boss.\nError: ${err.message}\n\nBy Neura Sama` },
      msg ? { quoted: msg } : {}
    );
  }
};
