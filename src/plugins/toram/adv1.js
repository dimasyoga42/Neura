import puppeteer from "puppeteer";

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* =========================
   CONSTANTS
========================= */

const MAX_MESSAGE_LENGTH = 3500;
const MAX_LEVEL = 315;
const MIN_LEVEL = 1;
const MAX_EXP_PERCENT = 100;
const MIN_EXP_PERCENT = 0;

/* =========================
   CHAPTER PARSER
========================= */

const QUEST_MAPPING = {
  // Single chapters
  bab1: { from: 1, until: 9, name: "Bab 1" },
  ch1: { from: 1, until: 9, name: "Bab 1" },
  bab2: { from: 11, until: 18, name: "Bab 2" },
  ch2: { from: 11, until: 18, name: "Bab 2" },
  bab3: { from: 20, until: 27, name: "Bab 3" },
  ch3: { from: 20, until: 27, name: "Bab 3" },
  bab4: { from: 29, until: 36, name: "Bab 4" },
  ch4: { from: 29, until: 36, name: "Bab 4" },
  bab5: { from: 38, until: 45, name: "Bab 5" },
  ch5: { from: 38, until: 45, name: "Bab 5" },
  bab6: { from: 47, until: 55, name: "Bab 6" },
  ch6: { from: 47, until: 55, name: "Bab 6" },
  bab7: { from: 57, until: 64, name: "Bab 7" },
  ch7: { from: 57, until: 64, name: "Bab 7" },
  bab8: { from: 66, until: 75, name: "Bab 8" },
  ch8: { from: 66, until: 75, name: "Bab 8" },
  bab9: { from: 77, until: 86, name: "Bab 9" },
  ch9: { from: 77, until: 86, name: "Bab 9" },
  bab10: { from: 88, until: 95, name: "Bab 10" },
  ch10: { from: 88, until: 95, name: "Bab 10" },
  bab11: { from: 97, until: 105, name: "Bab 11" },
  ch11: { from: 97, until: 105, name: "Bab 11" },
  bab12: { from: 107, until: 115, name: "Bab 12" },
  ch12: { from: 107, until: 115, name: "Bab 12" },
  bab13: { from: 117, until: 124, name: "Bab 13" },
  ch13: { from: 117, until: 124, name: "Bab 13" },
  bab14: { from: 126, until: 132, name: "Bab 14" },
  ch14: { from: 126, until: 132, name: "Bab 14" },
  bab15: { from: 134, until: 136, name: "Bab 15" },
  ch15: { from: 134, until: 136, name: "Bab 15" },

  // Chapter ranges
  "bab1-5": { from: 1, until: 45, name: "Bab 1-5" },
  "ch1-5": { from: 1, until: 45, name: "Bab 1-5" },
  "bab6-10": { from: 47, until: 95, name: "Bab 6-10" },
  "ch6-10": { from: 47, until: 95, name: "Bab 6-10" },
  "bab11-15": { from: 97, until: 136, name: "Bab 11-15" },
  "ch11-15": { from: 97, until: 136, name: "Bab 11-15" },

  // All chapters
  all: { from: 1, until: 136, name: "Semua Bab" },
  semua: { from: 1, until: 136, name: "Semua Bab" },
};

/**
 * Parse chapter input with support for ranges
 * Examples: "bab5", "ch5", "5", "bab1-5", "1-5"
 */
const parseChapterInput = (input) => {
  if (!input) return QUEST_MAPPING.all;

  input = input.toLowerCase().trim();

  // Check exact match first
  if (QUEST_MAPPING[input]) {
    return QUEST_MAPPING[input];
  }

  // Check for range format: "1-5" or "bab1-5"
  const rangeMatch = input.match(/(?:bab|ch)?(\d+)-(?:bab|ch)?(\d+)/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);

    if (start >= 1 && start <= 15 && end >= 1 && end <= 15 && start <= end) {
      const startKey = `bab${start}`;
      const endKey = `bab${end}`;

      if (QUEST_MAPPING[startKey] && QUEST_MAPPING[endKey]) {
        return {
          from: QUEST_MAPPING[startKey].from,
          until: QUEST_MAPPING[endKey].until,
          name: `Bab ${start}-${end}`,
        };
      }
    }
  }

  // Check for single number: "5"
  const singleMatch = input.match(/^(\d+)$/);
  if (singleMatch) {
    const num = parseInt(singleMatch[1]);
    const key = `bab${num}`;

    if (QUEST_MAPPING[key]) {
      return QUEST_MAPPING[key];
    }
  }

  return QUEST_MAPPING.all;
};

