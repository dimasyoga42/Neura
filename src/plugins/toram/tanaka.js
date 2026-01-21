import axios from "axios";
import * as cheerio from "cheerio";
import { URLSearchParams } from "url";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import readline from "readline";

// Enable stealth plugin
puppeteer.use(StealthPlugin());

// --- CONFIGURATION ---
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

  // Accuracy & Dodge
  acc: "Accuracy", accuracy: "Accuracy", "acc%": "Accuracy %", "accuracy%": "Accuracy %",
  dodge: "Dodge", "dodge%": "Dodge %",

  // HP/MP
  hp: "MaxHP", "hp%": "MaxHP %", mp: "MaxMP", "mp%": "MaxMP %",

  // Status
  str: "STR", "str%": "STR %", int: "INT", "int%": "INT %", vit: "VIT", "vit%": "VIT %",
  agi: "AGI", "agi%": "AGI %", dex: "DEX", "dex%": "DEX %",

  // Speed
  aspd: "Kecepatan Serangan", "aspd%": "Kecepatan Serangan %", cspd: "Kecepatan Merapal", "cspd%": "Kecepatan Merapal %",

  // Regen
  hpreg: "Natural HP Regen", "hpreg%": "Natural HP Regen %", mpreg: "Natural MP Regen", "mpreg%": "Natural MP Regen %",

  // Special
  stab: "Stability %", "stab%": "Stability %",
  penfis: "Penetrasi Fisik %", "penfis%": "Penetrasi Fisik %",
  penmag: "Magic Pierce %", "penmag%": "Magic Pierce %",
  kebalfis: "Kekebalan Fisik %", "kebalfis%": "Kekebalan Fisik %",
  kebalmag: "Kekebalan Sihir %", "kebalmag%": "Kekebalan Sihir %",
  aggro: "Aggro %", "aggro%": "Aggro %",

  // Element Damage (DTE)
  dteearth: "% luka ke Bumi", "dteearth%": "% luka ke Bumi",
  dtefire: "% luka ke Api", "dtefire%": "% luka ke Api",
  dtewind: "% luka ke Angin", "dtewind%": "% luka ke Angin",
  dtewater: "% luka ke Air", "dtewater%": "% luka ke Air",
  dtelight: "% luka ke Cahaya", "dtelight%": "% luka ke Cahaya",
  dtedark: "% luka ke Gelap", "dtedark%": "% luka ke Gelap",
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

// --- COMMAND PARSING (FIXED FOR BS LEVEL) ---
function parseCommand(args) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: CONFIG.DEFAULT_LEVEL,
    startingPotential: CONFIG.DEFAULT_POTENTIAL,
    professionLevel: 0, // Default 0
  };

  const fullCommand = args.join(" ").toLowerCase();

  // 1. Extract character level (lv270)
  const levelMatch = fullCommand.match(/lv\s*[:=]?\s*(\d+)/i);
  if (levelMatch) {
    const level = parseInt(levelMatch[1], 10);
    if (!isNaN(level) && level >= 1 && level <= 500) config.characterLevel = level;
  }

  // 2. Extract potential (pot 67)
  const potMatch = fullCommand.match(/pot\s*[:=]?\s*(\d+)/i);
  if (potMatch) {
    const potential = parseInt(potMatch[1], 10);
    if (!isNaN(potential) && potential >= 0 && potential <= 200) config.startingPotential = potential;
  }

  // 3. Extract Profession Level (bs300, prof300, prof:bs:300)
  // Regex ini menangkap "bs300", "bs 300", "prof 300"
  const profMatch = fullCommand.match(/(?:bs|prof|prof\s*[:=]?\s*bs)\s*[:=]?\s*(\d+)/i);
  if (profMatch) {
    const profLevel = parseInt(profMatch[1], 10);
    if (!isNaN(profLevel) && profLevel >= 0 && profLevel <= 300) {
      config.professionLevel = profLevel;
      console.log(`✓ Profession Level detected: ${config.professionLevel}`);
    }
  }

  // 4. Extract Stats
  const statParts = fullCommand.split(',').map(s => s.trim());

  for (const part of statParts) {
    // Skip command keywords agar tidak dianggap sebagai stat
    if (!part || /^(lv|pot|prof|bs)/i.test(part)) continue;

    const match = part.match(/^([a-z%]+)\s*[:=]\s*(.+)$/i) || part.match(/^([a-z%]+)\s+(.+)$/i);
    if (!match) continue;

    const [, statKey, valueStr] = match;
    const fullName = statMap[statKey.toLowerCase()];

    if (!fullName) {
      // console.warn(`⚠️ Stat tidak dikenal: ${statKey}, diabaikan`);
      continue;
    }

    const value = valueStr.toLowerCase().trim();
    const isNegative = value === 'min';
    const isPositive = value === 'max';

    let level;
    if (isPositive || isNegative) {
      level = 'MAX';
    } else {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) continue;
      level = numValue.toString();
    }

    const statObject = { name: fullName, level };

    if (isNegative) {
      if (config.negativeStats.length < 7) {
        config.negativeStats.push(statObject);
      }
    } else {
      if (config.positiveStats.length < 7) {
        config.positiveStats.push(statObject);
      }
    }
  }

  // Summary Log
  console.log(`\n📊 Konfigurasi Final:`);
  console.log(`- Level: ${config.characterLevel}`);
  console.log(`- Pot: ${config.startingPotential}`);
  console.log(`- BS Level: ${config.professionLevel}`);
  console.log(`- Pos (${config.positiveStats.length}): ${config.positiveStats.map(s => s.name).join(", ")}`);
  console.log(`- Neg (${config.negativeStats.length}): ${config.negativeStats.map(s => s.name).join(", ")}`);

  return config;
}

