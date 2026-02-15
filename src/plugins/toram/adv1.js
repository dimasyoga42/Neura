import puppeteer from "puppeteer";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================
   CHAPTER PARSER
========================= */

const QUEST_MAPPING = {
  bab1: { from: 1, until: 9, name: "Bab 1" },
  bab2: { from: 11, until: 18, name: "Bab 2" },
  bab3: { from: 20, until: 27, name: "Bab 3" },
  bab4: { from: 29, until: 36, name: "Bab 4" },
  bab5: { from: 38, until: 45, name: "Bab 5" },
  bab6: { from: 47, until: 55, name: "Bab 6" },
  bab7: { from: 57, until: 64, name: "Bab 7" },
  bab8: { from: 66, until: 75, name: "Bab 8" },
  bab9: { from: 77, until: 86, name: "Bab 9" },
  bab10: { from: 88, until: 95, name: "Bab 10" },
  bab11: { from: 97, until: 105, name: "Bab 11" },
  bab12: { from: 107, until: 115, name: "Bab 12" },
  bab13: { from: 117, until: 124, name: "Bab 13" },
  bab14: { from: 126, until: 132, name: "Bab 14" },
  bab15: { from: 134, until: 136, name: "Bab 15" },
  all: { from: 1, until: 136, name: "Semua Bab" },
};

const parseChapterInput = (input) => {
  if (!input) return QUEST_MAPPING.all;
  input = input.toLowerCase().trim();
  return QUEST_MAPPING[input] || QUEST_MAPPING.all;
};

/* =========================
   CORE SCRAPER
========================= */

async function openCalculator(browser, lv, exp, target, range) {
  const page = await browser.newPage();
  await page.setDefaultTimeout(60000);

  await page.goto("https://toramtools.github.io/xp.html", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#level");

  // Clear input
  await page.$eval("#level", (el) => (el.value = ""));
  await page.$eval("#level-percentage", (el) => (el.value = ""));
  await page.$eval("#target-level", (el) => (el.value = ""));

  await page.type("#level", String(lv));
  await page.type("#level-percentage", String(exp));
  await page.type("#target-level", String(target));

  await page.click("#mq-ui");
  await wait(700);

  await page.select("#mq-from", String(range.from));
  await page.select("#mq-until", String(range.until));

  // Enable Skip Venena
  const skipVenena = await page.$("#skip-venena");
  if (skipVenena) {
    const checked = await page.evaluate((el) => el.checked, skipVenena);
    if (!checked) await skipVenena.click();
  }

  // Enable Spam Diary
  const spamMQ = await page.$("#multiple-mq");
  if (spamMQ) {
    const checked = await page.evaluate((el) => el.checked, spamMQ);
    if (!checked) await spamMQ.click();
  }

  await wait(2500);
  return page;
}

/* =========================
   MAIN FUNCTION
========================= */

export const spamAdv = async (
  sock,
  chatId,
  msg,
) => {
  let browser;

  try {
    const args = msg.text.trim().split(/\s+/).slice(1);
    const lv = parseInt(args[0], 10);
    const exp = parseInt(args[1], 10);
    const target = parseInt(args[2], 10);
    const chapter = args[3]
    const range = parseChapterInput(chapter);
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await openCalculator(browser, lv, exp, target, range);

    /* =========================
       EXTRACT RUN LIST
    ========================= */

    const runs = await page.evaluate(() => {
      const rows = document.querySelectorAll("#mq-table-row");
      const data = [];

      rows.forEach((row) => {
        const cols = row.querySelectorAll("div");
        if (cols.length >= 3) {
          data.push({
            no: cols[0].textContent.trim(),
            chapter: cols[1].textContent.trim(),
            level: cols[2].textContent.trim(),
          });
        }
      });

      return data;
    });

    await browser.close();

    /* =========================
       FORMAT OUTPUT
    ========================= */

    if (!runs.length) {
      return await sock.sendMessage(
        chatId,
        { text: "❌ Tidak ada hasil run (cek level / range)" },
        { quoted: msg }
      );
    }

    const MAX_LEN = 3500;
    let buffer = `*Main Quest Spam Result*\n\n`;
    buffer += `Start Lv : ${lv} (${exp}%)\n`;
    buffer += `Target   : Lv ${target}\n`;
    buffer += `Range    : ${range.from}-${range.until}\n\n`;

    for (const r of runs) {
      const line = `Run ${r.no}\n${r.chapter}\n→ Lv ${r.level}\n\n`;

      if ((buffer + line).length > MAX_LEN) {
        await sock.sendMessage(chatId, { text: buffer }, { quoted: msg });
        buffer = "";
      }

      buffer += line;
    }

    buffer += `📊 Total Run : ${runs.length}`;
    await sock.sendMessage(chatId, { text: buffer }, { quoted: msg });

    return runs;
  } catch (err) {
    if (browser) await browser.close();

    await sock.sendMessage(
      chatId,
      { text: "❌ Error MQ Spam:\n" + err.message },
      { quoted: msg }
    );
  }
};

export default { spamAdv };