/* =========================
   VALIDATION
========================= */

const validateInput = (lv, exp, target) => {
  const errors = [];

  if (isNaN(lv) || isNaN(exp) || isNaN(target)) {
    errors.push("Level, EXP%, dan Target harus berupa angka");
  }

  if (lv < MIN_LEVEL || lv > MAX_LEVEL) {
    errors.push(`Level harus antara ${MIN_LEVEL}-${MAX_LEVEL}`);
  }

  if (target < MIN_LEVEL || target > MAX_LEVEL) {
    errors.push(`Target level harus antara ${MIN_LEVEL}-${MAX_LEVEL}`);
  }

  if (exp < MIN_EXP_PERCENT || exp > MAX_EXP_PERCENT) {
    errors.push(`EXP% harus antara ${MIN_EXP_PERCENT}-${MAX_EXP_PERCENT}`);
  }

  if (lv >= target) {
    errors.push("Target level harus lebih tinggi dari level sekarang");
  }

  return errors;
};

/* =========================
   OPEN CALCULATOR
========================= */

async function openCalculator(browser, lv, exp, target, range) {
  const page = await browser.newPage();
  await page.setDefaultTimeout(60000);

  console.log("[SpamAdv] Opening Toram Tools...");
  await page.goto("https://toramtools.github.io/xp.html", {
    waitUntil: "networkidle2",
  });

  await page.waitForSelector("#level");
  console.log("[SpamAdv] Page loaded");

  // Clear existing values
  await page.$eval("#level", (el) => (el.value = ""));
  await page.$eval("#level-percentage", (el) => (el.value = ""));
  await page.$eval("#target-level", (el) => (el.value = ""));

  // Input values
  await page.type("#level", String(lv));
  await page.type("#level-percentage", String(exp));
  await page.type("#target-level", String(target));

  console.log("[SpamAdv] Form filled");

  // Click Main Quest UI
  await page.click("#mq-ui");
  await wait(700);

  // Set quest range
  await page.select("#mq-from", String(range.from));
  await page.select("#mq-until", String(range.until));

  console.log("[SpamAdv] Quest range set:", range.from, "-", range.until);

  // Enable skip Venena if available
  const skipVenena = await page.$("#skip-venena");
  if (skipVenena) {
    const checked = await page.evaluate((el) => el.checked, skipVenena);
    if (!checked) {
      await skipVenena.click();
      console.log("[SpamAdv] Skip Venena enabled");
    }
  }

  // Enable spam mode (multiple MQ runs)
  const spamMQ = await page.$("#multiple-mq");
  if (spamMQ) {
    const checked = await page.evaluate((el) => el.checked, spamMQ);
    if (!checked) {
      await spamMQ.click();
      console.log("[SpamAdv] Spam mode enabled");
    }
  }

  // Wait for calculations
  await wait(2500);

  return page;
}

/* =========================
   EXTRACT TEXT SAFELY
========================= */

const extractMessageText = (msg) => {
  return (
    msg?.text ||
    msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption ||
    ""
  );
};

/* =========================
   FORMAT OUTPUT
========================= */

const formatRunOutput = (runs, lv, exp, target, range) => {
  const messages = [];

  let buffer = `*Main Quest Spam Calculator*\n\n`;
  buffer += `*Input:*\n`;
  buffer += `• Start Level: ${lv} (${exp}%)\n`;
  buffer += `• Target Level: ${target}\n`;
  buffer += `• Quest Range: ${range.from}-${range.until} (${range.name})\n\n`;
  buffer += `*Results:*\n\n`;

  for (const r of runs) {
    const line = `*Run ${r.no}*\n${r.chapter}\n→ Level ${r.level}\n\n`;

    if ((buffer + line).length > MAX_MESSAGE_LENGTH) {
      messages.push(buffer);
      buffer = "";
    }

    buffer += line;
  }

  buffer += `\n✅ *Total Runs: ${runs.length}*`;
  messages.push(buffer);

  return messages;
};

