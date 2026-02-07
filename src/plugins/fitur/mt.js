import fetch from "node-fetch";
import * as cheerio from "cheerio";
import axios from "axios";

export const getMt = async (sock, chatId, msg) => {
  try {
    const res = await axios.get(`http://id.toram.jp/?type_code=update#contentArea`)
    const sup = cheerio.load(res.data)
    const b = sup('.common_list').find('.news_border:nth-child(1)')
    let link = `http://id.toram.jp` + sup(b).find('a').attr('href')

    const des = await axios.get(link)

    const soup = cheerio.load(des.data)
    const result = soup('#news').find('div').text().trim()
    const reg = result.split('Kembali ke atas')[0]
    sock.sendMessage(chatId, { text: reg }, { quoted: msg });
  } catch (error) {

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
