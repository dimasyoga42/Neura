import fetch from "node-fetch";
import * as cheerio from "cheerio";

export const lvl = async (sock, chatId, msg, text) => {
  try {
    const lv = text.trim().split(/\s+/)[1];

    if (!lv || isNaN(lv))
      return sock.sendMessage(
        chatId,
        { text: "Contoh: .lv 299" },
        { quoted: msg },
      );

    const res = await fetch(
      `https://coryn.club/leveling.php?lv=${encodeURIComponent(lv)}&gap=7&bonusEXP=0`,
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const $ = cheerio.load(await res.text());
    let result = `Lv ${lv}\n`;
    let found = false;

    $("section.level-group").each((_, section) => {
      const title = $(section).find("h2").text().trim();
      if (title !== "Boss" && title !== "Mini Boss") return;

      result += `\n${title}\n`;

      $(section)
        .find("article.level-entry")
        .each((__, entry) => {
          const level = $(entry).find(".level-entry-level").text().trim();
          const name = $(entry)
            .find(".level-entry-main p:first-child b")
            .text()
            .trim();
          const loc = $(entry).find(".level-entry-main p").eq(1).text().trim();
          const exp = $(entry).find(".level-entry-exp p").first().text().trim();

          if (name && exp) {
            found = true;
            result += `${level} ${name} | ${loc}\n${exp}\n`;
          }
        });
    });

    if (!found) result += "Tidak ada data untuk level ini.";

    await sock.sendMessage(chatId, { text: result.trim() }, { quoted: msg });
  } catch (e) {
    console.error(e);
    await sock.sendMessage(
      chatId,
      { text: "Gagal ambil data." },
      { quoted: msg },
    );
  }
};
