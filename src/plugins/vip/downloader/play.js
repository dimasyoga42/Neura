import axios from "axios";

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace("!play", "");
    if (!query) return sock.sendMessage(chatId, { text: "mana judul lagunya?" }, { quoted: msg });
    const res = await axios.get(`https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`);
    const data = res.data.result
    console.log(data)
    const messagePlay = `
    name: ${data.title}
    url: ${data.url}
    size: ${data.pick.size}
    `
    sock.sendMessage(chatId, { text: messagePlay }, { quoted: msg });
    sock.sendMessage(chatId, { audio: { url: `${data.dlink}` }, mimetype: 'audio/mp4' }, { quoted: msg });
  } catch (err) {

  }
}
