import path from "path";
import { getUserData, saveUserData } from "./func.js";
const dbPath = path.resolve("database", "vip.json");

const getExp = (durationInDays) => {
  const days = parseInt(durationInDays);
  if (isNaN(days) || days <= 0) return null;

  const now = new Date();

  const jakartaOffset = 7 * 60 * 60 * 1000;
  const jakartaNow = new Date(now.getTime() + jakartaOffset);

  jakartaNow.setDate(jakartaNow.getDate() + days);

  return jakartaNow.toISOString();
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
    {
      text: `ID GRUB: ${grubId}\n\n> By: Karina bot`,
    },
    { quoted: msg },
  );
};

export const vipRegister = async (sock, chatId, msg, idGrub, day) => {
  try {
    const expDate = getExp(day);

    if (!expDate) {
      await sock.sendMessage(
        chatId,
        {
          text: "Gagal menambahkan VIP. Masukkan hari yang valid.",
        },
        { quoted: msg },
      );
      return;
    }

    const data = getUserData(dbPath);
    const now = new Date().toISOString();

    let user = data.find((entry) => entry.grubID === idGrub);

    if (!user) {
      user = {
        grubID: idGrub,
        registered: now,
        expired: expDate,
      };
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
    errMessage(sock, chatId, msg, err);
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
      user = {
        grubID: id,
        registered: now,
        expired: expDate,
      };
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
    errMessage(sock, chatId, msg, err);
  }
};
