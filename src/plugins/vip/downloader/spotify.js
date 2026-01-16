import axios from "axios";

export const Spotifysearch = async (sock, chatId, msg, text) => {
  try {
    const lagu = text.replace("!spotify", "");
    if (!lagu) return sock.sendMessage(chatId, { text: "mana judulnya?" }, { quoted: msg })
    sock.sendMessage(chatId, { text: `sedang mencari lagu: ${lagu}` })
    const response = await axios.get(`https://api.deline.web.id/downloader/spotifyplay?q=${decodeURIComponent(lagu)}`);
    const data = response.data
    if (!data) return sock.sendMessage(chatId, { text: "lagu tidak ditemukan" }, { quoted: msg })
    const messagetxt = `
    *Spotify Search*
    judul lagu: ${data.result.metadata.title}\nartis: ${data.result.metadata.artist}\ndurasi: ${data.result.metadata.duration}
    `.trim()
    console.log(data.dlink)
    sock.sendMessage(chatId, { image: { url: `${data.result.metadata.cover}` }, caption: messagetxt }, { quoted: msg });
    sock.sendMessage(chatId, { audio: { url: `${data.dlink}` }, mimetype: 'audio/mp3' }, { quoted: msg });


  } catch (error) {

  }
}
