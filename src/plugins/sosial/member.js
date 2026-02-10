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


export const listMember = async (sock, chatId, msg) => {
  try {
    const data = getUserData(db);
    const userdata = data.find((item) => item.id === chatId);

    if (!userdata || !userdata.member || userdata.member.length === 0) {
      return sock.sendMessage(chatId, {
        text: "Belum ada member yang terdaftar di grup ini"
      }, { quoted: msg });
    }

    let message = "*DAFTAR MEMBER*";

    userdata.member.forEach((member, index) => {
      message += `${index + 1}. IGN: ${member.ign} -  @${member.owner.split('@')[0]}\n`;
    });

    message += `Total: ${userdata.member.length} member`;

    // Extract semua owner untuk mentions
    const mentions = userdata.member.map(m => m.owner);

    sock.sendMessage(chatId, {
      text: message.trim(),
      mentions: mentions
    }, { quoted: msg });

  } catch (err) {
    sock.sendMessage(chatId, {
      text: `Error: ${err.message}`
    }, { quoted: msg });
  }
};
