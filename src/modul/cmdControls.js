import { buffMessage, menuMessage } from "../config/variabel.js";
import { isBan } from "../plugins/fitur/ban.js"
import { createRaid } from "../plugins/toram/raidControl.js";
export const cmdMenucontrol = (sock, chatId, msg, text) => {
  if (text.startsWith("!menu")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg });
  }
  if (text.startsWith("!buff")) {
    if (isBan(sock, chatId, msg)) return;
    sock.sendMessage(chatId, { text: buffMessage }, { quoted: msg });
  }
  if (text.startsWith("!creatRaid")) {
    if (isBan(sock, chatId, msg)) return;
    createRaid(sock, chatId, msg, text);
  }


}
