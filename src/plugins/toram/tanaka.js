import axios from "axios";
import * as cheerio from "cheerio";
import { URLSearchParams } from "url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline";

// Enable stealth plugin
puppeteer.use(StealthPlugin());

// --- CONFIGURATION - OPTIMIZED ---
const CONFIG = {
  MAX_RETRIES: 2,
  DEFAULT_TIMEOUT: 90000,
  CHECK_INTERVAL: 1000,
  DEFAULT_LEVEL: 280,
  DEFAULT_POTENTIAL: 110,
  BASE_URL: "https://tanaka0.work/id/BouguProper",
  NAVIGATION_TIMEOUT: 20000,
  SELECTOR_TIMEOUT: 5000,
  MAX_CAPTCHA_WAIT: 20,
};

// --- STAT MAP dengan ALIAS ---
const statMap = {
  // Critical Stats
  critdmg: "Critical Damage", cd: "Critical Damage", "critdmg%": "Critical Damage %", "cd%": "Critical Damage %",
  critrate: "Critical Rate", cr: "Critical Rate", "critrate%": "Critical Rate %", "cr%": "Critical Rate %",
  // Attack Stats
  atk: "ATK", "atk%": "ATK %", matk: "MATK", "matk%": "MATK %",
  // Defense Stats
  def: "DEF", "def%": "DEF %", mdef: "MDEF", "mdef%": "MDEF %",
  // Accuracy Stats
  acc: "Accuracy", accuracy: "Accuracy", "acc%": "Accuracy %", "accuracy%": "Accuracy %",
  // HP/MP Stats
  hp: "MaxHP", "hp%": "MaxHP %", mp: "MaxMP", "mp%": "MaxMP %",
  // Status Stats
  str: "STR", "str%": "STR %", int: "INT", "int%": "INT %", vit: "VIT", "vit%": "VIT %",
  agi: "AGI", "agi%": "AGI %", dex: "DEX", "dex%": "DEX %",
  // Speed Stats
  aspd: "Kecepatan Serangan", "aspd%": "Kecepatan Serangan %", cspd: "Kecepatan Merapal", "cspd%": "Kecepatan Merapal %",
  // Dodge Stats
  dodge: "Dodge", "dodge%": "Dodge %",
  // Regen Stats
  hpreg: "Natural HP Regen", "hpreg%": "Natural HP Regen %", mpreg: "Natural MP Regen", "mpreg%": "Natural MP Regen %",
  // Special Stats
  stab: "Stability %", "stab%": "Stability %",
  penfis: "Penetrasi Fisik %", "penfis%": "Penetrasi Fisik %",
  penmag: "Magic Pierce %", "penmag%": "Magic Pierce %",
  kebalfis: "Kekebalan Fisik %", "kebalfis%": "Kekebalan Fisik %",
  kebalmag: "Kekebalan Sihir %", "kebalmag%": "Kekebalan Sihir %",
  aggro: "Aggro %", "aggro%": "Aggro %",
  // Element damage
  "dteearth%": "% luka ke Bumi", dteearth: "% luka ke Bumi",
  "dtefire%": "% luka ke Api", dtefire: "% luka ke Api",
  "dtewind%": "% luka ke Angin", dtewind: "% luka ke Angin",
  "dtewater%": "% luka ke Air", dtewater: "% luka ke Air",
  "dtelight%": "% luka ke Cahaya", dtelight: "% luka ke Cahaya",
  "dtedark%": "% luka ke Gelap", dtedark: "% luka ke Gelap",
};

// --- ENHANCEMENT INFO DATA ---
const enhancementInfo = {
  "Critical Damage": { maxLevel: 22, potentialCost: 3, category: "Critical", returnValue: 19 },
  "Critical Damage %": { maxLevel: 11, potentialCost: 10, category: "Critical", returnValue: 32 },
  ATK: { maxLevel: 28, potentialCost: 6, category: "Attack", returnValue: 43 },
  "ATK %": { maxLevel: 14, potentialCost: 20, category: "Attack", returnValue: 73 },
  MATK: { maxLevel: 28, potentialCost: 6, category: "Attack", returnValue: 43 },
  "MATK %": { maxLevel: 14, potentialCost: 20, category: "Attack", returnValue: 73 },
  DEF: { maxLevel: 28, potentialCost: 3, category: "Defense", returnValue: 21 },
  "DEF %": { maxLevel: 12, potentialCost: 10, category: "Defense", returnValue: 33 },
  MDEF: { maxLevel: 28, potentialCost: 3, category: "Defense", returnValue: 21 },
  "MDEF %": { maxLevel: 12, potentialCost: 10, category: "Defense", returnValue: 33 },
  Accuracy: { maxLevel: 15, potentialCost: 20, category: "Accuracy", returnValue: 76 },
  "Accuracy %": { maxLevel: 6, potentialCost: 40, category: "Accuracy", returnValue: 67 },
};

