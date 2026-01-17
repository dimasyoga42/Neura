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

    const newsList = [];

    // Kumpulkan semua berita yang cocok filter
    $(".common_list li a").each((i, el) => {
      const title = $(el).find(".news_title").text().trim();
      const dateStr = $(el).find(".news_date").text().trim();
      const href = $(el).attr("href");

      if (filterRegex.test(title)) {
        newsList.push({
          href: href,
          title: title,
          date: dateStr
        });
      }
    });

    if (newsList.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan berita Avatar/Peti Harta.\n\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    let selectedNews = null;
    let banners = [];

    // Cek satu per satu dari daftar paling atas
    for (let i = 0; i < newsList.length; i++) {
      const news = newsList[i];
      const detailUrl = fixUrl(news.href);

      // Buka halaman detail
      const detailRes = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!detailRes.ok) continue; // Skip jika error

      const detailHtml = await detailRes.text();
      const $detail = cheerio.load(detailHtml);

      // Validasi: cari banner avatar
      const tempBanners = [];

      // Cari di <center> atau <table>
      $detail("center img, table img").each((i, el) => {
        const src = $detail(el).attr("src");
        if (src && /toram_avatar|avatar.*\d{6}|kotobuki|banner.*avatar|chest/i.test(src)) {
          if (!/icon|nav_|footer|logo(?!.*avatar)/i.test(src)) {
            const fullUrl = fixUrl(src);
            if (!tempBanners.includes(fullUrl)) {
              tempBanners.push(fullUrl);
            }
          }
        }
      });

      // Fallback: cari di .news_content
      if (tempBanners.length === 0) {
        $detail(".news_content img").each((i, el) => {
          const src = $detail(el).attr("src");
          const width = $detail(el).attr("width");
          const height = $detail(el).attr("height");

          if (src && (
            /toram_avatar|avatar.*\d{6}|banner/i.test(src) ||
            (width && parseInt(width) > 300) ||
            (height && parseInt(height) > 300)
          )) {
            if (!/icon|nav_|footer/i.test(src)) {
              const fullUrl = fixUrl(src);
              if (!tempBanners.includes(fullUrl)) {
                tempBanners.push(fullUrl);
              }
            }
          }
        });
      }

      // Jika ada banner, pakai berita ini
      if (tempBanners.length > 0) {
        selectedNews = news;
        banners = tempBanners;

        // Ambil preview text
        let preview = "";
        const firstParagraph = $detail(".news_content p").first().text().trim();
        if (firstParagraph && firstParagraph.length > 0) {
          preview = firstParagraph.substring(0, 150) + (firstParagraph.length > 150 ? "..." : "");
        }

        selectedNews.preview = preview;
        selectedNews.detailUrl = detailUrl;
        break; // Sudah ketemu, stop
      }

      // Jika tidak ada banner, lanjut ke berita berikutnya
    }

    if (!selectedNews || banners.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Ditemukan berita Avatar/Peti Harta, tapi tidak ada banner yang bisa ditampilkan.\n\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    // Kirim caption
    let caption = `TORAM ONLINE - UPDATE\n`;
    caption += `${selectedNews.title}\n`;
    caption += `Tanggal: ${selectedNews.date}\n`;

    if (selectedNews.preview) {
      caption += `\nPreview:\n${selectedNews.preview}\n`;
    }

    caption += `\nLink: ${selectedNews.detailUrl}`;

    // Kirim gambar banner
    for (let i = 0; i < banners.length; i++) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: banners[i] },
          caption: i === 0 ? caption : undefined
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
