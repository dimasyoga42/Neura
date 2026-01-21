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

// --- COMMAND PARSING (UPDATED for BS Level) ---
function parseCommand(args) {
  const config = {
    positiveStats: [],
    negativeStats: [],
    characterLevel: CONFIG.DEFAULT_LEVEL,
    startingPotential: CONFIG.DEFAULT_POTENTIAL,
    professionLevel: 0,
  };

  const fullCommand = args.join(" ").toLowerCase();

  const levelMatch = fullCommand.match(/lv\s*[:=]?\s*(\d+)/i);
  if (levelMatch) config.characterLevel = parseInt(levelMatch[1], 10);

  const potMatch = fullCommand.match(/pot\s*[:=]?\s*(\d+)/i);
  if (potMatch) config.startingPotential = parseInt(potMatch[1], 10);

  // Extract Profession Level
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

    if (!fullName) continue;

    const isNegative = value === 'min';
    const isPositive = value === 'max';
    let level = (isPositive || isNegative) ? 'MAX' : parseInt(value, 10).toString();

    const statObject = { name: fullName, level };
    if (isNegative) {
      if (config.negativeStats.length < 7) config.negativeStats.push(statObject);
    } else {
      if (config.positiveStats.length < 7) config.positiveStats.push(statObject);
    }
  }

  return config;
}

// --- CAPTCHA ---
async function handleCaptcha(page) {
  try {
    console.log("🔍 Menganalisis CAPTCHA...");
    for (let i = 0; i < CONFIG.MAX_CAPTCHA_WAIT; i++) {
      await sleep(1000);
      const captchaGone = await page.evaluate(() => {
        const els = document.querySelectorAll('[id*="captcha"], [class*="captcha"], .captcha');
        const txt = document.body.innerText.toLowerCase();
        return els.length === 0 || Array.from(els).every((el) => el.style.display === "none") || (!txt.includes("captcha") && !txt.includes("verify"));
      });
      if (captchaGone) return { solved: true, method: "auto-disappeared" };
    }
    const clicked = await page.evaluate(() => {
      const sels = ['input[type="checkbox"]', '.recaptcha-checkbox', '[role="checkbox"]'];
      for (let s of sels) { const el = document.querySelector(s); if (el) { el.click(); return true; } }
      return false;
    });
    if (clicked) { await sleep(3000); return { solved: true, method: "auto-click" }; }
    return { solved: false, requiresManual: true };
  } catch (error) { return { solved: false, error: error.message }; }
}

// --- AUTO WAIT ---
async function autoWaitForResults(page, maxWaitTime, checkInterval) {
  console.log("🤖 Memulai pemantauan otomatis...");
  const startTime = Date.now();
  let consecutiveResults = 0;

  while (Date.now() - startTime < maxWaitTime) {
    try {
      const state = await page.evaluate(() => {
        const txt = document.body.innerText.toLowerCase();
        return {
          hasCaptcha: txt.includes("captcha") || txt.includes("verify"),
          hasResults: txt.includes("success rate") && txt.includes("statting of armor"),
          hasError: txt.includes("error") || txt.includes("failed"),
          isLoading: txt.includes("loading") || txt.includes("processing"),
        };
      });

      if (state.hasCaptcha) {
        console.log("🔒 CAPTCHA terdeteksi!");
        await handleCaptcha(page);
      }

      if (state.hasResults) {
        consecutiveResults++;
        if (consecutiveResults >= 2) {
          console.log("🎯 Hasil stabil ditemukan! Memulai parsing...");
          await sleep(500);
          return await parseAllResults(page);
        }
      } else { consecutiveResults = 0; }

      if (state.hasError) return { error: "Terjadi error pada website", hasValidResult: false };

      process.stdout.write(`\r⏳ Menunggu... ${Math.round((Date.now() - startTime) / 1000)}s`);
      await sleep(checkInterval);
    } catch (e) { await sleep(checkInterval); }
  }
  return await parseAllResults(page);
}

// --- PARSING ---
async function parseAllResults(page) {
  console.log("\n📊 Parsing hasil...");
  const data = await page.evaluate(() => {
    const text = document.body.innerText;
    const resultDivs = Array.from(document.querySelectorAll("div")).filter(d => d.innerText.length > 20);

    // Fallback parsing logic
    const successMatch = text.match(/Success\s+Rate\s*[：:]\s*(\d+(?:\.\d+)?)\s*%/i);
    const potMatch = text.match(/Starting\s+Pot[：:]\s*(\d+)\s*pt/i);
    const matMatch = text.match(/Mat cost[^\n]*/i);
    const steps = text.split('\n').filter(l => /^\d+\.\s/.test(l));

    return {
      successRateValue: successMatch ? parseFloat(successMatch[1]) : null,
      startingPot: potMatch ? potMatch[1] : null,
      materialCost: matMatch ? matMatch[0] : "Tidak ditemukan",
      steps: steps
    };
  });

  return { ...data, hasValidResult: data.successRateValue !== null, timestamp: new Date().toISOString() };
}