// --- CAPTCHA HANDLING ---
async function handleCaptcha(page) {
  try {
    console.log("🔍 Menganalisis CAPTCHA...");
    for (let i = 0; i < CONFIG.MAX_CAPTCHA_WAIT; i++) {
      await sleep(1000);
      const captchaGone = await page.evaluate(() => {
        const elements = document.querySelectorAll('[id*="captcha"], [class*="captcha"], .captcha');
        const pageText = document.body.innerText.toLowerCase();
        return elements.length === 0 || Array.from(elements).every((el) => el.style.display === "none") || (!pageText.includes("captcha") && !pageText.includes("verify"));
      });

      if (captchaGone) {
        console.log("✅ CAPTCHA aman.");
        return { solved: true, method: "auto-disappeared" };
      }
      process.stdout.write(`\r🔒 Menunggu CAPTCHA ${i + 1}/${CONFIG.MAX_CAPTCHA_WAIT}...`);
    }

    // Attempt Auto Click
    console.log("\n🖱️ Mencoba auto-click checkbox...");
    const clickResult = await page.evaluate(() => {
      const selectors = ['input[type="checkbox"]', '.recaptcha-checkbox', '[role="checkbox"]'];
      for (let s of selectors) {
        const el = document.querySelector(s);
        if (el) { el.click(); return true; }
      }
      return false;
    });

    if (clickResult) {
      await sleep(3000);
      return { solved: true, method: "auto-click" };
    }

    return { solved: false, requiresManual: true };
  } catch (error) {
    return { solved: false, error: error.message };
  }
}

// --- AUTO WAIT ---
async function autoWaitForResults(page, maxWaitTime, checkInterval) {
  console.log("🤖 Memantau hasil...");
  const startTime = Date.now();
  let consecutiveResults = 0;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const pageState = await page.evaluate(() => {
        const text = document.body.innerText.toLowerCase();
        return {
          hasResults: text.includes("success rate") && text.includes("statting of armor"),
          hasError: text.includes("error") || text.includes("failed"),
          isLoading: text.includes("processing")
        };
      });

      if (pageState.hasResults) {
        consecutiveResults++;
        if (consecutiveResults >= 2) {
          console.log("🎯 Hasil ditemukan!");
          await sleep(500);
          return await parseAllResults(page);
        }
      } else {
        consecutiveResults = 0;
      }

      if (pageState.hasError) return { error: "Website Error", hasValidResult: false };

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      process.stdout.write(`\r⏳ Menunggu... ${elapsed}s`);
      await sleep(checkInterval);
    } catch (e) {
      console.log("Error monitoring:", e.message);
      await sleep(checkInterval);
    }
  }
  return await parseAllResults(page);
}

