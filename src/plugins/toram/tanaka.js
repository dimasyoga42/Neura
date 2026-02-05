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
  MAX_RETRIES: 2, // Reduced from 3
  DEFAULT_TIMEOUT: 90000, // Reduced from 120000
  CHECK_INTERVAL: 1000, // Reduced from 2000 for faster checks
  DEFAULT_LEVEL: 280,
  DEFAULT_POTENTIAL: 110,
  BASE_URL: "https://tanaka0.work/id/BouguProper",
  // New optimization configs
  NAVIGATION_TIMEOUT: 60000, // Increased for stability
  SELECTOR_TIMEOUT: 15000,
  MAX_CAPTCHA_WAIT: 20, // Reduced from 30
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
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(message, (ans) => {
      rl.close();
      resolve(ans);
    });
  });
}

async function withRetry(fn, retries = CONFIG.MAX_RETRIES, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      console.log(`❗ Percobaan ${i + 1} gagal:`, error.message);
      if (i === retries - 1) throw error;
      await sleep(delay);
      delay *= 1.5;
    }
  }
}

// --- COMMAND PARSING - DENGAN PROF (UPDATED) ---
function parseCommand(args) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: CONFIG.DEFAULT_LEVEL,
    startingPotential: CONFIG.DEFAULT_POTENTIAL,
    profession: "NULL",
    professionLevel: 0, // Default profession level
  };

  const fullCommand = args.join(" ").toLowerCase();

  // Extract character level
  const levelMatch = fullCommand.match(/lv(\d+)/);
  if (levelMatch) {
    const level = parseInt(levelMatch[1], 10);
    if (!isNaN(level) && level >= 1 && level <= 500) {
      config.characterLevel = level;
    }
  }

  // Extract potential
  const potMatch = fullCommand.match(/pot(\d+)/);
  if (potMatch) {
    const potential = parseInt(potMatch[1], 10);
    if (!isNaN(potential) && potential >= 0 && potential <= 200) {
      config.startingPotential = potential;
    }
  }

  // Extract profession and level (UPDATED REGEX)
  const profPatterns = [
    /prof\s*[:=]?\s*(bs|alchemist|null)\s*[:=]?\s*(\d+)/i,
    /(bs|alchemist)(\d+)/i,
    /(?:bs|prof|prof\s*[:=]?\s*bs)\s*[:=]?\s*(\d+)/i // Tambahan
  ];

  for (const pattern of profPatterns) {
    const profMatch = fullCommand.match(pattern);
    if (profMatch) {
      const potentialLevel = parseInt(profMatch[profMatch.length - 1], 10);
      if (!isNaN(potentialLevel)) {
        config.profession = "BS";
        config.professionLevel = potentialLevel;
        console.log(`✓ Profession Level detected: ${config.professionLevel}`);
        break;
      }
    }
  }

  const statParts = fullCommand.split(',').map(s => s.trim());

  for (const part of statParts) {
    if (!part || part.includes('lv') || part.includes('pot') || part.includes('prof') || part.includes('bs') || part.includes('alchemist')) continue;

    const match = part.match(/^([a-z%]+)\s*=\s*(.+)$/);

    if (!match) continue;

    const [, statKey, valueStr] = match;
    const value = valueStr.trim();

    const fullName = statMap[statKey];

    if (!fullName) {
      console.warn(`Stat tidak dikenal: ${statKey}, diabaikan`);
      continue;
    }

    const isNegative = value === 'min';
    const isPositive = value === 'max';

    let level;
    // PENTING: Set 'MAX' string agar diproses di browser sebagai perintah khusus
    if (isPositive || isNegative) {
      level = 'MAX';
    } else {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue)) {
        console.warn(` Level tidak valid untuk ${statKey}: ${value}, diabaikan`);
        continue;
      }
      level = numValue.toString();
    }

    const statObject = { name: fullName, level };

    if (isNegative) {
      if (config.negativeStats.length < 7) {
        config.negativeStats.push(statObject);
        console.log(`✓ Negative stat ditambahkan: ${fullName} ${level}`);
      } else {
        console.warn(`⚠️ Maksimal 7 negative stats, ${fullName} diabaikan`);
      }
    } else {
      if (config.positiveStats.length < 7) {
        config.positiveStats.push(statObject);
        console.log(`✓ Positive stat ditambahkan: ${fullName} ${level}`);
      } else {
        console.warn(`⚠️ Maksimal 7 positive stats, ${fullName} diabaikan`);
      }
    }
  }

  console.log(`\n📊 Konfigurasi Final:`);
  console.log(`- Character Level: ${config.characterLevel}`);
  console.log(`- Starting Potential: ${config.startingPotential}`);
  console.log(`- Profession Level: ${config.professionLevel}`);

  return config;
}