// --- UTILITY FUNCTIONS ---
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function waitForEnter(message = "Press Enter to continue...") {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (ans) => { rl.close(); resolve(ans); });
  });
}

async function withRetry(fn, retries = CONFIG.MAX_RETRIES, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try { return await fn(); }
    catch (error) {
      console.log(`❗ Percobaan ${i + 1} gagal:`, error.message);
      if (i === retries - 1) throw error;
      await sleep(delay);
      delay *= 1.5;
    }
  }
}

// --- COMMAND PARSING (UPDATED: Added BS Level Parsing) ---
function parseCommand(args) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: CONFIG.DEFAULT_LEVEL,
    startingPotential: CONFIG.DEFAULT_POTENTIAL,
    professionLevel: 0, // Default BS Level
  };

  const fullCommand = args.join(" ").toLowerCase();

  // Extract character level
  const levelMatch = fullCommand.match(/lv\s*[:=]?\s*(\d+)/i);
  if (levelMatch) {
    const level = parseInt(levelMatch[1], 10);
    if (!isNaN(level) && level >= 1 && level <= 500) config.characterLevel = level;
  }

  // Extract potential
  const potMatch = fullCommand.match(/pot\s*[:=]?\s*(\d+)/i);
  if (potMatch) {
    const potential = parseInt(potMatch[1], 10);
    if (!isNaN(potential) && potential >= 0 && potential <= 200) config.startingPotential = potential;
  }

  // --- [NEW] Extract Profession Level (Format: bs300, prof300) ---
  const profMatch = fullCommand.match(/(?:bs|prof|prof\s*[:=]?\s*bs)\s*[:=]?\s*(\d+)/i);
  if (profMatch) {
    const profLvl = parseInt(profMatch[1], 10);
    if (!isNaN(profLvl)) {
      config.professionLevel = profLvl;
      console.log(`✓ Profession Level (BS) set: ${config.professionLevel}`);
    }
  }

  const statParts = fullCommand.split(',').map(s => s.trim());

  for (const part of statParts) {
    if (!part || /^(lv|pot|prof|bs)/i.test(part)) continue;

    const match = part.match(/^([a-z%]+)\s*[:=]\s*(.+)$/i) || part.match(/^([a-z%]+)\s+(.+)$/i);
    if (!match) continue;

    const [, statKey, valueStr] = match;
    const value = valueStr.trim();
    const fullName = statMap[statKey];

    if (!fullName) {
      console.warn(`⚠️ Stat tidak dikenal: ${statKey}, diabaikan`);
      continue;
    }

    const isNegative = value === 'min';
    const isPositive = value === 'max';
    let level;

    if (isPositive || isNegative) {
      level = 'MAX';
    } else {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        console.warn(`⚠️ Level tidak valid untuk ${statKey}: ${value}, diabaikan`);
        continue;
      }
      level = numValue.toString();
    }

    const statObject = { name: fullName, level };

    if (isNegative) {
      if (config.negativeStats.length < 7) {
        config.negativeStats.push(statObject);
        console.log(`✓ Negative stat ditambahkan: ${fullName} ${level}`);
      }
    } else {
      if (config.positiveStats.length < 7) {
        config.positiveStats.push(statObject);
        console.log(`✓ Positive stat ditambahkan: ${fullName} ${level}`);
      }
    }
  }

  console.log(`\n📊 Konfigurasi Final:`);
  console.log(`- Character Level: ${config.characterLevel}`);
  console.log(`- Starting Potential: ${config.startingPotential}`);
  console.log(`- BS Profession Level: ${config.professionLevel}`);
  console.log(`- Positive Stats (${config.positiveStats.length}/7)`);
  console.log(`- Negative Stats (${config.negativeStats.length}/7)`);

  return config;
}

