import axios from "axios";
import cheerio from "cheerio";

const BASE = "https://id.toram.jp";

async function scrapeBoostBoss() {
  const { data: news } = await axios.get(`${BASE}/information/`);
  const $ = cheerio.load(news);

  const boostLink = $("a[href*='information/detail']")
    .map((i, el) => BASE + $(el).attr("href"))
    .get()
    .find(h => h.toLowerCase().includes("boost"));

  if (!boostLink) return [];

  const { data } = await axios.get(boostLink);
  const $$ = cheerio.load(data);

  const bosses = [];

  $$("div.subtitle").each((i, el) => {
    const name = $$(el).text().trim();
    const img = $$(el).next("br").next("div").find("img").attr("src");

    if (name && img) {
      bosses.push({
        name,
        image: img.startsWith("http") ? img : BASE + img
      });
    }
  });

  return bosses;
}

export const bosboost = async (sock, chatId, msg) => {
  try {
    const data = await scrapeBoostBoss();
    if (!data.length) return sock.sendMessage(chatId, { text: "Boost boss tidak ditemukan." });

    for (const e of data) {
      await sock.sendMessage(chatId, {
        image: { url: e.image },
        caption: e.name
      });
    }
  } catch (err) {
    console.error(err);
    sock.sendMessage(chatId, { text: "Gagal ambil data boost boss." });
  }
};
