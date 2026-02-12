import { replyButton } from "../../proto.js"
import { xsubMenu } from "../config/variabel.js"
export const subMenu = async (sock, chatId, msg, text) => {
  try {
    if (text.startsWith(".menuadmin")) {
      sock.sendMessage(chatId, { text: xsubMenu.menuadmin }, { quoted: msg })
    }
    if (text.startsWith(".menugrub")) {
      sock.sendMessage(chatId, { text: xsubMenu.menugrub }, { quoted: msg })
    }
    if (text.startsWith(".menutoram")) {
      sock.sendMessage(chatId, { text: xsubMenu.menutoram }, { quoted: msg })
    }
    if (text.startsWith(".menufun")) {
      sock.sendMessage(chatId, { text: xsubMenu.menufun }, { quoted: msg })
    }
    if (text.startsWith(".menutools")) {
      sock.sendMessage(chatId, { text: xsubMenu.menutools }, { quoted: msg })
    }
    if (text.startsWith(".btn")) {
      console.log('✅ Button command detected! Target JID:', chatId)
      await replyButton(sock, chatId, [
        { text: "Menu", command: ".menu" },
        { text: "Toram", command: ".menutoram" },
        { text: "Fun", command: ".menufun" }
      ], {
        header: "Quick Menu",
        content: "Pilih:",
        footer: "© MyBot"
      }, msg)
    }

  } catch (err) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat mengirim pesan" }, { quoted: msg })
  }
}
