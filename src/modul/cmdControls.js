import { menuMessage } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
export const cmdMenucontrol = (sock, chatId, msg, text) => {
  if (!isBan(sock, chatId, msg)) return;
  if (text.startsWith("!menu")) return sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg });

}
