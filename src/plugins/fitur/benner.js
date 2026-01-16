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

    let targetHref = null;
    let targetTitle = "";
    let targetDate = "";

    const filterRegex = /avatar\s*chest|peti\s*harta|chest.*avatar|kostum|gacha/i;

    $(".common_list li a").each((i, el) => {
      if (targetHref) return;

      const title = $(el).find(".news_title").text().trim();
      const date = $(el).find(".news_date").text().trim();

      if (filterRegex.test(title)) {
        targetHref = $(el).attr("href");
        targetTitle = title;
        targetDate = date;
      }
    });

    if (!targetHref) {
      return sock.sendMessage(
        String(chatId),
        { text: "Tidak ditemukan berita Avatar/Peti Harta terbaru.\n\nCek manual: https://id.toram.jp" },
        msg ? { quoted: msg } : {}
      );
    }

    const detailUrl = fixUrl(targetHref);
    const detailRes = await fetch(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailRes.ok) throw new Error(`HTTP Error: ${detailRes.status}`);

    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    let bannerUrl = null;

    $detail("center img").each((i, el) => {
      if (bannerUrl) return;
      const src = $detail(el).attr("src");
      if (src && /toram_avatar|avatar.*\d{6}|kotobuki|banner|chest/i.test(src)) {
        if (!/icon|nav_|footer|logo(?!.*avatar)/i.test(src)) {
          bannerUrl = fixUrl(src);
        }
      }
    });

    if (!bannerUrl) {
      $detail(".news_content img").each((i, el) => {
        if (bannerUrl) return;
        const src = $detail(el).attr("src");
        const width = $detail(el).attr("width");
        const height = $detail(el).attr("height");

        if (src && (
          /toram_avatar|avatar.*\d{6}|banner/i.test(src) ||
          (width && parseInt(width) > 200) ||
          (height && parseInt(height) > 200)
        )) {
          if (!/icon|nav_|footer|logo(?!.*avatar)/i.test(src)) {
            bannerUrl = fixUrl(src);
          }
        }
      });
    }

    if (!bannerUrl) {
      const firstBigImg = $detail(".news_content img").filter((i, el) => {
        const src = $detail(el).attr("src");
        return src && /\.(png|jpg|jpeg)$/i.test(src) && !/icon|nav_|footer/i.test(src);
      }).first().attr("src");

      if (firstBigImg) bannerUrl = fixUrl(firstBigImg);
    }

    const finalImage = bannerUrl || "https://toram-jp.akamaized.net/id/img/common/logo.png";

    let preview = "";
    const firstParagraph = $detail(".news_content p").first().text().trim();
    if (firstParagraph && firstParagraph.length > 0) {
      preview = firstParagraph.substring(0, 150) + (firstParagraph.length > 150 ? "..." : "");
    }

    let caption = `TORAM ONLINE - UPDATE\n\n`;
    caption += `${targetTitle}\n\n`;
    caption += `Tanggal: ${targetDate}\n`;

    if (preview) {
      caption += `\nPreview:\n${preview}\n`;
    }

    caption += `\nLink: ${detailUrl}`;

    await sock.sendMessage(
      String(chatId),
      {
        image: { url: finalImage },
        caption: caption
      },
      msg ? { quoted: msg } : {}
    );

  } catch (err) {
    let errorMsg = "TORAM BANNER - ERROR\n\n";
    errorMsg += `Terjadi kesalahan: ${err.message}\n\n`;
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