// --- OPTIMIZED CAPTCHA HANDLING ---
async function handleCaptcha(page) {
  try {
    console.log("🔍 Menganalisis CAPTCHA...");

    // Reduced wait time
    for (let i = 0; i < CONFIG.MAX_CAPTCHA_WAIT; i++) {
      await sleep(1000);

      const captchaGone = await page.evaluate(() => {
        const captchaElements = document.querySelectorAll(
          '[id*="captcha"], [class*="captcha"], .captcha'
        );
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
      const selectors = [
        'input[type="checkbox"]',
        'button[type="submit"]',
        ".recaptcha-checkbox",
        '[role="checkbox"]',
        'button:contains("Verify")',
        'button:contains("Continue")',
        'button:contains("Submit")',
      ];

      for (let selector of selectors) {
        try {
          const elements = document.querySelectorAll(selector);
          for (let element of elements) {
            const text = element.textContent?.toLowerCase() || "";
            const parentText = element.parentElement?.textContent?.toLowerCase() || "";

            if (
              text.includes("robot") ||
              text.includes("human") ||
              text.includes("verify") ||
              text.includes("continue") ||
              parentText.includes("robot") ||
              parentText.includes("human")
            ) {
              element.click();
              return { clicked: true, type: selector, text: text || parentText };
            }
          }
        } catch (e) {
          continue;
        }
      }
      return { clicked: false };
    });

    if (clickResult.clicked) {
      console.log(`✅ Diklik: ${clickResult.type} - "${clickResult.text}"`);
      await sleep(3000); // Reduced from 5000

      const solved = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();
        return !pageText.includes("captcha") && !pageText.includes("verify");
      });

      if (solved) {
        return { solved: true, method: "auto-click" };
      }
    }

    console.log("🔧 CAPTCHA memerlukan penanganan manual");
    return { solved: false, requiresManual: true };
  } catch (error) {
    console.log(`\n❌ Error menangani CAPTCHA: ${error.message}`);
    return { solved: false, error: error.message };
  }
}