// --- OPTIMIZED CAPTCHA HANDLING ---
async function handleCaptcha(page) {
  try {
    console.log("🔍 Menganalisis CAPTCHA...");
    for (let i = 0; i < CONFIG.MAX_CAPTCHA_WAIT; i++) {
      await sleep(1000);
      const captchaGone = await page.evaluate(() => {
        const captchaElements = document.querySelectorAll('[id*="captcha"], [class*="captcha"], .captcha');
        const pageText = document.body.innerText.toLowerCase();
        return (
          captchaElements.length === 0 ||
          Array.from(captchaElements).every((el) => el.style.display === "none") ||
          (!pageText.includes("captcha") && !pageText.includes("verify"))
        );
      });

      if (captchaGone) {
        console.log("✅ CAPTCHA hilang otomatis!");
        return { solved: true, method: "auto-disappeared" };
      }
      process.stdout.write(`\r🔒 Menunggu CAPTCHA ${i + 1}/${CONFIG.MAX_CAPTCHA_WAIT}...`);
    }

    console.log("\n🖱️ Mencoba penyelesaian otomatis...");
    const clickResult = await page.evaluate(() => {
      const selectors = ['input[type="checkbox"]', 'button[type="submit"]', ".recaptcha-checkbox", '[role="checkbox"]'];
      for (let selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (let element of elements) {
            element.click();
            return { clicked: true, type: selector };
          }
        } catch (e) { continue; }
      }
      return { clicked: false };
    });

    if (clickResult.clicked) {
      await sleep(3000);
      return { solved: true, method: "auto-click" };
    }
    return { solved: false, requiresManual: true };
  } catch (error) {
    return { solved: false, error: error.message };
  }
}

// --- OPTIMIZED AUTO WAIT FOR RESULTS ---
async function autoWaitForResults(page, maxWaitTime, checkInterval) {
  console.log("🤖 Memulai pemantauan otomatis...");
  const startTime = Date.now();
  let consecutiveResults = 0;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const pageState = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        return {
          hasCaptcha: pageText.includes("captcha") || pageText.includes("verify") || pageText.includes("robot"),
          hasResults: pageText.includes("success rate") && pageText.includes("statting of armor"),
          hasError: pageText.includes("error") || pageText.includes("failed") || pageText.includes("timeout"),
          isLoading: pageText.includes("loading") || pageText.includes("processing"),
        };
      });

      if (pageState.hasCaptcha) {
        console.log("🔒 CAPTCHA terdeteksi!");
        await handleCaptcha(page);
      }

      if (pageState.hasResults) {
        consecutiveResults++;
        if (consecutiveResults >= 2) {
          console.log("🎯 Hasil stabil ditemukan! Memulai parsing...");
          await sleep(500);
          return await parseAllResults(page);
        }
      } else {
        consecutiveResults = 0;
      }

      if (pageState.hasError) {
        return { error: "Terjadi error pada website", hasValidResult: false };
      }

      process.stdout.write(`\r🔄 Menunggu hasil... ${Math.round((Date.now() - startTime) / 1000)}s`);
      await sleep(checkInterval);
    } catch (error) { await sleep(checkInterval); }
  }
  return await parseAllResults(page);
}

// --- OPTIMIZED RESULT PARSING ---
async function parseAllResults(page) {
  console.log("\n📊 Parsing hasil dari halaman...");
  const allData = await page.evaluate(() => {
    const divs = document.querySelectorAll("div");
    const resultDivs = [];
    Array.from(divs).forEach((div, index) => {
      const text = div.innerText?.trim() || "";
      if (text.length > 20) {
        resultDivs.push({
          text,
          hasSuccessRate: text.includes("Success Rate"),
          hasStatting: text.includes("Statting of Armor"),
          isCostInfo: text.includes("Mat cost") || text.includes("Medicine"),
        });
      }
    });
    return { resultDivs };
  });

  const result = {
    finalStat: "Tidak ditemukan", successRate: "Tidak ditemukan", successRateValue: null,
    startingPot: "Tidak ditemukan", steps: [], materialCost: "Tidak ditemukan",
    materialDetails: {}, highestStepCost: "Tidak ditemukan", warnings: [],
    timestamp: new Date().toISOString(), totalSteps: 0, hasValidResult: false,
  };

  allData.resultDivs.forEach((div) => {
    const text = div.text;
    if (div.hasSuccessRate) {
      const match = text.match(/Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i);
      if (match) {
        result.successRateValue = parseFloat(match[1]);
        result.successRate = `Success Rate: ${result.successRateValue}%`;
      }
      const potMatch = text.match(/Starting\s+Pot[：:]\s*(\d+)\s*pt/i);
      if (potMatch) result.startingPot = `Starting Pot: ${potMatch[1]}pt`;

      const steps = text.split('\n').filter((l) => /^\d+\.\s/.test(l));
      if (steps.length > 0) result.steps = steps;
    }
    if (div.isCostInfo) {
      const matMatch = text.match(/Mat cost[^\n]*/i);
      if (matMatch) result.materialCost = matMatch[0];
    }
  });

  result.totalSteps = result.steps.length;
  result.hasValidResult = result.successRateValue !== null;
  return result;
}

