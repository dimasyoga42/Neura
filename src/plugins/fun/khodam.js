import { Resapi } from "../../../setting.js";

export const newkhodam = async (sock, chatId, msg) => {
  try {
    const data = await fetch(`${Resapi.neura}/etc/khodam`);
    const res = data.json;
    const message = res.result;
    const txt =
      `khodam kamu adalah ${message.data.khodam} kerena ${message.data.alasan}`.trim();

    sock.sendMessage(chatId, { text: txt }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};
