import puppeteer from "puppeteer";

// Mapping bab ke quest ID
const QUEST_MAPPING = {
  // Bab 1
  bab1: { from: 1, until: 9, name: "Bab 1" },
  ch1: { from: 1, until: 9, name: "Bab 1" },
  chapter1: { from: 1, until: 9, name: "Bab 1" },

  // Bab 2
  bab2: { from: 11, until: 18, name: "Bab 2" },
  ch2: { from: 11, until: 18, name: "Bab 2" },
  chapter2: { from: 11, until: 18, name: "Bab 2" },

  // Bab 3
  bab3: { from: 20, until: 27, name: "Bab 3" },
  ch3: { from: 20, until: 27, name: "Bab 3" },
  chapter3: { from: 20, until: 27, name: "Bab 3" },

  // Bab 4
  bab4: { from: 29, until: 36, name: "Bab 4" },
  ch4: { from: 29, until: 36, name: "Bab 4" },
  chapter4: { from: 29, until: 36, name: "Bab 4" },

  // Bab 5
  bab5: { from: 38, until: 45, name: "Bab 5" },
  ch5: { from: 38, until: 45, name: "Bab 5" },
  chapter5: { from: 38, until: 45, name: "Bab 5" },

  // Bab 6
  bab6: { from: 47, until: 55, name: "Bab 6" },
  ch6: { from: 47, until: 55, name: "Bab 6" },
  chapter6: { from: 47, until: 55, name: "Bab 6" },

  // Bab 7
  bab7: { from: 57, until: 64, name: "Bab 7" },
  ch7: { from: 57, until: 64, name: "Bab 7" },
  chapter7: { from: 57, until: 64, name: "Bab 7" },

  // Bab 8
  bab8: { from: 66, until: 75, name: "Bab 8" },
  ch8: { from: 66, until: 75, name: "Bab 8" },
  chapter8: { from: 66, until: 75, name: "Bab 8" },

  // Bab 9
  bab9: { from: 77, until: 86, name: "Bab 9" },
  ch9: { from: 77, until: 86, name: "Bab 9" },
  chapter9: { from: 77, until: 86, name: "Bab 9" },

  // Bab 10
  bab10: { from: 88, until: 95, name: "Bab 10" },
  ch10: { from: 88, until: 95, name: "Bab 10" },
  chapter10: { from: 88, until: 95, name: "Bab 10" },

  // Bab 11
  bab11: { from: 97, until: 105, name: "Bab 11" },
  ch11: { from: 97, until: 105, name: "Bab 11" },
  chapter11: { from: 97, until: 105, name: "Bab 11" },

  // Bab 12
  bab12: { from: 107, until: 115, name: "Bab 12" },
  ch12: { from: 107, until: 115, name: "Bab 12" },
  chapter12: { from: 107, until: 115, name: "Bab 12" },

  // Bab 13
  bab13: { from: 117, until: 124, name: "Bab 13" },
  ch13: { from: 117, until: 124, name: "Bab 13" },
  chapter13: { from: 117, until: 124, name: "Bab 13" },

  // Bab 14
  bab14: { from: 126, until: 132, name: "Bab 14" },
  ch14: { from: 126, until: 132, name: "Bab 14" },
  chapter14: { from: 126, until: 132, name: "Bab 14" },

  // Bab 15
  bab15: { from: 134, until: 136, name: "Bab 15" },
  ch15: { from: 134, until: 136, name: "Bab 15" },
  chapter15: { from: 134, until: 136, name: "Bab 15" },

  // Range bab
  "bab1-5": { from: 1, until: 45, name: "Bab 1-5" },
  "ch1-5": { from: 1, until: 45, name: "Bab 1-5" },
  "bab6-10": { from: 47, until: 95, name: "Bab 6-10" },
  "ch6-10": { from: 47, until: 95, name: "Bab 6-10" },
  "bab11-15": { from: 97, until: 136, name: "Bab 11-15" },
  "ch11-15": { from: 97, until: 136, name: "Bab 11-15" },

  // All bab
  all: { from: 1, until: 136, name: "Semua Bab" },
  semua: { from: 1, until: 136, name: "Semua Bab" },
  semuabab: { from: 1, until: 136, name: "Semua Bab" },
};

