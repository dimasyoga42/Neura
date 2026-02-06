export const Loli = (sock, chatId, msg, text) => {
  try {
    sock.sendMessage(chatId, { image: { url: "https://api.deline.web.id/random/loli" } }, { quoted: msg })
  } catch (error) {
    sock.sendMessage(chatId, { text: error }, { quoted: msg })
  }
}