// --- OPTIMIZED AUTO WAIT FOR RESULTS ---
async function autoWaitForResults(page, maxWaitTime, checkInterval) {
  console.log("🤖 Memulai pemantauan otomatis...");

  const startTime = Date.now();
  let captchaDetected = false;
  let consecutiveResults = 0;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const pageState = await page.evaluate(() => {
        const pageText = document.body.innerText.toLowerCase();

        return {
          hasCaptcha:
            pageText.includes("captcha") ||
            pageText.includes("verify") ||
            pageText.includes("robot") ||
            document.querySelector(".captcha") ||
            document.querySelector('[id*="captcha"]'),
          isLoading:
            pageText.includes("loading") ||
            pageText.includes("please wait") ||
            pageText.includes("processing"),
          hasResults: pageText.includes("success rate") && pageText.includes("statting of armor"),
          hasError:
            pageText.includes("error") ||
            pageText.includes("failed") ||
            pageText.includes("timeout"),
          pageText: document.body.innerText.substring(0, 500),
        };
      });

      if (pageState.hasCaptcha && !captchaDetected) {
        captchaDetected = true;
        console.log("🔒 CAPTCHA terdeteksi!");

        const captchaResult = await handleCaptcha(page);
        if (captchaResult.solved) {
          console.log("✅ CAPTCHA berhasil diselesaikan!");
        } else if (captchaResult.requiresManual) {
          throw new Error("CAPTCHA_MANUAL_REQUIRED");
        }
      }

      // Optimized result detection with consecutive checks
      if (pageState.hasResults) {
        consecutiveResults++;
        if (consecutiveResults >= 2) { // Confirm result stability
          console.log("🎯 Hasil stabil ditemukan! Memulai parsing...");
          await sleep(500); // Brief wait for final rendering
          return await parseAllResults(page);
        }
      } else {
        consecutiveResults = 0;
      }

      if (pageState.hasError) {
        // Cek apakah errornya fatal atau cuma teks biasa
        const isFatal = pageState.pageText.includes("504") || pageState.pageText.includes("timeout");
        if (isFatal) {
          console.log("❌ Error fatal terdeteksi pada halaman");
          return {
            error: "Terjadi error pada website",
            pageContent: pageState.pageText.substring(0, 300),
            hasValidResult: false,
          };
        }
      }

      const elapsed = Math.round((Date.now() - startTime) / 1000);
      const remaining = Math.round((maxWaitTime - (Date.now() - startTime)) / 1000);

      if (pageState.isLoading) {
        process.stdout.write(`\r⏳ Memproses... ${elapsed}s (${remaining}s tersisa)`);
      } else {
        process.stdout.write(`\r🔄 Menunggu hasil... ${elapsed}s (${remaining}s tersisa)`);
      }

      await sleep(checkInterval);
    } catch (error) {
      if (error.message === "CAPTCHA_MANUAL_REQUIRED") {
        throw error;
      }
      console.log(`\nError saat monitoring: ${error.message}`);
      await sleep(checkInterval);
    }
  }

  console.log("\n⏱️ Timeout tercapai, mencoba parsing terakhir...");
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
      const html = div.innerHTML?.trim() || "";

      if (text.length > 20) {
        resultDivs.push({
          index,
          text,
          html,
          hasSuccessRate: text.includes("Success Rate"),
          hasStatting: text.includes("Statting of Armor"),
          hasSteps: /\d+\.\s/.test(text),
          isCostInfo:
            text.includes("Mat cost") || text.includes("Medicine") || text.includes("Mana:"),
          isWarning: text.includes("Perhatian") || text.includes("***"),
        });
      }
    });

    return {
      resultDivs,
      pageText: document.body.innerText,
    };
  });

  console.log(`🔍 Ditemukan ${allData.resultDivs.length} div dengan konten`);

  const result = {
    finalStat: "Tidak ditemukan",
    successRate: "Tidak ditemukan",
    successRateValue: null,
    startingPot: "Tidak ditemukan",
    steps: [],
    materialCost: "Tidak ditemukan",
    materialDetails: {},
    highestStepCost: "Tidak ditemukan",
    warnings: [],
    timestamp: new Date().toISOString(),
    totalSteps: 0,
    hasValidResult: false,
  };

  allData.resultDivs.forEach((div) => {
    const text = div.text;

    // Extract final stats
    if (div.hasStatting && text.includes("Result")) {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);
      const statLines = lines.filter(
        (l) =>
          l.includes("Critical Damage") ||
          l.includes("Accuracy") ||
          l.includes("ATK") ||
          l.includes("MATK") ||
          l.includes("DEF")
      );

      if (statLines.length > 0) {
        result.finalStat = statLines.join(", ");
        console.log("✓ Final stat ditemukan:", result.finalStat);
      }
    }

    // Extract success rate
    if (div.hasSuccessRate) {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l);

      const successRatePatterns = [
        /Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i,
        /Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)%/i,
        /Success\s+Rate\s+(\d+(?:\.\d+)?)\s*%/i,
        /Success\s+Rate[：:]\s*(\d+(?:\.\d+)?)\s*%/i,
      ];

      for (const pattern of successRatePatterns) {
        const match = text.match(pattern);
        if (match) {
          const percentage = parseFloat(match[1]);
          result.successRate = `Success Rate: ${percentage}%`;
          result.successRateValue = percentage;
          console.log("✓ Success rate ditemukan:", result.successRate);
          break;
        }
      }

      // Extract starting pot
      const potPatterns = [
        /Starting\s+Pot[：:]\s*(\d+)\s*pt/i,
        /Starting\s+Pot[：:]\s*(\d+)pt/i,
        /Starting\s+Potential[：:]\s*(\d+)\s*pt/i,
      ];

      for (const pattern of potPatterns) {
        const match = text.match(pattern);
        if (match) {
          result.startingPot = `Starting Pot: ${match[1]}pt`;
          console.log("✓ Starting pot ditemukan:", result.startingPot);
          break;
        }
      }

      const steps = lines.filter((l) => /^\d+\.\s/.test(l));
      if (steps.length > 0) {
        result.steps = steps;
        console.log(`✓ ${steps.length} langkah ditemukan`);
      }
    }

    // Enhanced material cost extraction
    if (div.isCostInfo) {
      const materialMatches = {
        metal: text.match(/Metal[：:]\s*(\d+(?:,\d+)*)\s*pt/i),
        cloth: text.match(/Cloth[：:]\s*(\d+(?:,\d+)*)\s*pt/i),
        beast: text.match(/Beast[：:]\s*(\d+(?:,\d+)*)\s*pt/i),
        wood: text.match(/Wood[：:]\s*(\d+(?:,\d+)*)\s*pt/i),
        medicine: text.match(/Medicine[：:]\s*(\d+(?:,\d+)*)\s*pt/i),
        mana: text.match(/Mana[：:]\s*(\d+(?:,\d+)*)\s*pt/i),
      };

      const materials = [];
      Object.entries(materialMatches).forEach(([key, match]) => {
        if (match && match[1] !== "0") {
          result.materialDetails[key] = match[1];
          materials.push(`${key.charAt(0).toUpperCase() + key.slice(1)}:${match[1]}pt`);
        }
      });

      if (materials.length > 0) {
        result.materialCost = materials.join(", ");
        console.log("✓ Material cost ditemukan:", result.materialCost);
      }

      // Extract highest step cost
      const highestPatterns = [
        /Highest\s+mats?\s+per\s+step[：:]\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*pt/i,
        /Highest\s+material\s+per\s+step[：:]\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*pt/i,
      ];

      for (const pattern of highestPatterns) {
        const match = text.match(pattern);
        if (match) {
          result.highestStepCost = `${match[1]}pt`;
          console.log("✓ Highest step cost ditemukan:", result.highestStepCost);
          break;
        }
      }

      const reductionMatch = text.match(/\((\d+%)\s*reduction\s*by\s*(\w+)\)/i);
      if (reductionMatch) {
        result.materialDetails.reduction = `${reductionMatch[1]} by ${reductionMatch[2]}`;
      }

      const percentageMatch = text.match(/\(([^)]*Metal:\d+%[^)]*)\)/);
      if (percentageMatch) {
        result.materialDetails.breakdown = percentageMatch[1];
      }
    }

    if (div.isWarning) {
      result.warnings.push(text.substring(0, 200) + (text.length > 200 ? "..." : ""));
    }
  });

  result.totalSteps = result.steps.length;

  result.hasValidResult =
    result.finalStat !== "Tidak ditemukan" &&
    result.successRateValue !== null &&
    result.successRateValue >= 0 &&
    result.successRateValue <= 100;

  console.log("\n📊 Ringkasan hasil:");
  console.log(`- Success Rate: ${result.successRate} (Value: ${result.successRateValue}%)`);
  console.log(`- Material cost: ${result.materialCost}`);
  console.log(`- Highest step cost: ${result.highestStepCost}`);
  console.log(`- Starting Pot: ${result.startingPot}`);
  console.log(`- Total Steps: ${result.totalSteps}`);
  console.log(`- Valid Result: ${result.hasValidResult ? '✅' : '❌'}`);

  return result;
}

