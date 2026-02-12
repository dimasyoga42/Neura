
import { xsubMenu } from "../config/variabel.js"
import { sendInteractiveMessage } from "../lib/simple.js"
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
    if (text === ".btn") {
      // Contoh pemanggilan di handler Anda
      await sendInteractiveMessage(sock, chatId, {
        title: "Halo Pengguna!",
        body: "Selamat datang di Neura Bot, silakan pilih menu:",
        footer: "© 2026 Neura Ecosystem",
        image: "https://picsum.photos/500",
        buttons: [
          {
            name: "quick_reply",
            buttonParamsJson: JSON.stringify({
              display_text: "Menu",
              id: ".menu"
            })
          }
        ]
      }, msg)
    }

  } catch (err) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat mengirim pesan" }, { quoted: msg })
    console.log(err)
  }
}
