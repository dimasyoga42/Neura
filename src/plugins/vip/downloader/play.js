import axios from "axios";

const api = axios.create({
  baseURL: "https://api.deline.web.id",
  timeout: 15000,
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