// --- MAIN FUNCTION (UPDATED) ---
async function tanaka(statConfigOrSocket, jidOrOptions = {}, additionalOptions = {}) {
  let sock, jid, statConfig, options;

  if (statConfigOrSocket && typeof statConfigOrSocket.sendMessage === "function") {
    sock = statConfigOrSocket;
    jid = jidOrOptions;
    options = additionalOptions;
    statConfig = {
      positiveStats: [{ name: "Critical Damage", level: "MAX" }],
      negativeStats: [{ name: "Accuracy", level: "MAX" }],
      characterLevel: CONFIG.DEFAULT_LEVEL,
      startingPotential: CONFIG.DEFAULT_POTENTIAL,
      profession: "NULL",
      professionLevel: 0,
    };
  } else {
    statConfig = statConfigOrSocket;
    options = jidOrOptions;
  }

  const {
    maxWaitTime = CONFIG.DEFAULT_TIMEOUT,
    checkInterval = CONFIG.CHECK_INTERVAL,
    headless = true,
    debug = false,
    enableRetry = true,
  } = options || {};

  const startTime = Date.now();

  const scraperFunction = async () => {
    let browser;

    try {
      console.log("🚀 Meluncurkan peramban...");
      browser = await puppeteer.launch({
        headless: true, // Ubah ke false untuk debug visual
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-software-rasterizer",
          "--disable-extensions",
          "--disable-images",
          "--disable-plugins",
          "--disable-background-networking",
          "--disable-default-apps",
          "--disable-sync",
          "--disable-translate",
          "--metrics-recording-only",
          "--mute-audio",
          "--no-first-run",
          "--safebrowsing-disable-auto-update",
        ],
        ...(debug && { devtools: true, slowMo: 250 }),
      });

      const page = await browser.newPage();

      await page.setViewport({ width: 1280, height: 800 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      );

      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      console.log(`📂 Membuka ${CONFIG.BASE_URL}...`);
      await page.goto(CONFIG.BASE_URL, {
        waitUntil: "domcontentloaded",
        timeout: CONFIG.NAVIGATION_TIMEOUT,
      });

      // --- [PERBAIKAN] 1. KLIK TOMBOL RELOAD (RESET) ---
      console.log("🔄 Mencoba klik tombol Reload...");
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, input[type='button'], input[type='submit'], .btn"));
        // Cari tombol dengan value atau text "Reload" / "Reset"
        const reloadBtn = buttons.find(b =>
          (b.value && b.value.toLowerCase().includes("reload")) ||
          (b.innerText && b.innerText.toLowerCase().includes("reload")) ||
          (b.innerText && b.innerText.toLowerCase().includes("reset"))
        );
        if (reloadBtn) {
          reloadBtn.click();
          console.log("Tombol Reload diklik.");
        }
      });
      // [PENTING] Tunggu formulir refresh
      await sleep(2500);

      console.log("📝 Mengisi formulir...");
      await page.waitForSelector("#paramLevel", { timeout: CONFIG.SELECTOR_TIMEOUT });

      const { positiveStats, negativeStats, startingPotential, characterLevel, profession, professionLevel } = statConfig;

      // --- [PERBAIKAN] 2. PENGISIAN FORM (DENGAN HELPER SETSELECTSMART) ---
      await page.evaluate(
        ({ level, positive, negative, pot, prof, profLvl }) => {

          // Helper 1: Untuk Input Text Biasa
          const setVal = (sel, val) => {
            const el = document.querySelector(sel);
            if (el) {
              el.focus(); // Fokus dulu
              el.value = String(val);
              // Trigger semua event yang mungkin didengar oleh website
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }
          };

          // Helper 2: KHUSUS DROPDOWN (Penting untuk Smith Prof & Max)
          // Mencari option berdasarkan value atau text content (misal: "300" -> "Lv300")
          const setSelectSmart = (selector, value) => {
            const el = document.querySelector(selector);
            if (!el) return;

            const target = String(value);
            const option =
              [...el.options].find(o => o.value === target) ||
              [...el.options].find(o => o.value.includes(target)) ||
              [...el.options].find(o => o.textContent.includes(target));

            if (!option) return;

            el.value = option.value;
            el.dispatchEvent(new Event("change", { bubbles: true }));
          };

          // Helper 3: Isi Stat (Gabungan Max & setVal)
          const fillStat = (nameSel, valSel, statName, statLevel) => {
            setVal(nameSel, statName);

            // Logic Max: Ambil value terakhir dari dropdown jika user minta 'MAX'
            const valEl = document.querySelector(valSel);
            if (statLevel === 'MAX') {
              if (valEl && valEl.options && valEl.options.length > 0) {
                const maxVal = valEl.options[valEl.options.length - 1].value;
                setVal(valSel, maxVal);
              }
            } else {
              setVal(valSel, statLevel);
            }
          };

          // 1. Set Character Level
          setVal("#paramLevel", level);

          // 2. Set Profession (Dropdown)
          const profSelect = document.querySelector("#shokugyou");
          if (profSelect) {
            profSelect.value = prof;
            profSelect.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // 3. Set Profession Level (GUNAKAN SETSELECTSMART)
          if (profLvl > 0) {
            setSelectSmart("#jukurendo", profLvl);
            setSelectSmart("#shokugyouLv", profLvl); // Backup
          }

          // 4. Set Positive Stats
          for (let i = 0; i < 7; i++) {
            const stat = positive[i];
            if (stat) {
              fillStat(`#plus_name_${i}`, `#plus_value_${i}`, stat.name, stat.level);
            }
          }

          // 5. Set Negative Stats
          for (let i = 0; i < 7; i++) {
            const stat = negative[i];
            if (stat) {
              fillStat(`#minus_name_${i}`, `#minus_value_${i}`, stat.name, stat.level);
            }
          }

          // 6. Set Potential
          setVal("#shokiSenzai", pot);

        },
        {
          level: characterLevel,
          positive: positiveStats,
          negative: negativeStats,
          pot: startingPotential,
          prof: profession,
          profLvl: professionLevel,
        }
      );

      console.log("📤 Mengirim formulir...");
      await page.click("#sendData");
      console.log("✅ Formulir dikirim, memulai pemantauan otomatis...");

      const result = await autoWaitForResults(page, maxWaitTime, checkInterval);
      result.duration = Date.now() - startTime;
      result.profession = profession;
      result.professionLevel = professionLevel;

      console.log("\n🎉 --- HASIL AKHIR ---");
      console.log(JSON.stringify(result, null, 2));

      if (sock && jid && result.hasValidResult) {
        try {
          const message = formatResultMessage(result);
          await sock.sendMessage(jid, { text: message });
          console.log("✅ Hasil dikirim via WhatsApp");
        } catch (sendError) {
          console.log("❌ Gagal mengirim ke WhatsApp:", sendError.message);
        }
      }

      return result;
    } finally {
      if (browser) {
        console.log("\n🚪 Menutup peramban...");
        await browser.close();
      }
    }
  };

  try {
    if (enableRetry) {
      return await withRetry(scraperFunction);
    } else {
      return await scraperFunction();
    }
  } catch (error) {
    console.error("\n❌ --- TERJADI KESALAHAN ---");
    console.error("Detail error:", error.message);

    if (error.message === "CAPTCHA_MANUAL_REQUIRED") {
      console.log("🔄 Beralih ke mode manual untuk menyelesaikan CAPTCHA...");
      return await tanakaManual(sock, jid, statConfig, options);
    }

    const duration = Date.now() - startTime;
    return {
      error: error.message,
      hasValidResult: false,
      duration,
    };
  }
}