// Fungsi untuk parse input bab
const parseChapterInput = (chapterInput) => {
  if (!chapterInput) {
    return { from: 1, until: 136, name: "Semua Bab" };
  }

  const input = chapterInput.toLowerCase().trim();

  // Check exact mapping first
  if (QUEST_MAPPING[input]) {
    return QUEST_MAPPING[input];
  }

  // Check range input like "1-5" atau "bab1-bab5"
  const rangeMatch = input.match(/(?:bab|ch|chapter)?(\d+)-(?:bab|ch|chapter)?(\d+)/);
  if (rangeMatch) {
    const startCh = parseInt(rangeMatch[1]);
    const endCh = parseInt(rangeMatch[2]);

    if (startCh >= 1 && startCh <= 15 && endCh >= 1 && endCh <= 15 && startCh <= endCh) {
      const startKey = `bab${startCh}`;
      const endKey = `bab${endCh}`;

      if (QUEST_MAPPING[startKey] && QUEST_MAPPING[endKey]) {
        return {
          from: QUEST_MAPPING[startKey].from,
          until: QUEST_MAPPING[endKey].until,
          name: `Bab ${startCh}-${endCh}`,
        };
      }
    }
  }

  // Single number input
  const singleMatch = input.match(/(\d+)/);
  if (singleMatch) {
    const chNum = parseInt(singleMatch[1]);
    const chKey = `bab${chNum}`;

    if (QUEST_MAPPING[chKey]) {
      return QUEST_MAPPING[chKey];
    }
  }

  // If nothing matches, return default
  return { from: 1, until: 136, name: "Semua Bab" };
};

