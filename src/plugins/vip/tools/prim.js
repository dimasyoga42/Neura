import axios from "axios";

export const artiNama = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace(".artinama", "");
    if (!name) return sock.sendMessage(chatId, { text: "mana namanya" }, { quoted: msg });
    const res = await axios.get(`https://api.neoxr.eu/api/artinama?q=${encodeURIComponent(name)}&apikey=${process.env.NEOXR_KEY}`)
    const data = res.data.data
    sock.sendMessage(chatId, { text: data.result }, { quoted: msg })
  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg })
  }
}
