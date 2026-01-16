import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE = "https://id.toram.jp";
    const LIST_URL = `${BASE}/?type_code=event#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return BASE + url;
    };

    const res = await fetch(LIST_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    let targetHref = null;
    let targetTitle = "";

    $(".common_list li a").each((_, el) => {
      const titleText = $(el).find(".news_title").text().trim();
      const category = $(el).find(".news_category").text().trim(); // Opsional: cek kategori

      if (
        !targetHref &&
        (titleText.match(/avatar/i) || titleText.match(/ava/i) || titleText.match(/peti harta/i))
      ) {
        targetHref = $(el).attr("href");
        targetTitle = titleText;
      }
    });

    if (!targetHref) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan berita terbaru mengenai Banner/Avatar saat ini." },
        { quoted: msg }
      );
    }

    const detailUrl = fixUrl(targetHref);
    console.log(`[Toram Banner] Mengambil data dari: ${targetTitle}`);

    const detailRes = await fetch(detailUrl);
    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    const date = $detail(".news_date time").first().text().trim();
    const title = $detail("h1").first().text().trim() || targetTitle;

    const images = [];
    $detail(".news_content img").each((_, el) => {
      const src = $detail(el).attr("src");
      if (src && !src.includes("icon") && !src.includes("arrow")) {
        images.push(fixUrl(src));
      }
    });

    if (images.length === 0) {
      throw new Error("Gambar banner tidak ditemukan dalam postingan tersebut.");
    }

    const mainBanner = images[0];

    const messageText = `*TORAM ONLINE AVATAR BANNER*\n\n` +
      ` *Judul:* ${title}\n` +
      `*Tanggal:* ${date}\n` +
      `*Link:* ${detailUrl}`;

    await sock.sendMessage(
      String(chatId),
      {
        image: { url: mainBanner },
        caption: messageText
      },
      msg ? { quoted: msg } : {}
    );

  } catch (err) {
    console.error("[Toram Banner Error]", err);
    await sock.sendMessage(
      String(chatId),
      { text: `Gagal mengambil banner Toram.\n\nError: ${err.message}` },
      msg ? { quoted: msg } : {}
    );
  }
};