// --- MAIN FUNCTION (UPDATED) ---
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
        args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
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

      // --- [NEW] STEP: RELOAD DENGAN JEDA YANG CUKUP ---
      console.log("🔄 Mencoba klik tombol Reload...");
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll("button, input[type='button'], input[type='submit']"));
        const reloadBtn = buttons.find(b =>
          (b.innerText && b.innerText.toLowerCase().includes("reload")) ||
          (b.value && b.value.toLowerCase().includes("reload")) ||
          (b.innerText && b.innerText.toLowerCase().includes("reset"))
        );
        if (reloadBtn) { reloadBtn.click(); console.log("Reload diklik."); }
      });
      // Beri waktu website untuk mereset form sepenuhnya
      await sleep(2000);

      console.log("📝 Mengisi formulir...");
      await page.waitForSelector("#paramLevel", { timeout: CONFIG.SELECTOR_TIMEOUT });

      const { positiveStats, negativeStats, startingPotential, characterLevel, professionLevel } = statConfig;

      // --- [UPDATED] FORM FILLING (Lebih Robust) ---
      await page.evaluate(({ level, positive, negative, pot, profLvl }) => {
        // Fungsi helper yang memicu event lengkap agar website mendeteksi perubahan
        const setVal = (sel, val) => {
          const el = document.querySelector(sel);
          if (el) {
            el.focus(); // Fokus dulu
            el.value = String(val);
            el.dispatchEvent(new Event('input', { bubbles: true }));  // Trigger input
            el.dispatchEvent(new Event('change', { bubbles: true })); // Trigger change
            el.dispatchEvent(new Event('blur', { bubbles: true }));   // Trigger blur
          }
        };

        setVal("#paramLevel", level);
        setVal("#shokiSenzai", pot);
        setVal("#jukurendo", profLvl); // Isi Smith Prof

        for (let i = 0; i < 7; i++) {
          const stat = positive[i];
          if (stat) { setVal(`#plus_name_${i}`, stat.name); setVal(`#plus_value_${i}`, stat.level); }
        }
        for (let i = 0; i < 7; i++) {
          const stat = negative[i];
          if (stat) { setVal(`#minus_name_${i}`, stat.name); setVal(`#minus_value_${i}`, stat.level); }
        }
      }, {
        level: characterLevel, positive: positiveStats, negative: negativeStats,
        pot: startingPotential, profLvl: professionLevel || 0
      });

      console.log("📤 Mengirim formulir...");
      await page.click("#sendData");

      const result = await autoWaitForResults(page, maxWaitTime, checkInterval);
      result.duration = Date.now() - startTime;
      result.professionLevel = professionLevel;

      if (sock && jid && result.hasValidResult) {
        try { await sock.sendMessage(jid, { text: formatResultMessage(result) }); }
        catch (e) { console.log("Gagal kirim WA:", e.message); }
      }
      return result;
    } finally { if (browser) await browser.close(); }
  };

  try {
    if (enableRetry) return await withRetry(scraperFunction);
    return await scraperFunction();
  } catch (error) {
    if (error.message === "CAPTCHA_MANUAL_REQUIRED") return await tanakaManual(sock, jid, statConfig, options);
    return { error: error.message, hasValidResult: false };
  }
}

// --- MESSAGE FORMATTER ---
function formatResultMessage(result) {
  if (result.error) return `*Error Tanaka Scraper:*\n${result.error}`;
  if (!result.hasValidResult) return `*Gagal:*\nHasil tidak muncul. Coba lagi atau cek parameter.`;

  let message = `*Hasil Tanaka*\n\n`;
  message += `*Success Rate:* ${result.successRateValue}%\n`;
  message += `*Starting Pot:* ${result.startingPot}\n`;
  if (result.professionLevel > 0) message += `*BS Prof:* Lv.${result.professionLevel}\n`;

  message += `*Total Steps:* ${result.steps ? result.steps.length : 0}\n`;
  if (result.materialCost) message += `*Material:* ${result.materialCost}\n`;

  if (result.steps && result.steps.length > 0) {
    message += `\n*Langkah:*\n`;
    const stepsToShow = result.steps.length > 20 ? result.steps.slice(0, 20).concat(["..."]) : result.steps;
    message += stepsToShow.join("\n");
  }
  return message;
}

// --- MANUAL MODE ---
async function tanakaManual(sock, jid, statConfig = null, options = {}) {
  const browser = await puppeteer.launch({ headless: false, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  try {
    await page.goto(CONFIG.BASE_URL, { waitUntil: "domcontentloaded" });
    if (statConfig) {
      await page.evaluate(({ level, positive, negative, pot, profLvl }) => {
        // Klik reload di manual juga
        const btns = Array.from(document.querySelectorAll("input[type='button'], button"));
        const rBtn = btns.find(b => b.value === 'Reload' || b.innerText === 'Reload');
        if (rBtn) rBtn.click();

        setTimeout(() => {
          const setVal = (s, v) => { const el = document.querySelector(s); if (el) { el.focus(); el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } };
          setVal("#paramLevel", level);
          setVal("#shokiSenzai", pot);
          setVal("#jukurendo", profLvl);
          positive.forEach((s, i) => { setVal(`#plus_name_${i}`, s.name); setVal(`#plus_value_${i}`, s.level); });
          negative.forEach((s, i) => { setVal(`#minus_name_${i}`, s.name); setVal(`#minus_value_${i}`, s.level); });
        }, 1500);
      }, { level: statConfig.characterLevel, positive: statConfig.positiveStats, negative: statConfig.negativeStats, pot: statConfig.startingPotential, profLvl: statConfig.professionLevel });
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
