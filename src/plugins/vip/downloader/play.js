import axios from "axios";

const api = axios.create({
  baseURL: "https://api.deline.web.id",
  headers: {
    Accept: "application/json",
  },
});

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(".play", "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "Mana judul lagunya?" },
        { quoted: msg },
      );
    }

    await sock.sendMessage(
      chatId,
      { text: `Mencari lagu: *${query}*` },
      { quoted: msg },
    );

    const res = await api.get(
      `/downloader/ytplay?q=${encodeURIComponent(query)}`,
    );

    if (!res?.data?.status || !res?.data?.result) {
      return await sock.sendMessage(
        chatId,
        { text: "Maaf, lagu tidak ditemukan." },
        { quoted: msg },
      );
    }

    const data = res.data.result;

    if (!data.dlink) {
      return await sock.sendMessage(
        chatId,
        { text: "Link download tidak tersedia." },
        { quoted: msg },
      );
    }

    const caption = `
*Informasi Lagu*
Judul: ${data.title}
URL: ${data.url}
Kualitas: ${data.pick?.quality}
Ukuran: ${data.pick?.size}
Format: ${data.pick?.ext}
    `.trim();

    await sock.sendMessage(
      chatId,
      {
        image: { url: data.thumbnail },
        caption,
      },
      { quoted: msg },
    );

    await sock.sendMessage(
      chatId,
      {
        audio: { url: data.dlink },
        mimetype: "audio/mpeg",
        fileName: `${data.title}.mp3`,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("Error di play command:", err?.response?.data || err.message);

    await sock.sendMessage(
      chatId,
      {
        text: `❌ Terjadi kesalahan: ${
          err?.response?.data?.message ||
          err.message ||
          "Tidak dapat memutar lagu"
        }`,
      },
      { quoted: msg },
    );
  }
};

export const ytmp3 = async (sock, chatId, msg, text) => {
  try {
    const urlDat = text.replace(".ytmp3", "");
    if (!urlDat)
      return sock.sendMessage(
        chatId,
        { text: "mana link youtubenya" },
        { quoted: msg },
      );
    const res = await axios.get(
      `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(urlDat)}`,
    );
    const data = res.data.result;
    if (!data)
      return sock.sendMessage(
        chatId,
        { text: "gagal memproses" },
        { quoted: msg },
      );
    const messagePlay = `
    *music downloaded*
    name: ${data.youtube.title}
    url: ${data.youtube.url}
    `.trim();
    sock.sendMessage(
      chatId,
      { image: { url: `${data.youtube.thumbnail}` }, caption: messagePlay },
      { quoted: msg },
    );
    sock.sendMessage(
      chatId,
      { audio: { url: `${data.dlink}` }, mimetype: "audio/mp4" },
      { quoted: msg },
    );
  } catch (err) {}
};
