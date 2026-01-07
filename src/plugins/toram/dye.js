import puppeteer from "puppeteer";
import path from "path";
import fs from "fs";

export const screenshotFullTable = async (month = "202601") => {
  const url = `https://tanaka0.work/AIO/en/DyePredictor/ColorWeapon?month=${month}`;
  const outputDir = path.resolve("temp");
  const filePath = path.join(outputDir, `dye_${month}.png`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  await page.waitForSelector("table");

  // 👉 Ambil ukuran tabel
  const tableInfo = await page.evaluate(() => {
    const table = document.querySelector("table");
    const rect = table.getBoundingClientRect();
    return {
      width: Math.ceil(rect.width),
      height: Math.ceil(rect.height),
    };
  });

  // 👉 Set viewport sesuai tinggi tabel
  await page.setViewport({
    width: Math.max(1200, tableInfo.width),
    height: tableInfo.height,
  });

  const table = await page.$("table");

  await table.screenshot({
    path: filePath,
  });

  await browser.close();
  return filePath;
};
export const dyePredictor = async (sock, chatId, msg, text) => {
  try {
    const month = text?.split(" ")[1] || "202601";

    await sock.sendMessage(
      chatId,
      { text: "Mengambil data dye weapon, mohon tunggu..." },
      { quoted: msg }
    );

    const imgPath = await screenshotTanakaTable(month);
    const buffer = fs.readFileSync(imgPath);

    await sock.sendMessage(
      chatId,
      {
        image: buffer,
        caption: `Dye Weapon Prediction\nMonth: ${month}`,
      },
      { quoted: msg }
    );

    fs.unlinkSync(imgPath); // hapus file setelah dikirim
  } catch (err) {
    console.error(err);
    sock.sendMessage(chatId, { text: "Gagal mengambil data." }, { quoted: msg });
  }
};
