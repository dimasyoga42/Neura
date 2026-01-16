import axios from "axios";
import * as cheerio from "cheerio";

const BASE = "https://id.toram.jp";

async function scrapeBoostBoss() {
  try {
    const { data: news } = await axios.get(`${BASE}/information/`);
    const $ = cheerio.load(news);

    let boostLink = null;

    $("a[href*='information/detail']").each((i, el) => {
      const text = $(el).text().toLowerCase();
      const href = $(el).attr("href");

      if (text.includes("boost") && text.includes("akhir pekan")) {
        boostLink = href.startsWith("http") ? href : BASE + href;
        return false; // break loop
      }
    });

    if (!boostLink) {
      console.log("Tidak ada event Boost Akhir Pekan saat ini");
      return [];
    }

    const { data } = await axios.get(boostLink);
    const $$ = cheerio.load(data);

    const bosses = [];

    $$("div.subtitle").each((i, el) => {
      const rawText = $$(el).text().trim();

      if (!rawText.startsWith("Lv")) return;

      const match = rawText.match(/^(Lv\d+)\s+([^(]+)/);
      if (!match) return;

      const level = match[1];
      const bossName = match[2].trim();
      const location = rawText.match(/\(([^)]+)\)/)?.[1] || "";

      let img = null;
      let nextEl = $$(el).next();

      for (let j = 0; j < 5; j++) {
        if (nextEl.length === 0) break;

        const foundImg = nextEl.find("img").first();
        if (foundImg.length > 0) {
          img = foundImg.attr("src");
          break;
        }
        nextEl = nextEl.next();
      }

      if (img) {
        const imageUrl = img.startsWith("http")
          ? img
          : img.startsWith("/")
            ? BASE + img
            : BASE + "/" + img;

        bosses.push({
          level,
          name: bossName,
          location,
          fullName: `${level} ${bossName}${location ? ` (${location})` : ""}`,
          image: imageUrl
        });
      }
    });

    return bosses;

  } catch (error) {
    console.error("Error scraping boost boss:", error.message);
    throw error;
  }
}

export const bosboost = async (sock, chatId, msg) => {
  try {
    const bosses = await scrapeBoostBoss();

    if (!bosses.length) {
      return sock.sendMessage(chatId, {
        text: "Tidak ada event Boost Akhir Pekan yang aktif saat ini."
      });
    }

    for (const boss of bosses) {
      await sock.sendMessage(chatId, {
        image: { url: boss.image },
        caption: boss.fullName
      });
    }

  } catch (err) {
    console.error("Error in bosboost:", err);
    await sock.sendMessage(chatId, {
      text: `Gagal mengambil data boost boss.\nError: ${err.message}`
    });
  }
};
