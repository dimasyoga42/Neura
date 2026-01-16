import fetch from "node-fetch";
import * as cheerio from "cheerio";

const BASE_URL = "https://id.toram.jp";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

export const getMt = async (sock, chatId, msg) => {
  try {
    const res = await fetch(`${BASE_URL}/?type_code=update`, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const html = await res.text();
    const $ = cheerio.load(html);

    let newsLink = null;
    const selectors = [
      ".common_list .news_border:first-child a",
      ".news_list .news_item:first-child a",
      ".information_list li:first-child a",
      "a[href*='information_id']",
    ];

    for (const selector of selectors) {
      const element = $(selector);
      if (element.length > 0) {
        newsLink = element.attr("href");
        break;
      }
    }

    if (!newsLink) throw new Error("No news link found");
    if (newsLink.startsWith("/")) newsLink = BASE_URL + newsLink;

    const detailRes = await fetch(newsLink, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });

    if (!detailRes.ok) throw new Error(`Detail page HTTP ${detailRes.status}`);

    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    let title = "";
    const titleSelectors = ["h1.page_title", "h1", ".news_title", "title"];
    for (const selector of titleSelectors) {
      const element = $detail(selector);
      if (element.length > 0) {
        title = element.text().trim();
        if (title && title.length > 0) break;
      }
    }
    title = title.replace(/\s+/g, " ").replace(/Toram Online.*?-\s*/i, "").trim();

    let content = "";
    const contentSelectors = [
      ".information_detail .content",
      ".news_content .content",
      ".information_detail",
      ".newsBox .deluxetitle",
      ".newsBox",
    ];
    for (const selector of contentSelectors) {
      const element = $detail(selector);
      if (element.length > 0) {
        content = element.text().trim();
        if (content && content.length > 50) break;
      }
    }

    if (content) {
      const unwantedPatterns = [
        /kembali ke atas.*/gi,
        /back to top.*/gi,
        /tim operasi toram online.*/gi,
        /toram online operations team.*/gi,
        /mohon maaf atas ketidaknyamanan.*/gi,
        /silakan baca dan periksa situs program.*/gi,
        /\*apabila game tidak dapat dijalankan.*/gi,
        /\*mohon maklum karena jadwal maintenance.*/gi,
        /\*isi pemeliharaan dapat berubah.*/gi,
        /\*harap diperhatikan bahwa 15 menit.*/gi,
        /※.*/g,
      ];

      unwantedPatterns.forEach((pattern) => {
        content = content.replace(pattern, "");
      });

      content = content
        .replace(/\s+/g, " ")
        .replace(/([.!?])\s+([A-Z])/g, "$1\n\n$2")
        .replace(/・/g, "\n- ")
        .replace(/\n- \s*\n- /g, "\n- ")
        .replace(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/g, "$1 - $2")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    }

    const maxLength = 1000;
    let truncated = false;

    if (content.length > maxLength) {
      const breakPoints = [
        content.lastIndexOf(".", maxLength),
        content.lastIndexOf("!", maxLength),
        content.lastIndexOf("?", maxLength),
      ];
      const bestBreakPoint = Math.max(...breakPoints.filter((bp) => bp > maxLength * 0.7));
      if (bestBreakPoint > 0) {
        content = content.substring(0, bestBreakPoint + 1);
        truncated = true;
      }
    }

    const caption =
      `${title}\n\n${content}${truncated ? "\n\nBaca selengkapnya di situs resmi" : ""}\n\n` +
      `Diambil: ${new Date().toLocaleString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })}`;

    await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
  } catch (error) {
    let errorMsg = "Gagal mengambil berita Toram Online\n\n";

    if (error.message.includes("HTTP 404")) {
      errorMsg += "Penyebab: Halaman tidak ditemukan\nSaran: Website mungkin sedang update";
    } else if (error.message.includes("HTTP 503") || error.message.includes("HTTP 502")) {
      errorMsg += "Penyebab: Server sedang maintenance\nSaran: Coba lagi dalam 10-15 menit";
    } else if (error.message.includes("timeout")) {
      errorMsg += "Penyebab: Koneksi timeout\nSaran: Periksa koneksi internet";
    } else if (error.message.includes("No news link found")) {
      errorMsg += "Penyebab: Tidak ada berita terbaru\nSaran: Website belum ada update";
    } else {
      errorMsg += "Penyebab: Error teknis\nSaran: Coba lagi nanti";
    }

    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
  }
};

export const getToramNewsById = async (sock, chatId, msg, newsId) => {
  if (!newsId) {
    await sock.sendMessage(
      chatId,
      { text: "Error: ID berita tidak diberikan\n\nContoh: /toram 10194" },
      { quoted: msg }
    );
    return;
  }

  const url = `${BASE_URL}/information/detail/?information_id=${newsId}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      timeout: 15000,
    });

    if (!res.ok) {
      if (res.status === 404) throw new Error(`Berita ID ${newsId} tidak ditemukan`);
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    let title = $("h1").first().text().trim() || `Berita ID: ${newsId}`;
    let content = $("body").text().trim();

    content = content
      .replace(/kembali ke atas.*/gi, "")
      .replace(/tim operasi toram online.*/gi, "")
      .replace(/\s+/g, " ")
      .replace(/([.!?])\s+([A-Z•・])/g, "$1\n\n$2")
      .replace(/・/g, "\n- ")
      .trim();

    if (content.length > 1000) {
      content = content.substring(0, 1000) + "...";
    }

    const caption = `${title}\n\n${content}`;

    await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
  } catch (error) {
    let errorMsg = `Gagal mengambil berita ID: ${newsId}\n\n`;

    if (error.message.includes("tidak ditemukan")) {
      errorMsg += "Penyebab: ID tidak valid atau dihapus\nSaran: Gunakan command tanpa ID untuk berita terbaru";
    } else {
      errorMsg += `Error: ${error.message}\nSaran: Coba lagi nanti`;
    }

    await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
  }
};

export const checkToramStatus = async () => {
  try {
    const res = await fetch(BASE_URL, {
      method: "HEAD",
      headers: { "User-Agent": USER_AGENT },
      timeout: 10000,
    });
    return { status: res.ok, code: res.status };
  } catch (error) {
    return { status: false, error: error.message };
  }
};

export const getAvailableNewsIds = async () => {
  try {
    const res = await fetch(`${BASE_URL}/?type_code=update`, {
      headers: { "User-Agent": USER_AGENT },
    });

    const html = await res.text();
    const $ = cheerio.load(html);

    const newsIds = [];
    $('a[href*="information_id"]').each((i, el) => {
      const href = $(el).attr("href");
      const match = href.match(/information_id=(\d+)/);
      if (match) {
        newsIds.push({
          id: match[1],
          title: $(el).text().trim(),
          url: href.startsWith("/") ? BASE_URL + href : href,
        });
      }
    });

    return newsIds;
  } catch (error) {
    return [];
  }
};
