import { channel } from "diagnostics_channel";
import { registerCommand } from "../../../setting.js";
import { isAdminvalid } from "../../admin/controlAdmin.js";
import { isBan } from "../fitur/ban.js";
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
