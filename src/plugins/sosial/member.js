import path from "path";
import { getUserData, saveUserData } from "../../config/func.js";
const db = path.resolve("db", "member.js");

export const setMember = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ");
    const ign = arg[1];
    const user = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid;

    if (!user || user.length === 0) {
      return sock.sendMessage(chatId, { text: "tag pemilik akun" }, { quoted: msg });
    }
    if (!ign) {
      return sock.sendMessage(chatId, { text: "mana ign nya\n.setmem @target ign" }, { quoted: msg });
    }

    const data = getUserData(db);
    let userdata = data.find((item) => item.id === chatId); // Bug: harusnya === bukan !==

    if (!userdata) { // Bug: harusnya !userdata (jika tidak ditemukan)
      userdata = {
        id: chatId,
        member: []
      };
      data.push(userdata);
    }

    const newuser = {
      ign: ign,
      owner: user[0] // Ambil user pertama dari array mentionedJid
    };

    userdata.member.push(newuser);
    saveUserData(db, data);

    sock.sendMessage(chatId, { text: "member baru berhasil di masukan database" }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: `Error: ${err.message}` }, { quoted: msg });
  }
};