// --- MAIN SCRAPER FUNCTION (UPDATED) ---
async function tanaka(statConfigOrSocket, jidOrOptions = {}, additionalOptions = {}) {
  let sock, jid, statConfig, options;

  if (statConfigOrSocket && typeof statConfigOrSocket.sendMessage === "function") {
    sock = statConfigOrSocket; jid = jidOrOptions; options = additionalOptions;
    statConfig = { positiveStats: [], negativeStats: [], characterLevel: CONFIG.DEFAULT_LEVEL, startingPotential: CONFIG.DEFAULT_POTENTIAL, professionLevel: 0 };
  } else {
    statConfig = statConfigOrSocket; options = jidOrOptions;
  }

  const { maxWaitTime = CONFIG.DEFAULT_TIMEOUT, checkInterval = CONFIG.CHECK_INTERVAL, enableRetry = true } = options || {};
  const startTime = Date.now();

  const scraperFunction = async () => {
    let browser;
    try {
      console.log("🚀 Meluncurkan peramban...");
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) req.abort();
        else req.continue();
      });

      console.log(`📂 Membuka ${CONFIG.BASE_URL}...`);
      await page.goto(CONFIG.BASE_URL, { waitUntil: "domcontentloaded", timeout: CONFIG.NAVIGATION_TIMEOUT });

      // --- [NEW] STEP: KLIK TOMBOL RELOAD UNTUK RESET ---
      console.log("🔄 Mencoba klik tombol Reload...");
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("input[type='button'], button"));
        // Cari tombol dengan value atau text "Reload"
        const reloadBtn = buttons.find(b =>
          (b.value && b.value.toLowerCase() === 'reload') ||
          (b.innerText && b.innerText.toLowerCase() === 'reload')
        );
        if (reloadBtn) {
          reloadBtn.click();
          console.log("Tombol Reload diklik.");
        }
      });
      await sleep(1500); // Tunggu refresh form

      console.log("📝 Mengisi formulir...");
      await page.waitForSelector("#paramLevel", { timeout: CONFIG.SELECTOR_TIMEOUT });

      const { positiveStats, negativeStats, startingPotential, characterLevel, professionLevel } = statConfig;

      // --- [UPDATED] FORM FILLING (Include Jukurendo & Events) ---
      await page.evaluate(
        ({ level, positive, negative, pot, profLvl }) => {
          // Helper untuk set value DAN trigger event 'change'
          const setVal = (sel, val) => {
            const el = document.querySelector(sel);
            if (el) {
              el.value = String(val);
              el.dispatchEvent(new Event('change', { bubbles: true })); // PENTING agar website hitung ulang
            }
          };

          // 1. Character Level
          setVal("#paramLevel", level);

          // 2. Starting Potential
          setVal("#shokiSenzai", pot);

          // 3. [NEW] Smith Proficiency (#jukurendo)
          setVal("#jukurendo", profLvl);

          // 4. Positive Stats
          for (let i = 0; i < 7; i++) {
            const stat = positive[i];
            if (stat) {
              setVal(`#plus_name_${i}`, stat.name);
              setVal(`#plus_value_${i}`, stat.level);
            }
          }

          // 5. Negative Stats
          for (let i = 0; i < 7; i++) {
            const stat = negative[i];
            if (stat) {
              setVal(`#minus_name_${i}`, stat.name);
              setVal(`#minus_value_${i}`, stat.level);
            }
          }
        },
        {
          level: characterLevel,
          positive: positiveStats,
          negative: negativeStats,
          pot: startingPotential,
          profLvl: professionLevel || 0,
        }
      );

      console.log("📤 Mengirim formulir...");
      await page.click("#sendData");

      const result = await autoWaitForResults(page, maxWaitTime, checkInterval);
      result.duration = Date.now() - startTime;
      result.professionLevel = professionLevel;

      if (sock && jid && result.hasValidResult) {
        try {
          const message = formatResultMessage(result);
          await sock.sendMessage(jid, { text: message });
          console.log("✅ Hasil dikirim via WhatsApp");
        } catch (sendError) { console.log("Gagal kirim WA:", sendError.message); }
      }
      return result;
    } finally {
      if (browser) await browser.close();
    }
  };

  try {
    if (enableRetry) return await withRetry(scraperFunction);
    return await scraperFunction();
  } catch (error) {
    if (error.message === "CAPTCHA_MANUAL_REQUIRED") return await tanakaManual(sock, jid, statConfig, options);
    return { error: error.message, hasValidResult: false };
  }
}

