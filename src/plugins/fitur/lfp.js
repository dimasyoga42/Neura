import { getUserData, saveUserData } from "./../../config/func.js";
import path from "path";

const db = path.resolve("db", "userLfp.json");

export const setLfp = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ");
    const nameParty = arg[1];
    const leaderParty = arg[2];

    const data = getUserData(db);
    let userLavid = data.find((item) => item.id === chatId);

    if (!userLavid) {
      const newData = {
        id: chatId,
        name: nameParty,
        leaderParty: leaderParty,
        party: [],
      };
      data.push(newData);
      saveUserData(db, data);
      sock.sendMessage(
        chatId,
        {
          text: `anda berhasil membuat party\nNama:${nameParty}\nLeader:${leaderParty}\nGunakan .accpt (nama)`,
        },
        { quoted: msg },
      );
    } else {
      sock.sendMessage(
        chatId,
        { text: "anda subah membuat party" },
        { quoted: msg },
      );
    }
  } catch (error) {
    console.log(error);
    return sock.sendMessage(chatId, { text: error.message }, { quoted: msg });
  }
};