// --- MESSAGE FORMATTING DENGAN PROF LEVEL ---
function formatResultMessage(result) {
  if (result.error) {
    return `*Error Tanaka Scraper:*\n${result.error}`;
  }

  if (!result.hasValidResult) {
    let message = `*Tanaka Scraper:*\nHasil tidak lengkap atau gagal memuat\n\n`;
    message += `Debug Info:\n`;
    message += `- Success Rate Found: ${result.successRate}\n`;
    message += `- Success Rate Value: ${result.successRateValue}\n`;
    message += `- Final Stat: ${result.finalStat !== "Tidak ditemukan" ? "✓" : "✗"}\n`;
    return message;
  }

  let message = `*Hasil Tanaka*\n\n`;

  if (result.successRateValue !== null) {
    message += `*Success Rate:* ${result.successRateValue}%\n`;
  } else {
    message += `*Success Rate:* ${result.successRate}\n`;
  }

  message += `*Starting Pot:* ${result.startingPot}\n`;

  if (result.professionLevel && result.professionLevel > 0) {
    message += `*BS Prof:* Lv.${result.professionLevel}\n`;
  }

  message += `*Total Steps:* ${result.totalSteps}\n`;

  if (result.materialCost !== "Tidak ditemukan") {
    message += `*Material Cost:* ${result.materialCost}\n`;
  }

  if (result.highestStepCost !== "Tidak ditemukan") {
    message += `*Highest Step Cost:* ${result.highestStepCost}\n`;
  }

  if (result.materialDetails.breakdown) {
    message += `*Material Breakdown:* ${result.materialDetails.breakdown}\n`;
  }

  if (result.materialDetails.reduction) {
    message += `*Cost Reduction:* ${result.materialDetails.reduction}\n`;
  }

  if (result.steps.length > 0) {
    message += `\n*Langkah Enhancement:*\n`;
    result.steps.forEach((step) => {
      message += `${step}\n`;
    });
  }

  if (result.duration) {
    message += `\n*Waktu Eksekusi:* ${Math.round(result.duration / 1000)}s`;
  }

  message += `\n*Dibuat:* ${new Date(result.timestamp).toLocaleString("id-ID")}`;

  return message;
}

