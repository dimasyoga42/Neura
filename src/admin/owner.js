import { ban, isOwner } from "../plugins/fitur/ban.js"

export const ownerControls = async (sock, chatId, msg, text) => {
  if (text.startsWith("!ban")) {
    if (!isOwner(sock, chatId, msg)) return;
    ban(sock, chatId, msg);

  }
}
