import path from "path";
import { getUserData, saveUserData } from "../../config/func.js";

const db = path.resolve("db", "ban.json");
export const ban = async (sock, chatId, msg, mention) => {
  try {
    const data = await getUserData(db);
    const userValidation = data.find((user) => user.ban && user.ban.some((ban) => ban.userId === mention[0] && ban.value === true));
    if (userValidation) return sock.sendMessage(chatId, { text: `sudah dalam status banned` }, { quoted: msg });
    let dataSuspand = data.find((user) => user.id === mention);
    if (!dataSuspand) {
      dataSuspand = {
        id: mention[0],
        ban: [],
      };
      data.push(dataSuspand);
    }
    const newBan = {
      userId: mention[0],
      value: true,
      timestamp: new Date().toISOString(),
      bannedBy: msg.key.participant || msg.key.remoteJid,
    }
    dataSuspand.ban.push(newBan);
    saveUserData(db, data);
    sock.sendMessage(chatId, { text: "user telah di banned" }, { quoted: msg })
  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg });
  }
}

export const isBan = (sock, chatId, msg) => {
  try {
    const userId = msg.key.participant || msg.key.remoteJid;
    if (!userId) return false;

    const data = getUserData(db);
    const userData = data.find(
      (entry) => entry.ban && entry.ban.some((ban) => ban.userid === userId && ban.value === true)
    );
    if (userData) return sock.sendMessage(chatId, { text: "anda di ban" }, { quoted: msg });
    return !!userData;
  } catch (error) {
    console.error("Error in isBan function:", error);
    return false;
  }
};
export const isOwner = (sock, msg, chatId) => {
  const userJid = msg.key.participant || msg.key.remoteJid;
  const ownerNumber = "179573169848377@lid";
  console.log("User JID:", userJid);
  if (userJid !== ownerNumber) {
    sock.sendMessage(chatId, {
      text: "anda tidak bisa menggunakan cmd ini!!",
    });
    return false;
  }
  return true;
};

export const unBan = async (sock, chatId, msg) => {
  try {
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!mention || mention.length === 0) {
      await sock.sendMessage(chatId, {
        text: " Tag seseorang untuk unban!\n\nContoh: .unban @user",
      });
      return;
    }

    const target = mention[0];
    const getData = getUserData(db);

    const dataUserIndex = getData.findIndex((entry) => entry.id === target);
    if (dataUserIndex === -1)
      return sock.sendMessage(
        chatId,
        { text: "User tidak ditemukan dalam database." },
        { quoted: msg }
      );

    const user = getData[dataUserIndex];

    if (!user.ban || !Array.isArray(user.ban)) {
      return sock.sendMessage(
        chatId,
        { text: " User tidak memiliki data ban." },
        { quoted: msg }
      );
    }

    // Cek apakah user memang di-ban
    const isBanned = user.ban.some(
      (banEntry) => banEntry.userid === target && banEntry.value === true
    );
    if (!isBanned) {
      return sock.sendMessage(chatId, { text: "User ini tidak sedang diban." }, { quoted: msg });
    }

    // Unban
    user.ban = user.ban.map((banEntry) =>
      banEntry.userid === target ? { ...banEntry, value: false } : banEntry
    );

    fs.writeFileSync(dbPath, JSON.stringify(getData, null, 2));

    await sock.sendMessage(chatId, { text: " User berhasil di-unban." }, { quoted: msg });
  } catch (error) {
    console.error("Error in unBan function:", error);
    await sock.sendMessage(chatId, { text: " Terjadi kesalahan saat unban." }, { quoted: msg });
  }
};
