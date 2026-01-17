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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const filterRegex = /avatar\s*chest|peti\s*harta|chest.*avatar|kostum|gacha/i;

    // Parse tanggal format: YYYY.MM.DD atau DD/MM/YYYY
    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      // Format: YYYY.MM.DD
      let match = dateStr.match(/(\d{4})\.(\d{2})\.(\d{2})/);
      if (match) {
        return new Date(match[1], match[2] - 1, match[3]);
      }

      // Format: DD/MM/YYYY
      match = dateStr.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (match) {
        return new Date(match[3], match[2] - 1, match[1]);
      }

      return null;
    };

    let latestNews = null;
    let latestDate = null;

    // Cari semua berita yang cocok dengan filter dan ambil yang terbaru
    $(".common_list li a").each((i, el) => {
      const title = $(el).find(".news_title").text().trim();
      const dateStr = $(el).find(".news_date").text().trim();
      const href = $(el).attr("href");

      if (filterRegex.test(title)) {
        const parsedDate = parseDate(dateStr);

        // Bandingkan tanggal, ambil yang paling baru
        if (!latestDate || (parsedDate && parsedDate > latestDate)) {
          latestDate = parsedDate;
          latestNews = {
            href: href,
            title: title,
            date: dateStr
          };
        }
      }
    });

    if (!latestNews) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan berita Avatar/Peti Harta terbaru.\n\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    const detailUrl = fixUrl(latestNews.href);
    const detailRes = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailRes.ok) throw new Error(`HTTP Error: ${detailRes.status}`);

    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    const banners = [];

    // Cari gambar di <center>
    $detail("center img").each((i, el) => {
      const src = $detail(el).attr("src");
      if (src && /toram_avatar|avatar.*\d{6}|kotobuki|banner|chest/i.test(src)) {
        if (!/icon|nav_|footer|logo(?!.*avatar)/i.test(src)) {
          const fullUrl = fixUrl(src);
          if (!banners.includes(fullUrl)) {
            banners.push(fullUrl);
          }
        }
      }
    });

    // Fallback: cari di .news_content dengan filter ukuran
    if (banners.length === 0) {
      $detail(".news_content img").each((i, el) => {
        const src = $detail(el).attr("src");
        const width = $detail(el).attr("width");
        const height = $detail(el).attr("height");

        if (src && (
          /toram_avatar|avatar.*\d{6}|banner/i.test(src) ||
          (width && parseInt(width) > 200) ||
          (height && parseInt(height) > 200)
        )) {
          if (!/icon|nav_|footer|logo(?!.*avatar)/i.test(src)) {
            const fullUrl = fixUrl(src);
            if (!banners.includes(fullUrl)) {
              banners.push(fullUrl);
            }
          }
        }
      });
    }

    // Fallback terakhir: semua gambar .png/.jpg
    if (banners.length === 0) {
      $detail(".news_content img").each((i, el) => {
        const src = $detail(el).attr("src");
        if (src && /\.(png|jpg|jpeg)$/i.test(src) && !/icon|nav_|footer/i.test(src)) {
          const fullUrl = fixUrl(src);
          if (!banners.includes(fullUrl)) {
            banners.push(fullUrl);
          }
        }
      });
    }

    // Logo default jika tidak ada gambar
    if (banners.length === 0) {
      banners.push("https://toram-jp.akamaized.net/id/img/common/logo.png");
    }

    // Ambil preview text
    let preview = "";
    const firstParagraph = $detail(".news_content p").first().text().trim();
    if (firstParagraph && firstParagraph.length > 0) {
      preview = firstParagraph.substring(0, 150) + (firstParagraph.length > 150 ? "..." : "");
    }

    // Kirim caption dengan info berita terbaru
    let caption = `TORAM ONLINE - UPDATE\n`;
    caption += `${latestNews.title}\n`;
    caption += `Tanggal: ${latestNews.date}\n`;

    if (preview) {
      caption += `\nPreview:\n${preview}\n`;
    }

    caption += `\nLink: ${detailUrl}`;

    // Kirim gambar dengan caption di gambar pertama
    for (let i = 0; i < banners.length; i++) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: banners[i] },
          caption: i === 0 ? caption : undefined // Caption hanya di gambar pertama
        },
        msg ? { quoted: msg } : {}
      );
    }

  } catch (err) {
    let errorMsg = "TORAM BANNER - ERROR\n";
    errorMsg += `Terjadi kesalahan: ${err.message}\n`;
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
