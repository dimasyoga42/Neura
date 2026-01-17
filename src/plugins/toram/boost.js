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

    // 2. Parse tanggal format: [YYYY-MM-DD]
    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      // Format: [2026-01-17] atau 2026-01-17
      let match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(match[1], match[2] - 1, match[3]);
      }

      return null;
    };

    // 3. Cari semua berita "Boost Akhir Pekan" dan ambil yang terbaru
    const boostNews = [];

    $(".common_list li a").each((i, el) => {
      const title = $(el).find(".news_title").text().trim();
      const titleLower = title.toLowerCase();
      const href = $(el).attr("href");
      const dateStr = $(el).find(".time time").text().trim();

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
      return { active: false, bosses: [] };
    }

    // 4. Pilih berita boost dengan tanggal terbaru
    let latestBoost = boostNews[0];
    for (const news of boostNews) {
      if (news.parsedDate && latestBoost.parsedDate &&
        news.parsedDate > latestBoost.parsedDate) {
        latestBoost = news;
      }
    }

    const boostLink = latestBoost.href;
    const boostTitle = latestBoost.title;
    const boostDate = latestBoost.date;

    // 3. Ambil detail berita boost
    const detailRes = await fetch(boostLink, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailRes.ok) throw new Error(`HTTP Error: ${detailRes.status}`);

    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    // 4. Ambil periode event
    let eventPeriod = "";
    $detail(".pTxt, p").each((i, el) => {
      const text = $detail(el).text();
      if (text.includes("Periode Event") || text.includes("Mulai") || text.includes("Selesai")) {
        const periodMatch = text.match(/(Mulai[\s\S]*?Selesai[\s\S]*?\d{2}:\d{2}\s+WIB)/);
        if (periodMatch) {
          eventPeriod = periodMatch[1].trim();
          return false;
        }
      }
    });

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

      // Cari gambar boss (biasanya di <div align="center"> setelah subtitle)
      let img = null;
      let nextEl = $detail(el).parent().next();

      // Cek beberapa element selanjutnya
      for (let j = 0; j < 5; j++) {
        if (nextEl.length === 0) break;

        // Cari di <div align="center"> atau langsung <img>
        const foundImg = nextEl.find("img").first();
        if (foundImg.length > 0) {
          img = foundImg.attr("src");
          break;
        }

        nextEl = nextEl.next();
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
      title: boostTitle,
      date: boostDate,
      period: eventPeriod,
      link: boostLink,
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

    if (!result.active || result.bosses.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ada event Boost Akhir Pekan yang aktif saat ini.\n\nBy Neura Sama" },
        msg ? { quoted: msg } : {}
      );
    }

    // Kirim info event
    let infoMsg = `BOOST AKHIR PEKAN\n\n`;
    infoMsg += `${result.title}\n`;
    infoMsg += `Tanggal: ${result.date}\n\n`;

    if (result.period) {
      infoMsg += `${result.period}\n\n`;
    }

    infoMsg += `Daftar Boss (${result.bosses.length}):\n`;
    result.bosses.forEach((boss, idx) => {
      infoMsg += `${idx + 1}. ${boss.fullName}\n`;
    });

    infoMsg += `\nLink: ${result.link}`;
    infoMsg += `\n\nBy Neura Sama`;

    await sock.sendMessage(
      String(chatId),
      { text: infoMsg },
      msg ? { quoted: msg } : {}
    );

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

    let errorMsg = "BOOST BOSS - ERROR\n";
    errorMsg += `Terjadi kesalahan: ${err.message}\n\n`;
    errorMsg += `Solusi:\n`;
    errorMsg += `- Cek koneksi internet\n`;
    errorMsg += `- Website mungkin maintenance\n`;
    errorMsg += `- Coba lagi nanti`;

    await sock.sendMessage(
      String(chatId),
      { text: errorMsg },
      msg ? { quoted: msg } : {}
    );
  }
};
