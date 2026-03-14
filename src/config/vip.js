import path from "path";
import { getUserData, saveUserData } from "./func.js";
const dbPath = path.resolve("database", "vip.json");

const getExp = (durationInDays) => {
  const days = parseInt(durationInDays, 10);

  // Guard: harus angka valid, minimal 1, maksimal 3650 hari (10 tahun)
  if (isNaN(days) || days <= 0 || days > 3650) return null;

  const expMs = Date.now() + days * 24 * 60 * 60 * 1000;
  return new Date(expMs).toISOString();
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getIdGrub = async (sock, chatId, msg) => {
  const grubId = msg.key.remoteJid;

  await sock.sendMessage(
    chatId,
    { text: `ID GRUB: ${grubId}` },
    { quoted: msg },
  );
};

export const vipRegister = async (sock, chatId, msg, text) => {
  try {
    const idGrub = msg.key.remoteJid;

    // Guard: pastikan text adalah string
    if (typeof text !== "string") {
      console.error("[VIP REGISTER] text bukan string:", typeof text, text);
      await sock.sendMessage(
        chatId,
        { text: "Format perintah tidak valid." },
        { quoted: msg },
      );
      return;
    }

    const day = text.replace(".setvip", "").trim();

    // Guard: pastikan day tidak kosong
    if (!day) {
      await sock.sendMessage(
        chatId,
        { text: "Masukkan jumlah hari. Contoh: .setvip 30" },
        { quoted: msg },
      );
      return;
    }

    console.log("[VIP REGISTER] day input:", JSON.stringify(day));

    const expDate = getExp(day);

    if (!expDate) {
      await sock.sendMessage(
        chatId,
        { text: "Gagal menambahkan VIP. Masukkan hari yang valid (1-3650)." },
        { quoted: msg },
      );
      return;
    }

    const data = getUserData(dbPath);
    const now = new Date().toISOString();

    let user = data.find((entry) => entry.grubID === idGrub);

    if (!user) {
      user = { grubID: idGrub, registered: now, expired: expDate };
      data.push(user);
    } else {
      user.registered = now;
      user.expired = expDate;
    }

    saveUserData(dbPath, data);

    const caption = `
*Info Vip*
│ *•day*: ${day} day
│ *•exp*: ${formatDate(expDate)}
\n> By: Neura Sama`.trim();

    await sock.sendMessage(chatId, { text: caption }, { quoted: msg });
  } catch (err) {
    console.error("[VIP REGISTER ERROR]:", err);
    await sock.sendMessage(
      chatId,
      { text: "Terjadi error saat mendaftarkan VIP." },
      { quoted: msg },
    );
  }
};

export const chackVip = async (sock, msg, chatId) => {
  const grubId = msg.key.remoteJid;

  const data = getUserData(dbPath);
  const user = data.find((entry) => entry.grubID === grubId);

  if (!user) return false;

  const now = new Date();
  const expired = new Date(user.expired);

  if (expired < now) {
    const filtered = data.filter((entry) => entry.grubID !== grubId);
    saveUserData(dbPath, filtered);
    return false;
  }

  return true;
};

export const cleanExpiredVip = () => {
  const data = getUserData(dbPath);
  const now = new Date();

  const filtered = data.filter((entry) => {
    const exp = new Date(entry.expired);
    return exp > now;
  });

  if (filtered.length !== data.length) {
    saveUserData(dbPath, filtered);
    console.log(`[VIP] ${data.length - filtered.length} data expired dihapus.`);
  }
};

export const cekvip = async (sock, chatId, msg) => {
  try {
    const grubId = msg.key.remoteJid;

    const data = getUserData(dbPath);
    const user = data.find((entry) => entry.grubID === grubId);

    if (!user) {
      return sock.sendMessage(
        chatId,
        { text: "Grup ini bukan VIP." },
        { quoted: msg },
      );
    }

    const now = new Date();
    const expired = new Date(user.expired);

    if (expired < now) {
      const filtered = data.filter((entry) => entry.grubID !== grubId);
      saveUserData(dbPath, filtered);
      return sock.sendMessage(
        chatId,
        { text: "VIP grup ini sudah expired." },
        { quoted: msg },
      );
    }

    return sock.sendMessage(
      chatId,
      {
        text: `
*VIP STATUS*
│ Status : Aktif
│ Expired : ${formatDate(user.expired)}
`.trim(),
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("[CEK VIP ERROR]:", err);
    return sock.sendMessage(chatId, { text: "Error" }, { quoted: msg });
  }
};

export const trialGive = async (sock, chatId, msg, id) => {
  try {
    const expDate = getExp(1);
    const now = new Date().toISOString();

    const data = getUserData(dbPath);

    let user = data.find((entry) => entry.grubID === id);

    if (!user) {
      user = { grubID: id, registered: now, expired: expDate };
      data.push(user);
    } else {
      user.registered = now;
      user.expired = expDate;
    }

    saveUserData(dbPath, data);

    await sock.sendMessage(
      chatId,
      {
        text: `
*TRIAL VIP*
│ Status : Aktif
│ Expired : ${formatDate(expDate)}
`,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("[TRIAL GIVE ERROR]:", err);
    await sock.sendMessage(
      chatId,
      { text: "Terjadi error saat memberikan trial." },
      { quoted: msg },
    );
  }
};
