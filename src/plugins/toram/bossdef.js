import puppeteer from "puppeteer";

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Scrape data dari Google Sheets
const scrapeSheetData = async (url) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000
    });

    await page.waitForSelector("table", { timeout: 10000 });
    await delay(2000);

    const data = await page.evaluate(() => {
      const table = document.querySelector("table");
      if (!table) return null;

      const rows = table.querySelectorAll("tr");
      if (rows.length === 0) return null;

      const headerCells = rows[0].querySelectorAll("th, td");
      const headers = Array.from(headerCells).map(cell =>
        cell.textContent.trim()
      );

      const list = [];
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll("td");
        if (cells.length === 0) continue;

        const item = {};
        cells.forEach((cell, idx) => {
          const header = headers[idx] || `col${idx}`;
          item[header] = cell.textContent.trim();
        });

        if (Object.values(item).some(v => v)) {
          list.push(item);
        }
      }

      return list;
    });

    await browser.close();
    return data || [];

  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
};

// Handler untuk bot Baileys
export const bosdefHandler = async (sock, msg, query) => {
  const jid = msg.key.remoteJid;

  try {
    // Validasi query
    if (!query || query.trim() === '') {
      await sock.sendMessage(jid, {
        text: "Silakan masukkan nama boss/miniboss.\n\nContoh: !bosdef venena"
      });
      return;
    }

    await sock.sendMessage(jid, { text: "Mengambil data..." });

    // Ambil data dari kedua sheet secara parallel
    const [bossData, minibossData] = await Promise.all([
      scrapeSheetData("https://docs.google.com/spreadsheets/d/1s_CcLFFUeyP28HaHrJtRcTh06YVujO8boa4SzWwvy-M/htmlview"),
      scrapeSheetData("https://docs.google.com/spreadsheets/d/1FOb_YkYNuw_EUWNg5AFo5PfuuupKzeT592FZ_mazXXk/htmlview")
    ]);

    // Gabungkan data dengan tipe
    const allData = [
      ...bossData.map(b => ({ ...b, type: 'Boss' })),
      ...minibossData.map(m => ({ ...m, type: 'Miniboss' }))
    ];

    // Cari berdasarkan query
    const searchQuery = query.toLowerCase().trim();
    const filtered = allData.filter(item =>
      Object.values(item).some(val =>
        String(val).toLowerCase().includes(searchQuery)
      )
    );

    // Jika tidak ditemukan
    if (filtered.length === 0) {
      await sock.sendMessage(jid, {
        text: `"${query}" tidak ditemukan.`
      });
      return;
    }

    // Ambil hasil pertama
    const result = filtered[0];
    const name = result['Boss Name'] || result['Nama Boss'] || result['Miniboss Name'] || result['Nama Miniboss'] || 'Unknown';

    // Buat pesan
    let message = `*${name}* (${result.type})\n\n`;

    Object.entries(result).forEach(([key, value]) => {
      if (key !== 'Boss Name' && key !== 'Nama Boss' &&
        key !== 'Miniboss Name' && key !== 'Nama Miniboss' &&
        key !== 'type') {
        message += `${key}: ${value || '-'}\n`;
      }
    });

    // Tambahkan info jika ada hasil lain
    if (filtered.length > 1) {
      const others = filtered.slice(1).map(i => {
        const n = i['Boss Name'] || i['Nama Boss'] || i['Miniboss Name'] || i['Nama Miniboss'];
        return `${n} (${i.type})`;
      }).join(', ');
      message += `\nDitemukan ${filtered.length} hasil. Lainnya: ${others}`;
    }

    await sock.sendMessage(jid, { text: message });

  } catch (error) {
    console.error("Error bosdef:", error);
    await sock.sendMessage(jid, {
      text: "Terjadi kesalahan saat mengambil data."
    });
  }
};

