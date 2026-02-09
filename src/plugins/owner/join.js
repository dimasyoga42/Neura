import { channel } from "diagnostics_channel";
import { registerCommand } from "../../../setting.js";
import { isAdminvalid } from "../../admin/controlAdmin.js";
import { isBan } from "../fitur/ban.js";

// ======================= SET DESK =======================
export const setDesk = async (sock, chatId, msg, text) => {
  try {
    if (await isBan(sock, chatId, msg)) return;

    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(chatId, { text: "khusus grup" }, { quoted: msg });
    }

    if (isAdminvalid(sock, chatId, msg)) return;

    const txt = text.replace(".setdesk", "").trim();
    if (!txt) {
      return sock.sendMessage(chatId, { text: "mana teks nya" }, { quoted: msg });
    }

    await sock.groupUpdateDescription(chatId, txt);

    await sock.sendMessage(
      chatId,
      { text: "deskripsi grub berhasil di ubah" },
      { quoted: msg }
    );
  } catch (error) {
    console.log(error);
  }
};

// ======================= GET UNDANGAN =======================
export const getUndangan = async (sock, chatId, msg) => {
  try {
    if (isBan(sock, chatId, msg)) return;

    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(chatId, { text: "khusus grup" }, { quoted: msg });
    }

    const code = await sock.groupInviteCode(chatId);
    const link = `https://chat.whatsapp.com/${code}`;

    await sock.sendMessage(
      chatId,
      { text: `link undangan grup:\n${link}` },
      { quoted: msg }
    );
  } catch (error) {
    console.log(error);
    sock.sendMessage(chatId, { text: "gagal ambil link" }, { quoted: msg });
  }
};

// ======================= JOIN VIA LINK (OWNER) =======================
export const join = async (sock, chatId, msg, text) => {
  try {
    const link = text.replace(".join", "").trim();
    if (!link) {
      return sock.sendMessage(chatId, { text: "masukan link grup" }, { quoted: msg });
    }

    const response = await sock.groupAcceptInvite(link)

    await sock.sendMessage(
      chatId,
      { text: code },
      { quoted: msg }
    );
  } catch (error) {
    console.log(error);
    sock.sendMessage(chatId, { text: "gagal join" }, { quoted: msg });
  }
};



registerCommand({
  name: "getlink",
  alias: ["link"],
  category: "Menu admin",
  desc: "mengambil link grub",
  run: async (sock, chatId, msg, args, text) => {
    if (isAdminvalid(sock, chatId, msg)) return;
    if (isBan(chatId, chatId, msg)) return;
    getUndangan(sock, chatId, msg)
  }
})
