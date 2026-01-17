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

    // Parse tanggal format: [YYYY-MM-DD]
    const parseDate = (dateStr) => {
      if (!dateStr) return null;

      // Format: [2026-01-17] atau 2026-01-17
      let match = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return new Date(match[1], match[2] - 1, match[3]);
      }

      return null;
    };

    const newsList = [];

    // Kumpulkan semua berita
    $(".common_list li a").each((i, el) => {
      const title = $(el).find(".news_title").text().trim();
      const dateStr = $(el).find(".time time").text().trim();
      const href = $(el).attr("href");

      newsList.push({
        href: href,
        title: title,
        date: dateStr
      });
    });

    if (newsList.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan berita apapun.\n\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    let selectedNews = null;
    let banners = [];
    let latestDate = null;

    // Cek semua berita, cari yang punya banner avatar dengan tanggal terbaru
    for (let i = 0; i < newsList.length; i++) {
      const news = newsList[i];
      const detailUrl = fixUrl(news.href);

      // Buka halaman detail
      const detailRes = await fetch(detailUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!detailRes.ok) continue;

      const detailHtml = await detailRes.text();
      const $detail = cheerio.load(detailHtml);

      // Cari banner avatar di <center>
      const tempBanners = [];

      $detail("center img").each((i, el) => {
        const src = $detail(el).attr("src");
        // Cek pola banner avatar: toram_avatar_*
        if (src && /toram_avatar_[a-z]+\d{6,8}/i.test(src)) {
          const fullUrl = fixUrl(src);
          if (!tempBanners.includes(fullUrl)) {
            tempBanners.push(fullUrl);
          }
        }
      });

      // Jika ada banner avatar, bandingkan tanggal
      if (tempBanners.length > 0) {
        const newsDate = parseDate(news.date);

        // Simpan jika belum ada atau tanggal lebih baru
        if (!selectedNews || (newsDate && (!latestDate || newsDate > latestDate))) {
          latestDate = newsDate;
          selectedNews = news;
          banners = tempBanners;

          // Ambil preview text
          let preview = "";
          const firstParagraph = $detail(".news_content p, .pTxt").first().text().trim();
          if (firstParagraph && firstParagraph.length > 0) {
            preview = firstParagraph.substring(0, 150) + (firstParagraph.length > 150 ? "..." : "");
          }

          selectedNews.preview = preview;
          selectedNews.detailUrl = detailUrl;
        }
      }
    }

    if (!selectedNews || banners.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan banner avatar terbaru.\n\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    // Kirim caption
    let caption = `TORAM ONLINE - AVATAR UPDATE\n`;
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