// --- MANUAL MODE ---
async function tanakaManual(sock, jid, statConfig = null, options = {}) {
  console.log("🔧 Mode Manual - Browser akan terbuka untuk interaksi manual");

  const browser = await puppeteer.launch({
    headless: false,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  try {
    await page.goto(CONFIG.BASE_URL, {
      waitUntil: "domcontentloaded",
      timeout: CONFIG.NAVIGATION_TIMEOUT
    });

    if (statConfig) {
      console.log("📝 Mengisi formulir secara otomatis...");
      await page.waitForSelector("#paramLevel", { timeout: CONFIG.SELECTOR_TIMEOUT });

      // [PERBAIKAN MANUAL MODE JUGA]
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, input[type='button']"));
        const reloadBtn = buttons.find(b => b.value === 'Reload' || b.innerText === 'Reload');
        if (reloadBtn) reloadBtn.click();
      });
      await sleep(1500);

      const { positiveStats, negativeStats, startingPotential, characterLevel, professionLevel } = statConfig;

      await page.evaluate(
        ({ level, positive, negative, pot, profLvl }) => {
          // --- Helper Definitions (Duplicated for manual context) ---
          const setVal = (sel, val) => {
            const el = document.querySelector(sel);
            if (el) {
              el.focus();
              el.value = String(val);
              el.dispatchEvent(new Event('input', { bubbles: true }));
              el.dispatchEvent(new Event('change', { bubbles: true }));
              el.dispatchEvent(new Event('blur', { bubbles: true }));
            }
          };

          const setSelectSmart = (selector, value) => {
            const el = document.querySelector(selector);
            if (!el) return;
            const target = String(value);
            const option = [...el.options].find(o => o.value === target || o.value.includes(target) || o.textContent.includes(target));
            if (option) { el.value = option.value; el.dispatchEvent(new Event("change", { bubbles: true })); }
          };

          setVal("#paramLevel", level);
          setVal("#shokiSenzai", pot);

          if (profLvl > 0) setSelectSmart("#jukurendo", profLvl);

          for (let i = 0; i < Math.min(7, positive.length); i++) {
            const stat = positive[i];
            setVal(`#plus_name_${i}`, stat.name);
            setVal(`#plus_value_${i}`, stat.level === 'MAX' ? '10' : stat.level); // Fallback manual
          }

          for (let i = 0; i < Math.min(7, negative.length); i++) {
            const stat = negative[i];
            setVal(`#minus_name_${i}`, stat.name);
            setVal(`#minus_value_${i}`, stat.level === 'MAX' ? '10' : stat.level);
          }
        },
        {
          level: characterLevel,
          positive: positiveStats,
          negative: negativeStats,
          pot: startingPotential,
          profLvl: professionLevel,
        }
      );

      console.log("✅ Form telah diisi otomatis");
    }

    console.log("⏸️ Silakan selesaikan CAPTCHA dan tunggu hasil muncul...");
    console.log("⏸️ Setelah hasil lengkap terlihat, tekan Enter untuk parsing...");
    await waitForEnter();

    const result = await parseAllResults(page);
    console.log("\n🎉 --- HASIL MANUAL ---");
    console.log(JSON.stringify(result, null, 2));

    if (sock && jid && result.hasValidResult) {
      try {
        const message = formatResultMessage(result);
        await sock.sendMessage(jid, { text: message });
        console.log("✅ Hasil dikirim via WhatsApp");
      } catch (sendError) {
        console.log("❌ Gagal mengirim ke WhatsApp:", sendError.message);
      }
    }

    return result;
  } finally {
    await browser.close();
  }
}

