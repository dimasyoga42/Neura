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

  if (QUEST_MAPPING[input]) return QUEST_MAPPING[input];

  const range = input.match(/(\d+)-(\d+)/);
  if (range) {
    const s = parseInt(range[1]);
    const e = parseInt(range[2]);
    if (QUEST_MAPPING[`bab${s}`] && QUEST_MAPPING[`bab${e}`]) {
      return {
        from: QUEST_MAPPING[`bab${s}`].from,
        until: QUEST_MAPPING[`bab${e}`].until,
        name: `Bab ${s}-${e}`,
      };
    }
  }

  const single = input.match(/\d+/);
  if (single && QUEST_MAPPING[`bab${single[0]}`]) {
    return QUEST_MAPPING[`bab${single[0]}`];
  }

  return QUEST_MAPPING.all;
};

/* =========================
   CORE CALCULATOR
========================= */

async function openToramCalc(browser, lv, exp, target, range, spamMode = false) {
  const page = await browser.newPage();
  await page.setDefaultTimeout(45000);

  await page.goto("https://toramtools.github.io/xp.html", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#level");

  // Clear dulu biar gak numpuk
  await page.$eval("#level", (el) => (el.value = ""));
  await page.$eval("#level-percentage", (el) => (el.value = ""));
  await page.$eval("#target-level", (el) => (el.value = ""));

  await page.type("#level", String(lv));
  await page.type("#level-percentage", String(exp));
  await page.type("#target-level", String(target));

  await page.click("#mq-ui");
  await wait(600);

  await page.select("#mq-from", String(range.from));
  await page.select("#mq-until", String(range.until));

  if (spamMode) {
    await page.click("#multiple-mq");
    await wait(2000);
  } else {
    await wait(1200);
  }

  return page;
}

/* =========================
   NORMAL MQ CALC
========================= */

export const spamAdv = async (sock, chatId, msg, text) => {
  let browser;

  try {
    const args = text.split(" ").filter(Boolean);

    const lv = parseInt(args[1]);
    const exp = parseInt(args[2] || 0);
    const target = parseInt(args[3]);
    const chapter = args[4];

    if (!lv || !target) {
      return sock.sendMessage(chatId, {
        text: "Format:\n.spamadv <lv> <exp%> <target> [bab]\n\nContoh:\n.spamadv 200 0 250 bab5",
      });
    }

    const range = parseChapterInput(chapter);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await openToramCalc(browser, lv, exp, target, range);

    const result = await page.evaluate(() => {
      const get = (s) => document.querySelector(s)?.textContent?.trim() || "N/A";

      return {
        xpRequired: get("#xp-required"),
        xpGained: get("#mq-xp").replace("XP: ", ""),
        finalLevel: get("#mq-eval").replace(
          "After doing Main Quest's above range you'll reach ",
          ""
        ),
      };
    });

    await browser.close();

    const msgOut = `📊 MQ Calculator - ${range.name}

Current : Lv ${lv} (${exp}%)
Target  : Lv ${target}

XP Need : ${result.xpRequired}
XP Gain : ${result.xpGained}
Final   : ${result.finalLevel}

Range   : ${range.from} - ${range.until}`;

    await sock.sendMessage(chatId, { text: msgOut }, { quoted: msg });

    return result;
  } catch (e) {
    if (browser) await browser.close();
    await sock.sendMessage(chatId, {
      text: "Error MQ Calc:\n" + e.message,
    });
  }
};

/* =========================
   SPAM MQ (ADVENTURER DIARY)
========================= */

export const spamMainQuest = async (
  sock,
  chatId,
  msg,
  lv,
  exp,
  target,
  chapter
) => {
  let browser;

  try {
    const range = parseChapterInput(chapter);

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await openToramCalc(browser, lv, exp, target, range, true);

    const runs = await page.evaluate(() => {
      const rows = document.querySelectorAll("#mq-table-row");
      const out = [];

      rows.forEach((r) => {
        const t = r.innerText.trim().split("\n");
        if (t.length >= 3) {
          out.push({
            run: t[0],
            chapter: t[1],
            level: t[2],
          });
        }
      });

      return out;
    });

    await browser.close();

    let text = `📚 MQ Spam - ${range.name}

Start : Lv ${lv} (${exp}%)
Target: Lv ${target}
Range : ${range.from}-${range.until}

`;

    if (!runs.length) {
      text += "Tidak perlu spam, sudah cukup.";
    } else {
      runs.slice(0, 15).forEach((r) => {
        text += `Run ${r.run} → ${r.level}\n`;
      });

      if (runs.length > 15)
        text += `\n+${runs.length - 15} run lainnya`;

      text += `\n\nTotal Run: ${runs.length}`;
    }

    await sock.sendMessage(chatId, { text }, { quoted: msg });

    return runs;
  } catch (e) {
    if (browser) await browser.close();
    await sock.sendMessage(chatId, {
      text: "Error MQ Spam:\n" + e.message,
    });
  }
};

export default { spamAdv, spamMainQuest };
