import { sendImage } from "../../lib/message";

export const Loli = async (sock, chatId, msg, text) => {
  try {
    await sendImage(
      sock,
      chatId,
      "https://api.deline.web.id/random/loli",
      "ini loli buat kamu",
      msg,
    );
  } catch (error) {
    sock.sendMessage(chatId, { text: error }, { quoted: msg });
  }
};
