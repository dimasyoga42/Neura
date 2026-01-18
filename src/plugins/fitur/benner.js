

import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE_URL = "https://id.toram.jp";
    const LIST_URL = `${BASE_URL}/?type_code=all#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return BASE_URL + url;
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
      const m = dateStr?.match(/(\d{4})-(\d{2})-(\d{2})/);
      return m ? new Date(m[1], m[2] - 1, m[3]) : null;
    };

    // ===== AMBIL SEMUA BERITA =====
    const newsList = [];
    $(".common_list li a").each((_, el) => {
      const title = $(el).find(".news_title").text().trim();
      const dateStr = $(el).find(".time time").text().trim();
      const href = $(el).attr("href");
      if (href) newsList.push({ title, date: dateStr, href });
    });

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

      const temp = [];

      $detail("center").each((_, center) => {
        const $center = $detail(center);

        $center.find("img").each((_, img) => {
          const src =
            $detail(img).attr("src") ||
            $detail(img).attr("data-src");

          if (!src || !/toram_avatar/i.test(src)) return;

          // ===== AMBIL TEKS DI ATAS GAMBAR =====
          let titleText = "";

          // ambil text node / tag sebelum img
          const prevNodes = $detail(img).prevAll();

          for (let i = 0; i < prevNodes.length; i++) {
            const text = $detail(prevNodes[i]).text().trim();
            if (text) {
              titleText = text;
              break;
            }
          }

          // fallback jika tidak ketemu
          if (!titleText) {
            titleText = "TORAM AVATAR";
          }

          temp.push({
            url: fixUrl(src),
            title: titleText,
          });
        });
      });

      if (temp.length === 0) continue;

      const newsDate = parseDate(news.date);
      if (!selectedNews || (newsDate && newsDate > latestDate)) {
        latestDate = newsDate;
        selectedNews = news;
        banners = temp;
      }
    }

    if (banners.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan banner avatar terbaru." },
        msg ? { quoted: msg } : {}
      );
    }

    // ===== KIRIM SEMUA BANNER =====
    for (const banner of banners) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: banner.url },
          caption: banner.title,
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

