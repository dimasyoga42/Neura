import { sendIAMessage } from "../../proto.js"
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

      const buttons = [{
        name: "quick_reply",
        buttonParamsJson: {
          display_text: "Menu",
          id: '.menu'
        }
      }]

      try {
        // Memastikan sock tersedia dan memiliki user.id
        if (!sock?.user?.id) throw new Error('Socket connection is not ready or user.id is missing')

        const result = await sendIAMessage(sock, chatId, buttons, {
          content: 'Halo! Pilih menu:',
          footer: '© MyBot',
          header: 'Interactive System'
        })

        console.log('✅ Button sent successfully! Message ID:', result.key.id)
      } catch (error) {
        // Logging error yang lebih mendalam untuk troubleshooting
        console.error('❌ Failed to send button. Technical Details:', error.message)
        if (error.stack) console.debug(error.stack)
      }
    }

  } catch (err) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat mengirim pesan" }, { quoted: msg })
  }
}
