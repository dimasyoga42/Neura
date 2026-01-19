export const setPrefix = async (sock, chatId, msg, text) => {
  try {
    const px = text.replace("!Setprefix", "");

  } catch (error) {
    sock.sendMessage(chatId, { text: `[prefix error] ${error.message}` }, { quoted: msg })
  }
}
