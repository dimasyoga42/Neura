import { xsubMenu } from "../config/variabel.js"
import { sendIAMessage } from '../../proto.js'

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
      const buttons = [{
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Menu",
          id: '.menu'
        })
      }]

      await sendIAMessage(sock, jid, buttons, {
        content: 'Halo! Pilih menu:',
        footer: '© MyBot'
      })
    }
  } catch (err) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat mengirim pesan" }, { quoted: msg })
  }
}
