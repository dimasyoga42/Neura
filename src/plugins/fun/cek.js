export const cek = (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!cek", "");
    if (!arg) return sock.sendMessage(chatId, { text: "mana textnya?\n> gunakan !cek ganteng/cantik dll" }, { quoted: msg });
    const count = Math.floor(Math.random() * 101);
    sock.sendMessage(chatId, { text: `ke ${arg} sebesar ${count}%` }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: "server internal error, `${err}`" }, { quoted: msg })
  }
}
