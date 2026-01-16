import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const Banner = async (sock, msg, chatId) => {
  try {
    const BASE = "https://id.toram.jp";
    const LIST_URL = `${BASE}/?type_code=all#contentArea`;

    const fixUrl = (url) => {
      if (!url) return null;
      if (url.startsWith("http")) return url;
      return BASE + url;
    };

    console.log(`[Toram Banner] Mengambil daftar berita dari ${LIST_URL}...`);
    const res = await fetch(LIST_URL);
    if (!res.ok) throw new Error("Gagal terhubung ke situs Toram.");

    const html = await res.text();
    const $ = cheerio.load(html);

    let targetHref = null;
    let targetTitle = "";
    let targetDate = "";

    $(".common_list li a").each((i, el) => {
      if (targetHref) return;

      const title = $(el).find(".news_title").text().trim();
      const date = $(el).find(".news_date").text().trim();

      if (
        title.toLowerCase().includes("peti harta avatar") ||
        title.toLowerCase().includes("avatar chest")
      ) {
        targetHref = $(el).attr("href");
        targetTitle = title;
        targetDate = date;
      }
    });

    if (!targetHref) {
      return sock.sendMessage(
        String(chatId),
        { text: "⚠️ Maaf, tidak ditemukan berita terbaru mengenai 'Peti Harta Avatar' (Avatar Chest) di halaman utama saat ini." },
        msg ? { quoted: msg } : {}
      );
    }

    const detailUrl = fixUrl(targetHref);
    console.log(`[Toram Banner] Target ditemukan: ${targetTitle} -> ${detailUrl}`);

    const detailRes = await fetch(detailUrl);
    const detailHtml = await detailRes.text();
    const $detail = cheerio.load(detailHtml);

    let bannerUrl = null;

    $detail(".news_content img").each((i, el) => {
      if (bannerUrl) return; // Ambil satu saja yang pertama

      const src = $detail(el).attr("src");
      if (src && !src.includes("icon") && !src.includes("common")) {
        bannerUrl = fixUrl(src);
      }
    });

    if (!bannerUrl) {
      bannerUrl = "https://toram.jp/img/common/logo.png"; // Gambar default
    }

    /* ================= 5. PENGIRIMAN PESAN ================= */
    const caption = `*TORAM ONLINE BANNER INFO*\n` +
      ` *Kategori:* Avatar Chest (Peti Harta)\n` +
      ` *Judul:* ${targetTitle}\n` +
      ` *Rilis:* ${targetDate}\n` +
      ` *Link:* ${detailUrl}`;

    await sock.sendMessage(
      String(chatId),
      {
        image: { url: bannerUrl },
        caption: caption
      },
      msg ? { quoted: msg } : {}
    );

  } catch (err) {
    console.error("[Toram Banner Error]", err);
    await sock.sendMessage(
      String(chatId),
      { text: `Terjadi kesalahan sistem saat mengambil data banner.\nError: ${err.message}` },
      msg ? { quoted: msg } : {}
    );
  }
};
