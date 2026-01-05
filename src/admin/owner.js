import { ban, isOwner } from "../plugins/fitur/ban.js"

export const ownerControls = async (sock, chatId, msg, text) => {
  if (text.startsWith("!ban")) {
    if (!isOwner(sock, chatId, msg)) return;
    const mention = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
    if (!mention || mention.length === 0) {
      await sock.sendMessage(chatId, {
        text: " Tag seseorang untuk unban!\n\nContoh: .unban @user",
      });
      return;
    }
    ban(sock, chatId, msg, mention);

  }
}
