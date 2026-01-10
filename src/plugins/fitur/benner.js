import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE = "https://id.toram.jp";
    const LIST_URL = BASE + "/?type_code=all#contentArea";

    const fixUrl = (url) => {
      if (!url) return null;
      return url.startsWith("http") ? url : BASE + url;
    };

    /* ================= FETCH LIST ================= */
    const res = await fetch(LIST_URL);
    const html = await res.text();
    const $ = cheerio.load(html);

    const firstNews = $(".common_list li.news_border a").first();
    if (!firstNews.length) {
      throw new Error("News tidak ditemukan");
    }

    const newsLink = fixUrl(firstNews.attr("href"));
    if (!newsLink) {
      throw new Error("Link news invalid");
    }

    const newsTitle = firstNews.find(".news_title").text().trim();
    const newsDate = firstNews
      .find("time")
      .text()
      .replace(/[［］]/g, "")
      .trim();

    /* ================= FETCH DETAIL (OPSIONAL) ================= */
    const detailRes = await fetch(newsLink);
    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);
    // $detail disiapkan kalau nanti mau ambil konten detail

    /* ================= EVENT BANNER (HALAMAN LIST) ================= */
    const banners = [];
    $(".event_bn a.banner_link").each((i, el) => {
      const img = $(el).find("img").attr("src");
      const alt = $(el).find("img").attr("alt");

      if (img) {
        banners.push({
          title: alt?.trim() || `Banner ${i + 1}`,
          image: fixUrl(img)
        });
      }
    });

    if (!banners.length) {
      throw new Error("Event banner tidak ditemukan");
    }

    /* ================= MESSAGE ================= */
    let text = `*${newsTitle}*\n`;
    text += `${newsDate}\n\n`;
    text += `Event Aktif:\n\n`;

    banners.forEach((b, i) => {
      text += `${i + 1}. ${b.title}\n`;
    });

    text += `\nDetail:\n${newsLink}`;

    await sock.sendMessage(chatId, { text });

    /* ================= SEND IMAGE ================= */
    for (const b of banners) {
      await sock.sendMessage(chatId, {
        image: { url: b.image },
        caption: b.title
      });
    }

  } catch (err) {
    console.error("[Toram Banner Error]", err);
    await sock.sendMessage(
      chatId,
      { text: `Error Banner Toram:\n${err.message}` }
    );
  }
};