// --- MESSAGE FORMATTING ---
function formatResultMessage(result) {
  if (result.error) return `*Error Tanaka Scraper:*\n${result.error}`;
  if (!result.hasValidResult) return `*Tanaka Scraper:*\nHasil tidak lengkap atau gagal memuat.`;

  let message = `*Hasil Tanaka*\n\n`;
  message += `*Success Rate:* ${result.successRateValue}%\n`;
  message += `*Starting Pot:* ${result.startingPot}\n`;

  if (result.professionLevel && result.professionLevel > 0) {
    message += `*BS Prof:* Lv.${result.professionLevel}\n`;
  }

  message += `*Total Steps:* ${result.totalSteps}\n`;
  if (result.materialCost) message += `*Material Cost:* ${result.materialCost}\n`;
  if (result.steps.length > 0) {
    message += `\n*Langkah Enhancement:*\n`;
    const steps = result.steps.length > 20 ? result.steps.slice(0, 20).concat(["..."]) : result.steps;
    message += steps.join("\n");
  }
  return message;
}

// --- MANUAL MODE (UPDATED) ---
async function tanakaManual(sock, jid, statConfig = null, options = {}) {
  const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  try {
    await page.goto(CONFIG.BASE_URL, { waitUntil: "domcontentloaded" });
    if (statConfig) {
      console.log("📝 Mengisi formulir...");
      await page.evaluate(({ level, positive, negative, pot, profLvl }) => {
        // [NEW] Reload first
        const btns = Array.from(document.querySelectorAll("input[type='button']"));
        const rBtn = btns.find(b => b.value === 'Reload');
        if (rBtn) rBtn.click();

        setTimeout(() => {
          const setVal = (s, v) => { const el = document.querySelector(s); if (el) { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); } };
          setVal("#paramLevel", level);
          setVal("#shokiSenzai", pot);
          setVal("#jukurendo", profLvl); // [NEW] BS Prof
          positive.forEach((s, i) => { setVal(`#plus_name_${i}`, s.name); setVal(`#plus_value_${i}`, s.level); });
          negative.forEach((s, i) => { setVal(`#minus_name_${i}`, s.name); setVal(`#minus_value_${i}`, s.level); });
        }, 1000);
      }, {
        level: statConfig.characterLevel, positive: statConfig.positiveStats, negative: statConfig.negativeStats,
        pot: statConfig.startingPotential, profLvl: statConfig.professionLevel
      });
    }
    await waitForEnter();
    const result = await parseAllResults(page);
    if (sock && jid) await sock.sendMessage(jid, { text: formatResultMessage(result) });
    return result;
  } finally { await browser.close(); }
}

// --- EXPORTS ---
export { tanaka, tanakaManual, tanakaSmart, parseCommand, parseAllResults, formatResultMessage, getAvailableStats, validateStatConfig, createExampleConfigs, statMap, CONFIG, enhancementInfo };
export default { tanaka, tanakaManual, tanakaSmart, parseCommand, parseAllResults, formatResultMessage, getAvailableStats, validateStatConfig, createExampleConfigs, statMap, CONFIG, enhancementInfo };
