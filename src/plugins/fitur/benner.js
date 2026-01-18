
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import path from "path";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE_URL = "https://id.toram.jp";
    const LIST_URL = `${BASE_URL}/?type_code=all#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return BASE_URL + url;
    };

    const getBannerName = (url) => {
      try {
        const clean = url.split("?")[0]; // buang query
        const file = path.basename(clean); // toram_avatar_xxx.png
        return file.replace(/\.(png|jpg|jpeg|webp)$/i, "");
      } catch {
        return "TORAM AVATAR";
      }
    };

    // ===== FETCH LIST =====
    const res = await fetch(LIST_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      const m = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      return m ? new Date(m[1], m[2] - 1, m[3]) : null;
    };

    const newsList = [];

    $(".common_list li a").each((_, el) => {
      const title = $(el).find(".news_title").text().trim();
      const dateStr = $(el).find(".time time").text().trim();
      const href = $(el).attr("href");

      if (href && title) {
        newsList.push({ title, date: dateStr, href });
      }
    });

    if (newsList.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan berita.\nhttps://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    let selectedNews = null;
    let banners = [];
    let latestDate = null;

    // ===== SCAN DETAIL =====
    for (const news of newsList) {
      const detailUrl = fixUrl(news.href);

      const detailRes = await fetch(detailUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      });

      if (!detailRes.ok) continue;

      const detailHtml = await detailRes.text();
      const $detail = cheerio.load(detailHtml);

      const tempBanners = [];

      $detail("center img").each((_, el) => {
        const src =
          $detail(el).attr("src") ||
          $detail(el).attr("data-src");

        if (!src) return;

        if (/toram_avatar/i.test(src)) {
          const fullUrl = fixUrl(src);
          if (!tempBanners.includes(fullUrl)) {
            tempBanners.push(fullUrl);
          }
        }
      });

      if (tempBanners.length === 0) continue;

      const newsDate = parseDate(news.date);

      if (!selectedNews || (newsDate && (!latestDate || newsDate > latestDate))) {
        selectedNews = news;
        latestDate = newsDate;
        banners = tempBanners;
      }
    }

    if (banners.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan banner avatar terbaru." },
        msg ? { quoted: msg } : {}
      );
    }

    // ===== KIRIM SEMUA BANNER (CAPTION = NAMA FILE) =====
    for (const bannerUrl of banners) {
      const bannerName = getBannerName(bannerUrl);

      await sock.sendMessage(
        String(chatId),
        {
          image: { url: bannerUrl },
          caption: bannerName,
        },
        msg ? { quoted: msg } : {}
      );
    }
  } catch (err) {
    await sock.sendMessage(
      String(chatId),
      {
        text:
          "TORAM BANNER ERROR\n\n" +
          err.message +
          "\n\nCoba lagi nanti.",
      },
      msg ? { quoted: msg } : {}
    );
  }
};