// Fungsi utama untuk hitung XP Main Quest (tanpa spam)
export const spamAdv = async (
  sock,
  chatId,
  msg,
  text,
) => {
  let browser = null;

  try {
    const lv_char = text.split(" ")[1];
    const exp_char = text.split(" ")[2] || "0";
    const lv_target = text.split(" ")[3];
    const fromQuest = text.split(" ")[4]
    const untilQuest = text.split(" ")[5]
    if (!lv_char || !lv_target) return await sock.sendMessage(chatId, { text: "Format salah. Gunakan .spamadv 277 0 315 bab14-15" }, { quoted: msg })
    // Validasi input
    lv_char = parseInt(lv_char);
    exp_char = parseInt(exp_char) || 0;
    lv_target = parseInt(lv_target);

    if (isNaN(lv_char) || isNaN(lv_target)) {
      throw new Error("Level harus berupa angka");
    }

    if (lv_char < 1 || lv_char > 300 || lv_target < 1 || lv_target > 300) {
      throw new Error("Level harus antara 1-300");
    }

    if (lv_char >= lv_target) {
      throw new Error("Level target harus lebih tinggi dari level sekarang");
    }

    // Parse quest range
    let questRange;

    if (fromQuest && untilQuest) {
      // Custom quest range dari user
      questRange = {
        from: parseInt(fromQuest),
        until: parseInt(untilQuest),
        name: `Quest ${fromQuest} - ${untilQuest}`,
      };
    } else if (fromQuest && !untilQuest) {
      // Kalau cuma from, bisa jadi chapter input atau quest ID
      questRange = parseChapterInput(fromQuest);
    } else {
      // Default semua quest
      questRange = { from: 1, until: 136, name: "Semua Bab" };
    }

    console.log("[SpamAdv] Quest Range:", questRange);
    console.log("[SpamAdv] Level:", lv_char, "->", lv_target, `(${exp_char}%)`);

    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(30000);

    // Navigate to Toram Tools XP calculator
    console.log("[SpamAdv] Opening Toram Tools...");
    await page.goto("https://toramtools.github.io/xp.html", {
      waitUntil: "networkidle2",
    });

    // Wait for form elements
    await page.waitForSelector("#level", { visible: true });
    console.log("[SpamAdv] Page loaded");

    // Fill in level information
    await page.type("#level", lv_char.toString(), { delay: 10 });
    await page.type("#level-percentage", exp_char.toString(), { delay: 10 });
    await page.type("#target-level", lv_target.toString(), { delay: 10 });

    console.log("[SpamAdv] Form filled");

    // Click Main Quest UI to ensure it's active
    await page.click("#mq-ui");
    await page.waitForTimeout(500);

    // Set quest range
    await page.select("#mq-from", questRange.from.toString());
    await page.select("#mq-until", questRange.until.toString());

    console.log("[SpamAdv] Quest range set");

    // Wait for calculations to update
    await page.waitForTimeout(2000);

    // Extract Main Quest results
    const results = await page.evaluate(() => {
      const xpRequired = document.querySelector("#xp-required");
      const mqXp = document.querySelector("#mq-xp");
      const mqEval = document.querySelector("#mq-eval");

      return {
        xpRequired: xpRequired?.textContent || "N/A",
        xpGained: mqXp?.textContent.replace("XP: ", "") || "N/A",
        finalLevel: mqEval?.textContent.replace(
          "After doing Main Quest's above range you'll reach ",
          ""
        ) || "N/A",
      };
    });

    console.log("[SpamAdv] Results extracted:", results);

    // Format response message
    const responseMessage = `
 *Main Quest Calculator - ${questRange.name}*

*Info Level:*
• Current: Level ${lv_char} (${exp_char}%)
• Target: Level ${lv_target}
• XP Required: ${results.xpRequired}

 *${questRange.name} Results:*
• Quest Range: ${questRange.from} - ${questRange.until}
• XP Gained: ${results.xpGained}
• Final Level: ${results.finalLevel}
		`.trim();

    // Send results
    if (sock && chatId) {
      await sock.sendMessage(chatId, { text: responseMessage }, { quoted: msg });
    }

    return {
      currentLevel: lv_char,
      currentPercent: exp_char,
      targetLevel: lv_target,
      questRange: questRange,
      xpRequired: results.xpRequired,
      xpGained: results.xpGained,
      finalLevel: results.finalLevel,
      message: responseMessage,
    };
  } catch (error) {
    console.error("[SpamAdv] Error:", error);

    const errorMsg = `❌ *Gagal menghitung Main Quest EXP*\n\n${error.message}`;

    if (sock && chatId) {
      await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("[SpamAdv] Browser closed");
    }
  }
};

