import { getUserData, saveUserData } from "../config/func.js";
import path from "path";

const db = path.resolve("database", "warm.json");

export const setWarm = async (sock, chatId, msg) => {
  try {
    const mention =
      msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (mention.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "gunakan .warm @user" },
        { quoted: msg },
      );
    }

    const target = mention[0];

    const data = getUserData(db);
    console.log(data);

    let userWarn = data.find((user) => user.id === target);

    if (!userWarn) {
      userWarn = {
        id: target,
        warn: 1,
      };
      data.push(userWarn);
    } else {
      userWarn.warn = userWarn.warn + 1;
    }

    const warnCount = userWarn.warn;

    saveUserData(db, data);

    if (warnCount >= 10) {
      await sock.sendMessage(
        chatId,
        {
          text: `User mencapai 10 warn dan akan dikeluarkan dari grup.`,
          mentions: [target],
        },
        { quoted: msg },
      );

      await sock.groupParticipantsUpdate(chatId, [target], "remove");

      const filtered = data.filter((user) => user.id !== target);
      saveUserData(db, filtered);

      return;
    }

    await sock.sendMessage(
      chatId,
      {
        text: `User diberi peringatan\nTotal warn: ${warnCount}/10`,
        mentions: [target],
      },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};
