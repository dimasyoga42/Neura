import axios from "axios";

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace("!play", "").trim();

    if (!query) {
      return sock.sendMessage(chatId, { text: "Mana judul lagunya?" }, { quoted: msg });
    }

    // Kirim pesan loading
    await sock.sendMessage(chatId, { text: "Mencari lagu..." }, { quoted: msg });

    // Perbaikan: gunakan tanda kurung biasa, bukan backtick
    const res = await axios.get(`https://api.deline.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`);
    const data = res.data.result;

    console.log(data);

    // Periksa apakah data tersedia
    if (!data || !data.dlink) {
      return sock.sendMessage(chatId, { text: "Maaf, lagu tidak ditemukan." }, { quoted: msg });
    }

    const messagePlay = `
*Informasi Lagu*

Judul: ${data.title}
URL: ${data.url}
Ukuran: ${data.pick?.size || data.size || 'N/A'}
    `.trim();

    await sock.sendMessage(chatId, { text: messagePlay }, { quoted: msg });
    await sock.sendMessage(chatId, {
      audio: { url: data.dlink },
      mimetype: 'audio/mp4'
    }, { quoted: msg });

  } catch (err) {
    console.error("Error di play command:", err);
    sock.sendMessage(chatId, {
      text: `❌ Terjadi kesalahan: ${err.message || 'Tidak dapat memutar lagu'}`
    }, { quoted: msg });
  }
};
