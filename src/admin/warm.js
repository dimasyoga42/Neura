import { getUserData, saveUserData } from "../config/func.js";
import path from "path";

const db = path.resolve("database", "warm.json");

const getGroup = (chatId) => {
  const data = getUserData(db) || {};
  return { data, group: data[chatId] || [] };
};

const saveGroup = (chatId, group) => {
  const { data } = getGroup(chatId);
  saveUserData(db, { ...data, [chatId]: group });
};

export const setWarm = async (sock, chatId, msg) => {
  try {
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mention.length)
      return sock.sendMessage(chatId, { text: "Gunakan: .warn @user" }, { quoted: msg });

    const target = mention[0];
    const { group } = getGroup(chatId);
    let user = group.find((u) => u.id === target);

    if (!user) { user = { id: target, warn: 0 }; group.push(user); }
    user.warn += 1;
    saveGroup(chatId, group);

    if (user.warn >= 10) {
      await sock.sendMessage(chatId, { text: `@${target.split("@")[0]} mencapai 10 warn dan dikeluarkan.`, mentions: [target] }, { quoted: msg });
      await sock.groupParticipantsUpdate(chatId, [target], "remove");
      saveGroup(chatId, group.filter((u) => u.id !== target));
      return;
    }

    sock.sendMessage(chatId, { text: `@${target.split("@")[0]} diperingatkan! Warn: ${user.warn}/10`, mentions: [target] }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};

export const listWarn = async (sock, chatId, msg) => {
  try {
    const { group } = getGroup(chatId);
    if (!group.length)
      return sock.sendMessage(chatId, { text: "Tidak ada data warn." }, { quoted: msg });

    const text = "List Warn\n\n" + group.map((u, i) => `${i + 1}. @${u.id.split("@")[0]} - ${u.warn}/10`).join("\n");
    sock.sendMessage(chatId, { text, mentions: group.map((u) => u.id) }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};

export const delWarn = async (sock, chatId, msg) => {
  try {
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mention.length)
      return sock.sendMessage(chatId, { text: "Gunakan: .delwarn @user" }, { quoted: msg });

    const target = mention[0];
    const { group } = getGroup(chatId);
    saveGroup(chatId, group.filter((u) => u.id !== target));

    sock.sendMessage(chatId, { text: `Warn @${target.split("@")[0]} dihapus.`, mentions: [target] }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};