import fs from "fs";
import path from "path";

// Pastikan direktori file tujuan ada
const ensureDir = (dbPath) => {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Ambil data dari file
export function getUserData(path) {
  try {
    const data = fs.readFileSync(path, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Gagal membaca file:", err);
    return [];
  }
}

// Simpan data ke file
export const saveUserData = (dbPath, data) => {
  try {
    ensureDir(dbPath);
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing to ${dbPath}:`, err);
  }
};
