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

export const delMem = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ");
    const targetIgn = arg[1];
    const mentionedUser = msg?.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];

    // Validasi input: Pengguna harus memberikan IGN atau melakukan tag/mention
    if (!targetIgn && !mentionedUser) {
      return sock.sendMessage(chatId, {
        text: "Mohon berikan identitas member yang ingin dihapus.\nFormat: .delmem @target atau .delmem <IGN>"
      }, { quoted: msg });
    }

    const data = getUserData(db);
    const groupData = data.find((item) => item.id === chatId);

    // Validasi keberadaan database grup
    if (!groupData || !groupData.member || groupData.member.length === 0) {
      return sock.sendMessage(chatId, { text: "Database member di grup ini masih kosong." }, { quoted: msg });
    }


    const memberIndex = groupData.member.findIndex((m) =>
      (targetIgn && m.ign.toLowerCase() === targetIgn.toLowerCase()) ||
      (mentionedUser && m.owner === mentionedUser)
    );

    if (memberIndex === -1) {
      return sock.sendMessage(chatId, { text: "Member tidak ditemukan dalam database grup ini." }, { quoted: msg });
    }


    const deletedMember = groupData.member.splice(memberIndex, 1)[0];

    saveUserData(db, data);

    const successMessage = `Member berhasil dihapus:\nIGN: ${deletedMember.ign}\nOwner: @${deletedMember.owner.split('@')[0]}`;

    sock.sendMessage(chatId, {
      text: successMessage,
      mentions: [deletedMember.owner]
    }, { quoted: msg });

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

    let message = "*DAFTAR MEMBER*\n";

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
