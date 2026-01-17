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

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    };

    // 1. Mengambil Daftar Berita Utama
    const res = await fetch(LIST_URL, { headers });
    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    const newsList = [];

    $(".common_list li a").each((i, el) => {
      const href = $(el).attr("href");
      const dateStr = $(el).find(".news_date").text().trim();

      // Kita tetap mengambil judul hanya untuk keperluan display caption nantinya,
      // bukan untuk filtering.
      const titleList = $(el).find(".news_title").text().trim();

      newsList.push({
        href: href,
        titleList: titleList,
        date: dateStr
      });
    });

    if (newsList.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Gagal mengambil struktur daftar berita. Mohon cek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    // Regex Keyword (Fokus pada konten)
    const filterRegex = /(avatar|chest|peti\s*harta|kostum|gacha|item\s*khusus|kolaborasi)/i;

    let selectedNews = null;
    let banners = [];

    // 2. Iterasi Mendalam (Deep Loop)
    // Kita membatasi pengecekan pada 5 berita teratas.
    // Logikanya: Berita terbaru pasti ada di indeks 0, 1, atau 2.
    // Kita tidak memfilter berdasarkan judul di sini, melainkan langsung masuk ke detail.

    const checkLimit = Math.min(newsList.length, 5);

    for (let i = 0; i < checkLimit; i++) {
      const news = newsList[i];
      const detailUrl = fixUrl(news.href);

      // Fetch halaman detail secara langsung tanpa validasi judul
      const detailRes = await fetch(detailUrl, { headers });
      if (!detailRes.ok) continue;

      const detailHtml = await detailRes.text();
      const $detail = cheerio.load(detailHtml);

      // Ekstraksi Konten Utama (.news_content)
      // Analisis difokuskan pada teks paragraf di dalam berita
      const contentText = $detail(".news_content").text();

      // Validasi 1: Cek apakah ISI KONTEN mengandung keyword relevan
      if (!filterRegex.test(contentText)) {
        // Jika isi berita sama sekali tidak membahas avatar/gacha, skip ke berita berikutnya (yang lebih tua)
        continue;
      }

      // Validasi 2: Ekstraksi Gambar Banner
      const tempBanners = [];

      // Mencari gambar di area konten utama
      $detail(".news_content img, center img").each((_, el) => {
        const src = $detail(el).attr("src");
        const width = $detail(el).attr("width");

        if (!src) return;

        // Filter: Abaikan elemen UI (icon, footer, nav, social media)
        if (/icon|nav_|footer|line|twitter|facebook|google/i.test(src)) return;

        // Heuristik seleksi gambar:
        // Ambil jika nama file mengandung kata kunci ATAU ukurannya besar (asumsi banner)
        const isBannerName = /banner|main|avatar|chest|header/i.test(src);
        const isLargeEnough = !width || parseInt(width) > 250;

        if (isBannerName || isLargeEnough) {
          const fullUrl = fixUrl(src);
          if (!tempBanners.includes(fullUrl)) {
            tempBanners.push(fullUrl);
          }
        }
      });

      // KEPUTUSAN FINAL (Terminating Condition)
      // Jika ditemukan gambar valid DAN konten teks relevan, maka ini adalah update terbaru.
      if (tempBanners.length > 0) {
        // Ambil judul dari halaman detail (biasanya lebih akurat daripada list)
        const detailedTitle = $detail("h1").first().text().trim() || news.titleList;

        selectedNews = {
          ...news,
          title: detailedTitle,
          detailUrl: detailUrl,
          // Buat preview teks pendek untuk caption
          preview: contentText.replace(/\s+/g, ' ').substring(0, 150).trim() + "..."
        };
        banners = tempBanners;

        // BREAK: Berhenti segera setelah menemukan match pertama dari atas.
        // Ini menjamin kita mendapat yang 'Terbaru' atau 'Kedua Terbaru' tanpa tertukar dengan berita lama.
        break;
      }
    }

    if (!selectedNews || banners.length === 0) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan banner Avatar/Gacha pada 5 berita teratas saat ini.\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    // Konstruksi Pesan Respons
    let caption = `*TORAM ONLINE - NEW UPDATE*\n`;
    caption += `\n🏷️ *${selectedNews.title}*`;
    caption += `\n📅 ${selectedNews.date}`;
    caption += `\n\n📝 ${selectedNews.preview}`;
    caption += `\n\n🔗 ${selectedNews.detailUrl}`;

    // Pengiriman Pesan
    for (let i = 0; i < banners.length; i++) {
      await sock.sendMessage(
        String(chatId),
        {
          image: { url: banners[i] },
          caption: i === 0 ? caption : ""
        },
        msg ? { quoted: msg } : {}
      );
    }

  } catch (err) {
    console.error(err);
    await sock.sendMessage(
      String(chatId),
      { text: `Sistem Error: ${err.message}` },
      msg ? { quoted: msg } : {}
    );
  }
};