// Function untuk spam Main Quest dengan Adventurer's Diaries
export const spamMainQuest = async (
  sock,
  chatId,
  msg,
  lv_char,
  exp_char,
  lv_target,
  fromQuest = null,
  untilQuest = null
) => {
  let browser = null;

  try {
    // Validasi input
    lv_char = parseInt(lv_char);
    exp_char = parseInt(exp_char) || 0;
    lv_target = parseInt(lv_target);

    if (isNaN(lv_char) || isNaN(lv_target)) {
      throw new Error("Level harus berupa angka");
    }

    if (lv_char >= lv_target) {
      throw new Error("Level target harus lebih tinggi dari level sekarang");
    }

    // Parse quest range
    let questRange;

    if (fromQuest && untilQuest) {
      questRange = {
        from: parseInt(fromQuest),
        until: parseInt(untilQuest),
        name: `Quest ${fromQuest} - ${untilQuest}`,
      };
    } else if (fromQuest && !untilQuest) {
      questRange = parseChapterInput(fromQuest);
    } else {
      questRange = { from: 1, until: 136, name: "Semua Bab" };
    }

    console.log("[SpamMQ] Quest Range:", questRange);

    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setDefaultTimeout(30000);

    console.log("[SpamMQ] Opening Toram Tools...");
    await page.goto("https://toramtools.github.io/xp.html", {
      waitUntil: "networkidle2",
    });

    await page.waitForSelector("#level", { visible: true });

    // Fill basic info
    await page.type("#level", lv_char.toString(), { delay: 10 });
    await page.type("#level-percentage", exp_char.toString(), { delay: 10 });
    await page.type("#target-level", lv_target.toString(), { delay: 10 });

    // Click Main Quest UI
    await page.click("#mq-ui");
    await page.waitForTimeout(500);

    // Set quest range
    await page.select("#mq-from", questRange.from.toString());
    await page.select("#mq-until", questRange.until.toString());

    console.log("[SpamMQ] Enabling spam mode...");

    // Enable spam mode (Adventurer's Diaries)
    await page.click("#multiple-mq");
    await page.waitForTimeout(3000);

    // Extract spam results table
    const spamResults = await page.evaluate(() => {
      const tableRows = document.querySelectorAll("#mq-table-row");
      const runs = [];

      tableRows.forEach((row) => {
        const cells = row.querySelectorAll("div");
        if (cells.length >= 3) {
          runs.push({
            run: cells[0].textContent.trim(),
            chapter: cells[1].textContent.trim(),
            level: cells[2].textContent.trim(),
          });
        }
      });

      return runs;
    });

    console.log("[SpamMQ] Extracted", spamResults.length, "runs");

    // Format spam results
    let message = ` *Main Quest Spam - ${questRange.name}*\n\n`;
    message += ` *Info:*\n`;
    message += `• Current: Level ${lv_char} (${exp_char}%)\n`;
    message += `• Target: Level ${lv_target}\n`;
    message += `• Quest Range: ${questRange.from} - ${questRange.until}\n\n`;
    message += ` *Spam Results:*\n`;

    if (spamResults.length === 0) {
      message += `Tidak ada hasil spam (mungkin sudah mencapai target level)`;
    } else {
      // Tampilkan maksimal 15 runs
      spamResults.slice(0, 15).forEach((run, index) => {
        message += `Run ${run.run}: ${run.level}\n`;
      });

      if (spamResults.length > 15) {
        message += `\n... dan ${spamResults.length - 15} run lainnya`;
      }

      message += `\n\n✅ Total: ${spamResults.length} runs`;
    }

    if (sock && chatId) {
      await sock.sendMessage(chatId, { text: message }, { quoted: msg });
    }

    return {
      questRange,
      runs: spamResults,
      totalRuns: spamResults.length,
    };
  } catch (error) {
    console.error("[SpamMQ] Error:", error);

    const errorMsg = ` *Gagal menghitung Main Quest Spam*\n\n${error.message}`;

    if (sock && chatId) {
      await sock.sendMessage(chatId, { text: errorMsg }, { quoted: msg });
    }

    throw error;
  } finally {
    if (browser) {
      await browser.close();
      console.log("[SpamMQ] Browser closed");
    }
  }
};

// Helper function untuk show usage examples
export const showUsageExamples = async (sock, chatId, msg) => {
  const message = `
 *Toram Main Quest Calculator*

 *Contoh Penggunaan (Bab):*
• \`.mqcalc 200 50 250 bab5\`
• \`.mqcalc 200 50 250 bab1-10\`
• \`.mqcalc 200 50 250 semua\`

 *Contoh Penggunaan (Quest ID):*
• \`.mqcalc 200 50 250 1 45\`
• \`.mqcalc 200 50 250 77 86\`

 *Spam Mode (Adventurer's Diaries):*
• \`.mqspam 200 50 300 bab11-15\`
• \`.mqspam 200 50 300 100 136\`

 *Available Bab:*
• BAB 1 (1-9), BAB 2 (11-18), BAB 3 (20-27)
• BAB 4 (29-36), BAB 5 (38-45), BAB 6 (47-55)
• BAB 7 (57-64), BAB 8 (66-75), BAB 9 (77-86)
• BAB 10 (88-95), BAB 11 (97-105), BAB 12 (107-115)
• BAB 13 (117-124), BAB 14 (126-132), BAB 15 (134-136)

 *Format Input Fleksibel:*
• "bab5", "ch5", "5" → Bab 5
• "bab1-5", "1-5" → Bab 1 sampai 5
• "semua", "all" → Semua bab (1-136)
	`.trim();

  if (sock && chatId) {
    await sock.sendMessage(chatId, { text: message }, { quoted: msg });
  }

  return message;
};

export default { spamAdv, spamMainQuest, showUsageExamples };