// --- RESULT PARSING ---
async function parseAllResults(page) {
  console.log("\n📊 Parsing data...");

  const data = await page.evaluate(() => {
    const bodyText = document.body.innerText;
    const divs = Array.from(document.querySelectorAll("div"));

    // Helper to find text
    const findLine = (term) => {
      const lines = bodyText.split('\n');
      return lines.find(l => l.includes(term)) || "";
    };

    const successMatch = bodyText.match(/Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i);
    const potMatch = bodyText.match(/Starting\s+Pot[：:]\s*(\d+)\s*pt/i);
    const matCostMatch = bodyText.match(/Mat cost[^\n]*/i); // Capture line with Mat cost

    // Parse steps
    const stepLines = bodyText.split('\n').filter(l => /^\d+\.\s/.test(l));

    return {
      successRateValue: successMatch ? parseFloat(successMatch[1]) : null,
      successRateText: successMatch ? successMatch[0] : "Tidak ditemukan",
      startingPot: potMatch ? potMatch[1] : null,
      materialCost: matCostMatch ? matCostMatch[0] : "Tidak ditemukan",
      steps: stepLines,
      fullText: bodyText.substring(0, 500) // debug
    };
  });

  return {
    ...data,
    hasValidResult: data.successRateValue !== null,
    timestamp: new Date().toISOString()
  };
}

