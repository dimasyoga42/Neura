import axios from "axios";

export const pin = async (sock, chatId, msg, text) => {
  try {
    const urlDat = text.replace("!pinterest", "");
    if (!urlDat) return sock.sendMessage(chatId, { text: "mana judulnya" }, { quoted: msg });
    sock.sendMessage(chatId, { text: "mohon tunggu.." }, { quoted: msg });
    const res = await axios.get(`https://api.deline.web.id/search/pinterest?q=${encodeURIComponent(urlDat)}`);
    const data = res.data.data;
    if (!data) return sock.sendMessage(chatId, { text: "gagal memproses" }, { quoted: msg });
    const random = Math.floor(Math.random() * data.length)
    const item = data[random]
    const messagePlay = `
    *Pintrest*
    name: ${item.caption}
    author: ${item.fullname}
    `.trim()
    sock.sendMessage(chatId, { image: { url: `${item.image}` }, caption: messagePlay }, { quoted: msg });

  } catch (err) {


  }
}