/* =========================
   MAIN FUNCTION
========================= */

export const spamAdv = async (sock, chatId, msg) => {
  let browser;

  try {
    /* =========================
       EXTRACT INPUT
    ========================= */

    const rawText = extractMessageText(msg);

    if (!rawText) {
      return await sock.sendMessage(
        chatId,
        { text: "Tidak ada input yang diterima" },
        { quoted: msg }
      );
    }

    const args = rawText.trim().split(/\s+/).slice(1);

    if (args.length < 3) {
      const helpText =
        `*Main Quest Spam Calculator*\n\n` +
        `*Format:*\n` +
        `.spamadv <level> <exp%> <target> [chapter]\n\n` +
        `*Contoh:*\n` +
        `• .spamadv 150 0 280 all\n` +
        `• .spamadv 170 50 250 bab9\n` +
        `• .spamadv 200 0 300 bab1-5\n` +
        `• .spamadv 250 25 315 ch11-15\n\n` +
        `*Chapter Options:*\n` +
        `• Specific: bab1, bab5, ch10\n` +
        `• Range: bab1-5, ch6-10\n` +
        `• Number: 1, 5, 10\n` +
        `• All: all, semua\n\n` +
        `*Level Range: 1-315*`;

      return await sock.sendMessage(
        chatId,
        { text: helpText },
        { quoted: msg }
      );
    }

    /* =========================
       PARSE INPUT
    ========================= */

    const lv = parseInt(args[0]);
    const exp = parseInt(args[1]);
    const target = parseInt(args[2]);
    const chapter = args[3] || "all";

    // Validate input
    const errors = validateInput(lv, exp, target);

    if (errors.length > 0) {
      const errorText = ` *Validasi Error:*\n\n${errors.map((e, i) => `${i + 1}. ${e}`).join("\n")}`;
      return await sock.sendMessage(
        chatId,
        { text: errorText },
        { quoted: msg }
      );
    }

    const range = parseChapterInput(chapter);

    console.log("[SpamAdv] Input:", { lv, exp, target, chapter, range });

    /* =========================
       LAUNCH BROWSER
    ========================= */

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
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

    console.log("[SpamAdv] Extracted", runs.length, "runs");

    await browser.close();
    browser = null;

    if (!runs.length) {
      return await sock.sendMessage(
        chatId,
        {
          text: "⚠️ *Tidak ada hasil run*\n\n" +
            "Kemungkinan penyebab:\n" +
            "• Target level sudah tercapai\n" +
            "• Quest range tidak valid\n" +
            "• Level terlalu rendah untuk quest range\n\n" +
            "Coba gunakan quest range yang lebih sesuai dengan level Anda."
        },
        { quoted: msg }
      );
    }

    /* =========================
       SEND OUTPUT
    ========================= */

    const messages = formatRunOutput(runs, lv, exp, target, range);

    for (const message of messages) {
      await sock.sendMessage(chatId, { text: message }, { quoted: msg });
      // Small delay between messages to avoid rate limiting
      if (messages.length > 1) {
        await wait(500);
      }
    }

    return { success: true, runs, totalRuns: runs.length };

  } catch (err) {
    console.error("[SpamAdv] Error:", err);

    if (browser) {
      try {
        await browser.close();
      } catch (closeErr) {
        console.error("[SpamAdv] Error closing browser:", closeErr);
      }
    }

    const errorMsg =
      `❌ *Error Main Quest Spam*\n\n` +
      `${err.message}\n\n` +
      `Jika error berlanjut, coba:\n` +
      `• Periksa koneksi internet\n` +
      `• Gunakan quest range lebih kecil\n` +
      `• Coba beberapa saat lagi`;

    await sock.sendMessage(
      chatId,
      { text: errorMsg },
      { quoted: msg }
    );

    return { success: false, error: err.message };
  }
};



export default { spamAdv };