// --- MAIN SCRAPER FUNCTION ---
async function tanaka(statConfigOrSocket, jidOrOptions = {}, additionalOptions = {}) {
  let sock, jid, statConfig, options;

  if (statConfigOrSocket && typeof statConfigOrSocket.sendMessage === "function") {
    sock = statConfigOrSocket;
    jid = jidOrOptions;
    options = additionalOptions;
    // Default dummy config if used directly via WA message logic handling outside
    statConfig = {
      positiveStats: [], negativeStats: [],
      characterLevel: CONFIG.DEFAULT_LEVEL, startingPotential: CONFIG.DEFAULT_POTENTIAL,
      professionLevel: 0
    };
  } else {
    statConfig = statConfigOrSocket;
    options = jidOrOptions;
  }

  const { maxWaitTime = CONFIG.DEFAULT_TIMEOUT, checkInterval = CONFIG.CHECK_INTERVAL, enableRetry = true } = options || {};
  const startTime = Date.now();

  const scraperFunction = async () => {
    let browser;
    try {
      console.log("🚀 Meluncurkan browser...");
      browser = await puppeteer.launch({
        headless: true, // Set false untuk debug visual
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      // Block images/fonts for speed
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) req.abort();
        else req.continue();
      });

      console.log(`📂 Membuka ${CONFIG.BASE_URL}...`);
      await page.goto(CONFIG.BASE_URL, { waitUntil: "domcontentloaded", timeout: CONFIG.NAVIGATION_TIMEOUT });

      console.log("📝 Mengisi formulir...");
      // Tunggu elemen kunci
      await page.waitForSelector("#paramLevel", { timeout: CONFIG.SELECTOR_TIMEOUT });

      const { positiveStats, negativeStats, startingPotential, characterLevel, professionLevel } = statConfig;

      // --- PENGISIAN FORM (DIPERBARUI UNTUK BS LEVEL) ---
      await page.evaluate(({ level, positive, negative, pot, prof }) => {

        // Helper untuk set value dan trigger event
        const setVal = (selector, val) => {
          const el = document.querySelector(selector);
          if (el) {
            el.value = String(val);
            // Dispatch 'change' event agar website merespons (penting untuk Tanaka)
            el.dispatchEvent(new Event('change', { bubbles: true }));
          }
        };

        // 1. Level Karakter
        setVal("#paramLevel", level);

        // 2. Starting Potential
        setVal("#shokiSenzai", pot);

        // 3. Smith Proficiency (ID: jukurendo)
        // Jika user tidak input bs300, prof akan 0
        setVal("#jukurendo", prof);

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

      }, {
        level: characterLevel,
        positive: positiveStats,
        negative: negativeStats,
        pot: startingPotential,
        prof: professionLevel || 0
      });

      console.log("📤 Mengirim data...");
      await page.click("#sendData"); // ID tombol send

      const result = await autoWaitForResults(page, maxWaitTime, checkInterval);

      result.duration = Date.now() - startTime;
      result.professionLevel = professionLevel; // Tambahkan info prof ke hasil

      // Kirim ke WA jika ada socket
      if (sock && jid && result.hasValidResult) {
        try {
          const msg = formatResultMessage(result);
          await sock.sendMessage(jid, { text: msg });
          console.log("✅ Pesan terkirim.");
        } catch (e) { console.log("Gagal kirim WA:", e.message); }
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
    console.error("❌ Fatal Error:", error.message);
    if (error.message === "CAPTCHA_MANUAL_REQUIRED") {
      return await tanakaManual(sock, jid, statConfig, options);
    }
    return { error: error.message, hasValidResult: false };
  }
}

// --- MANUAL MODE ---
async function tanakaManual(sock, jid, statConfig = null, options = {}) {
  console.log("🔧 Mode Manual diaktifkan");
  const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"] });
  const page = await browser.newPage();

  try {
    await page.goto(CONFIG.BASE_URL, { waitUntil: "domcontentloaded" });

    if (statConfig) {
      // Gunakan logika pengisian yang sama
      await page.evaluate(({ level, positive, negative, pot, prof }) => {
        const setVal = (selector, val) => {
          const el = document.querySelector(selector);
          if (el) { el.value = String(val); el.dispatchEvent(new Event('change', { bubbles: true })); }
        };
        setVal("#paramLevel", level);
        setVal("#shokiSenzai", pot);
        setVal("#jukurendo", prof || 0);
        positive.forEach((s, i) => { setVal(`#plus_name_${i}`, s.name); setVal(`#plus_value_${i}`, s.level); });
        negative.forEach((s, i) => { setVal(`#minus_name_${i}`, s.name); setVal(`#minus_value_${i}`, s.level); });
      }, {
        level: statConfig.characterLevel,
        positive: statConfig.positiveStats,
        negative: statConfig.negativeStats,
        pot: statConfig.startingPotential,
        prof: statConfig.professionLevel
      });
    }

    console.log("⏳ Silakan proses manual di browser, lalu tekan Enter di sini setelah hasil muncul.");
    await waitForEnter();

    const result = await parseAllResults(page);
    if (sock && jid) {
      await sock.sendMessage(jid, { text: formatResultMessage(result) });
    }
    return result;
  } finally {
    await browser.close();
  }
}

// --- FORMATTER ---
function formatResultMessage(result) {
  if (result.error) return `*Error Scraper:*\n${result.error}`;
  if (!result.hasValidResult) return `*Gagal:*\nHasil tidak ditemukan/timeout.`;

  let msg = `*🛡️ Tanaka Armor Calc*\n\n`;
  msg += `*Success Rate:* ${result.successRateValue}%\n`;
  msg += `*Pot Awal:* ${result.startingPot || '-'}\n`;

  // Tampilkan info BS Prof jika diset
  if (result.professionLevel > 0) {
    msg += `*BS Prof:* Lv.${result.professionLevel}\n`;
  }

  msg += `*Material:* ${result.materialCost || '-'}\n`;
  msg += `*Steps:* ${result.steps ? result.steps.length : 0}\n\n`;

  if (result.steps && result.steps.length > 0) {
    msg += `*Langkah:*\n`;
    // Batasi tampilan step jika terlalu panjang untuk WA
    const stepsToShow = result.steps.length > 20 ? result.steps.slice(0, 20).concat(["... (selengkapnya di web)"]) : result.steps;
    msg += stepsToShow.join("\n");
  }

  msg += `\n\n_Generated in ${Math.round(result.duration / 1000)}s_`;
  return msg;
}

// --- EXPORTS ---
export {
  tanaka,
  tanakaManual,
  parseCommand,
  formatResultMessage,
  CONFIG,
  statMap
};

export default { tanaka, parseCommand };
