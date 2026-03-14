import path from "path";
import { getUserData, saveUserData } from "../config/func.js";
const db = path.resolve("database", "mute.json");

const getExp = (minute) => {
  const m = parseInt(minute);
  if (isNaN(m) || m <= 0) return null;

  const now = new Date();
  now.setMinutes(now.getMinutes() + m);

  return now.toISOString();
};

export const muteUser = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ");
    const minute = arg[2];
    const mention =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mention.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "gunakan .mute @user menit" },
        { quoted: msg },
      );
    }

    const target = mention[0];

    const expDate = getExp(minute);

    if (!expDate) {
      return sock.sendMessage(
        chatId,
        { text: "Masukkan waktu mute yang valid." },
        { quoted: msg },
      );
    }

    const data = getUserData(db);

    let user = data.find((u) => u.id === target);

    if (!user) {
      user = {
        id: target,
        expired: expDate,
      };
      data.push(user);
    } else {
      user.expired = expDate;
    }

    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      {
        text: `User dimute selama ${minute} menit`,
        mentions: [target],
      },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};

export const unmuteUser = async (sock, chatId, msg) => {
  try {
    const mention =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mention.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "gunakan .unmute @user" },
        { quoted: msg },
      );
    }

    const target = mention[0];

    const data = getUserData(db);

    const filtered = data.filter((u) => u.id !== target);

    saveUserData(db, filtered);

    sock.sendMessage(
      chatId,
      {
        text: "🔊 User sudah diunmute",
        mentions: [target],
      },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};

export const isMuted = (msg) => {
  const sender = msg.key.participant || msg.key.remoteJid;

  const data = getUserData(db);

  const user = data.find((u) => u.id === sender);

  if (!user) return false;

  const now = new Date();
  const expired = new Date(user.expired);

  if (expired < now) {
    const filtered = data.filter((u) => u.id !== sender);
    saveUserData(db, filtered);
    return false;
  }

  return true;
};
