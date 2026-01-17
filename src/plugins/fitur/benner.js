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

    const res = await fetch(LIST_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const newsList = [];

    // Ambil semua berita (TANPA REGEX)
    $(".common_list li a").each((i, el) => {
      newsList.push({
        title: $(el).find(".news_title").text().trim(),
        date: $(el).find(".news_date").text().trim(),
        href: $(el).attr("href"),
      });
    });

    if (newsList.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ada berita.\n\nhttps://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    // REGEX KHUSUS AVATAR (HANYA DIPAKAI DI DETAIL)
    const AVA_REGEX =
      /avatar|ava\b|avatar\s*chest|peti\s*harta|kostum|gacha/i;

    let selectedNews = null;

    // Loop berita satu per satu
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

      // 🔍 VALIDASI AVA DI DETAIL
      const titleText = $detail(".news_title, h1, h2").first().text();
      const contentText = $detail(".news_content").text();
      const combinedText = `${titleText} ${contentText}`;

      if (!AVA_REGEX.test(combinedText)) {
        continue; // BUKAN AVATAR → SKIP
      }

      const banners = [];

      // Cari banner
      $detail("center img, table img, .news_content img").each((i, el) => {
        const src = $detail(el).attr("src");
        const width = parseInt($detail(el).attr("width") || 0);
        const height = parseInt($detail(el).attr("height") || 0);

        if (!src) return;

        const isBig = width > 300 || height > 300;
        const isBannerName =
          src.toLowerCase().includes("avatar") ||
          src.toLowerCase().includes("banner") ||
          src.toLowerCase().includes("chest");

        if ((isBig || isBannerName) && !/icon|nav_|footer|logo/i.test(src)) {
          const fullUrl = fixUrl(src);
          if (!banners.includes(fullUrl)) {
            banners.push(fullUrl);
          }
        }
      });

      if (banners.length === 0) continue;

      const firstParagraph = $detail(".news_content p")
        .first()
        .text()
        .trim();

      selectedNews = {
        ...news,
        detailUrl,
        preview: firstParagraph
          ? firstParagraph.slice(0, 150) +
          (firstParagraph.length > 150 ? "..." : "")
          : "",
        banners,
      };

      break; // STOP → AVATAR TERBARU DITEMUKAN
    }

    if (!selectedNews) {
      return sock.sendMessage(
        String(chatId),
        {
          text:
            "Tidak ditemukan banner Avatar.\n\nCek manual: https://id.toram.jp",
        },
        msg ? { quoted: msg } : {}
      );
    }

    // CAPTION
    let caption = `TORAM ONLINE - AVATAR UPDATE\n`;
    caption += `${selectedNews.title}\n`;
    caption += `Tanggal: ${selectedNews.date}\n`;

    if (selectedNews.preview) {
      caption += `\nPreview:\n${selectedNews.preview}\n`;
    }

    caption += `\nLink: ${selectedNews.detailUrl}`;

    // KIRIM BANNER
    for (let i = 0; i < selectedNews.banners.length; i++) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: selectedNews.banners[i] },
          caption: i === 0 ? caption : undefined,
        },
        msg ? { quoted: msg } : {}
      );
    }
  } catch (err) {
    await sock.sendMessage(
      String(chatId),
      {
        text:
          "TORAM AVATAR BANNER - ERROR\n" +
          `Pesan: ${err.message}\n\n` +
          "Solusi:\n- Cek koneksi\n- Website maintenance\n- Coba lagi nanti",
      },
      msg ? { quoted: msg } : {}
    );
  }
};
