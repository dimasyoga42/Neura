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
    const arg = text.split(",");
    const element = arg[1]
    const hadiah = arg[2]
    if (!element || !hadiah) return sock.sendMessage(chatId, { text: "sususnan cmd anda tidak sesuai\n> use !creatRaid <element> <hadiah>" }, { quoted: msg })
    if (isBan(sock, chatId, msg)) return;
    createRaid(sock, chatId, msg, text, element, hadiah);
  }


}
