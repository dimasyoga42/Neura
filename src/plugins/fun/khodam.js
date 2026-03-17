import axios from "axios";
import { Resapi } from "../../../setting.js";
import { sendText } from "../../lib/message.js";

export const newkhodam = async (sock, chatId, msg) => {
  try {
    const data = await axios.get(
      `https://api.neoxr.eu/api/khodam?apikey=${process.env.NOXER}`,
    );
    const result = data.data;
    console.log(result);
    sendText(sock, chatId, `${result.data.name} ${result.data.meaning}`, msg);
  } catch (err) {
    console.error("Error pada fungsi newkhodam:", err);
    await sock.sendMessage(
      chatId,
      { text: `Terjadi kesalahan: ${err.message}` },
      { quoted: msg },
    );
  }
};