// --- SMART MODE WITH TIMEOUT PROTECTION ---
async function tanakaSmart(sock, jid, statConfig = null, options = {}) {
  console.log("🤖 Mode Smart - Otomatis dengan fallback manual");

  try {
    const config = statConfig || {
      positiveStats: [{ name: "Critical Damage", level: "MAX" }],
      negativeStats: [{ name: "Accuracy", level: "MAX" }],
      characterLevel: CONFIG.DEFAULT_LEVEL,
      startingPotential: CONFIG.DEFAULT_POTENTIAL,
    };

    // Use optimized timeout settings
    const result = await tanaka(config, {
      ...options,
      headless: true,
      maxWaitTime: CONFIG.DEFAULT_TIMEOUT,
      checkInterval: CONFIG.CHECK_INTERVAL
    });

    if (result.hasValidResult) {
      console.log("✅ Mode otomatis berhasil!");
      return result;
    }

    console.log("⚠️ Mode otomatis tidak berhasil, beralih ke mode manual...");
    return await tanakaManual(sock, jid, config, options);
  } catch (error) {
    console.log("❌ Mode otomatis gagal:", error.message);
    console.log("🔄 Beralih ke mode manual...");
    return await tanakaManual(sock, jid, statConfig, options);
  }
}

// --- HELPER FUNCTIONS ---
function getAvailableStats(sock, chatId, msg) {
  console.log("\n📋 Daftar Stat Yang Tersedia:");
  console.log("Format: statname=level (contoh: atk%=10, cr=Max, acc%=Min)");
  console.log("Level: angka (1-9) atau 'max' untuk positive / 'min' untuk negative\n");

  Object.entries(statMap).forEach(([key, value]) => {
    console.log(`${key.padEnd(12)} -> ${value}`);
    if (sock && chatId && msg) {
      sock.sendMessage(chatId, { text: `*${key.padEnd(12)}* -> ${value}` }, { quoted: msg });
    }
  });

  return statMap;
}

