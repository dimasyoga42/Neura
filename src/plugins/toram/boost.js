import fetch from "node-fetch";
import * as cheerio from "cheerio";

// Gunakan versi Indonesia
const BASE_URL = "https://id.toram.jp";

async function scrapeBoostBoss() {
  try {
    // 1. Ambil halaman utama berita event
    const listRes = await fetch(`${BASE_URL}/top/?type_code=event`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!listRes.ok) throw new Error(`HTTP Error: ${listRes.status}`);

    const listHtml = await listRes.text();
    const $ = cheerio.load(listHtml);

    // 2. Cari semua berita boost
    const boostNews = [];

    $("ul li a[href*='information_id']").each((i, el) => {
      const fullText = $(el).text().trim();
      const titleLower = fullText.toLowerCase();
      const href = $(el).attr("href");

      // Extract tanggal dari format ［2026-01-19］
      const dateMatch = fullText.match(/［(\d{4}-\d{2}-\d{2})］/);
      const dateStr = dateMatch ? dateMatch[1] : "";

      // Filter: harus mengandung "boost"
      if (titleLower.includes("boost")) {
        const title = fullText.replace(/［\d{4}-\d{2}-\d{2}］/, '').trim();
        const dateParts = dateStr.split('-');

        boostNews.push({
          title: title,
          href: href.startsWith("http") ? href : BASE_URL + href,
          date: dateStr,
          parsedDate: dateStr ? new Date(dateParts[0], dateParts[1] - 1, dateParts[2]) : null
        });
      }
    });

    if (boostNews.length === 0) {
      return { active: false, bosses: [], message: "Tidak ditemukan berita Boost." };
    }

    // 3. Ambil berita paling baru
    let latestBoost = boostNews[0];
    for (const news of boostNews) {
      if (news.parsedDate && latestBoost.parsedDate && news.parsedDate > latestBoost.parsedDate) {
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

    // 5. Parse Event Period
    let eventEndDate = null;
    let readableEndString = "";

    const bodyText = $detail("body").text();

    // Format Indonesia: "Selesai : Minggu, 19 Januari 2026 pukul 23:59 WIB"
    let untilMatch = bodyText.match(/(?:Selesai|Berakhir)\s*[:]\s*[^,]*,?\s*(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})\s+(?:pukul|jam)\s*(\d{1,2})[:\.](\d{2})\s*WIB/i);

    if (untilMatch) {
      const day = parseInt(untilMatch[1]);
      const monthName = untilMatch[2];
      const year = parseInt(untilMatch[3]);
      const hour = parseInt(untilMatch[4]);
      const minute = parseInt(untilMatch[5]);

      const monthMap = {
        'januari': 0, 'februari': 1, 'maret': 2, 'april': 3,
        'mei': 4, 'juni': 5, 'juli': 6, 'agustus': 7,
        'september': 8, 'oktober': 9, 'november': 10, 'desember': 11
      };

      const month = monthMap[monthName.toLowerCase()];

      if (month !== undefined) {
        // WIB = UTC+7
        const utcTime = Date.UTC(year, month, day, hour, minute, 0);
        const wibOffset = 7 * 60 * 60 * 1000;
        eventEndDate = new Date(utcTime - wibOffset);
        readableEndString = `${day} ${monthName} ${year} ${hour}:${minute.toString().padStart(2, '0')} WIB`;
      }
    } else {
      // Format English: "Until:January 20th at 11:59 PM (JST/GMT+9)"
      untilMatch = bodyText.match(/Until:\s*([A-Za-z]+)\s+(\d+)[a-z]{2}\s+at\s+(\d{1,2}):(\d{2})\s+(AM|PM)\s+\(JST/i);

      if (untilMatch) {
        const monthName = untilMatch[1];
        const day = parseInt(untilMatch[2]);
        let hour = parseInt(untilMatch[3]);
        const minute = parseInt(untilMatch[4]);
        const ampm = untilMatch[5];

        if (ampm === "PM" && hour !== 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;

        const monthMap = {
          'january': 0, 'february': 1, 'march': 2, 'april': 3,
          'may': 4, 'june': 5, 'july': 6, 'august': 7,
          'september': 8, 'october': 9, 'november': 10, 'december': 11
        };

        const month = monthMap[monthName.toLowerCase()];
        const currentYear = new Date().getFullYear();

        if (month !== undefined) {
          // JST = UTC+9, konversi ke WIB (UTC+7)
          const utcTime = Date.UTC(currentYear, month, day, hour, minute, 0);
          const jstOffset = 9 * 60 * 60 * 1000;
          const jstDate = new Date(utcTime - jstOffset);

          // Konversi JST ke WIB (JST - 2 jam = WIB)
          const wibDate = new Date(jstDate.getTime() - 2 * 60 * 60 * 1000);
          eventEndDate = wibDate;

          readableEndString = `${wibDate.getDate()} ${Object.keys(monthMap)[month]} ${currentYear} ${wibDate.getHours()}:${wibDate.getMinutes().toString().padStart(2, '0')} WIB`;
        }
      }
    }

    // Cek apakah sudah expired
    const now = new Date();
    let isExpired = false;

    if (eventEndDate) {
      isExpired = now > eventEndDate;
    }

    if (isExpired) {
      return {
        active: false,
        bosses: [],
        expired: true,
        lastDate: readableEndString
      };
    }

    // 6. Scrape Boss dengan gambar yang benar
    const bosses = [];

    // Cari elemen dengan class "subtitle" yang berisi info boss
    $detail(".subtitle").each((i, el) => {
      const text = $detail(el).text().trim();

      // Skip jika bukan boss (harus dimulai dengan Lv)
      if (!text.match(/^Lv\d+\s+/)) return;

      // Parse: Lv67 Masked Warrior(Land Under Cultivation)
      const match = text.match(/^(Lv\d+)\s+([^(]+)(?:\(([^)]+)\))?/);
      if (!match) return;

      const level = match[1];
      const bossName = match[2].trim();
      const location = match[3] || "";

      // Cari gambar di elemen sibling berikutnya
      let img = null;
      let nextEl = $detail(el).next();

      // Loop maksimal 3 elemen berikutnya untuk cari gambar
      for (let j = 0; j < 3; j++) {
        if (nextEl.length === 0) break;

        const foundImg = nextEl.find("img");
        if (foundImg.length > 0) {
          img = foundImg.first().attr("src");
          break;
        }

        nextEl = nextEl.next();
      }

      if (img) {
        // Format URL gambar
        let imageUrl;
        if (img.startsWith("http")) {
          imageUrl = img;
        } else if (img.includes("toram-jp.akamaized.net")) {
          imageUrl = img.startsWith("//") ? "https:" + img : "https://" + img.replace(/^\/+/, '');
        } else if (img.startsWith("/")) {
          imageUrl = "https://toram-jp.akamaized.net" + img;
        } else {
          // Hapus ./ jika ada
          imageUrl = "https://toram-jp.akamaized.net/img/announcement/bossevent/" + img.replace(/^\.\/.*\//, '');
        }

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
      endDateStr: readableEndString,
      eventTitle: latestBoost.title
    };

  } catch (error) {
    console.error("Error scraping boost boss:", error);
    throw error;
  }
}

// HANDLER
export const bosboost = async (sock, chatId, msg) => {
  try {
    const data = await scrapeBoostBoss();

    // 1. Handle Event Sudah Berakhir / Tidak Aktif
    if (!data.active) {
      let textMsg = "Tidak ada event Boost Boss yang sedang aktif saat ini.";

      if (data.expired) {
        textMsg = `Event Boost Boss sudah selesai pada:\n${data.lastDate}`;
      }

      return sock.sendMessage(chatId, { text: textMsg }, { quoted: msg });
    }

    // 2. Handle Event Aktif tapi Parse Gagal
    if (!data.bosses || data.bosses.length === 0) {
      return sock.sendMessage(chatId, {
        text: `Event aktif: ${data.eventTitle}\n\nTapi gagal mengambil daftar boss.\nCek: ${BASE_URL}`
      }, { quoted: msg });
    }

    // 3. Tampilkan Boss (Looping Gambar)
    for (const boss of data.bosses) {
      try {
        if (boss.image) {
          await sock.sendMessage(chatId, {
            image: { url: boss.image },
            caption: boss.fullName
          });
        } else {
          await sock.sendMessage(chatId, { text: boss.fullName });
        }

        // Delay untuk menghindari spam
        await new Promise(resolve => setTimeout(resolve, 700));
      } catch (imgError) {
        console.error(`Error mengirim gambar ${boss.name}:`, imgError);
        await sock.sendMessage(chatId, { text: boss.fullName });
      }
    }

  } catch (err) {
    console.error("Error di handler bosboost:", err);
    sock.sendMessage(chatId, {
      text: `Terjadi kesalahan: ${err.message}`
    }, { quoted: msg });
  }
};