function validateStatConfig(config) {
  const errors = [];
  const warnings = [];

  if (!config || typeof config !== "object") {
    errors.push("Konfigurasi tidak valid");
    return { valid: false, errors, warnings };
  }

  if (config.characterLevel < 1 || config.characterLevel > 500) {
    errors.push("Level karakter harus antara 1-500");
  }

  if (config.startingPotential < 0 || config.startingPotential > 200) {
    errors.push("Starting potential harus antara 0-200");
  }

  if (config.positiveStats.length === 0 && config.negativeStats.length === 0) {
    warnings.push("Tidak ada stat yang dikonfigurasi, akan menggunakan default");
  }

  const allStats = [...config.positiveStats, ...config.negativeStats];
  const statNames = allStats.map((s) => s.name);
  const duplicates = statNames.filter((name, index) => statNames.indexOf(name) !== index);

  if (duplicates.length > 0) {
    warnings.push(`Stat duplikat ditemukan: ${duplicates.join(", ")}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalPositive: config.positiveStats.length,
      totalNegative: config.negativeStats.length,
      level: config.characterLevel,
      potential: config.startingPotential,
    },
  };
}

function createExampleConfigs() {
  return {
    dps: parseCommand(["cd=max,", "cr=max,", "atk%=max,", "aspd%=max,", "acc=min,", "dodge=min", "lv280", "pot100"]),
    tank: parseCommand(["def=max,", "mdef=max,", "hp%=max,", "vit%=max,", "cr=min,", "cd=min", "lv280", "pot100"]),
    mage: parseCommand(["matk%=max,", "int%=max,", "cspd%=max,", "mp%=max,", "aspd%=min", "lv280", "pot100"]),
    support: parseCommand(["hp%=max,", "mp%=max,", "hpreg%=max,", "mpreg%=max,", "atk=min", "lv280", "pot100"]),
  };
}

// --- EXPORTS ---
export {
  // Main functions
  tanaka,
  tanakaManual,
  tanakaSmart,

  // Parser & formatter
  parseCommand,
  parseAllResults,
  formatResultMessage,

  // Helper functions
  getAvailableStats,
  validateStatConfig,
  createExampleConfigs,

  // Data & config
  statMap,
  CONFIG,
  enhancementInfo,

  // Utilities
  sleep,
  waitForEnter,
  withRetry
};

// Default export
export default {
  tanaka,
  tanakaManual,
  tanakaSmart,
  parseCommand,
  parseAllResults,
  formatResultMessage,
  getAvailableStats,
  validateStatConfig,
  createExampleConfigs,
  statMap,
  CONFIG,
  enhancementInfo,
};
