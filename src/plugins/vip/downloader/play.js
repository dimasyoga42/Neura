export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(".play", "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "Masukkan judul lagu." },
        { quoted: msg },
      );
    }

    const res = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
    );

    const json = await res.json();

    if (!json.status || !json.data || !json.data.length) {
      return await sock.sendMessage(
        chatId,
        { text: "Video tidak ditemukan." },
        { quoted: msg },
      );
    }

    const video = json.data[0];

    const dl = await fetch(
      `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
    );

    const dlJson = await dl.json();

    if (!dlJson.status) {
      return await sock.sendMessage(
        chatId,
        { text: "Downloader gagal." },
        { quoted: msg },
      );
    }

    const audioUrl = dlJson.result.dlink;

    await sock.sendMessage(
      chatId,
      {
        image: { url: video.thumbnail },
        caption: `*${video.title}*

Channel: ${video.author.name}
Durasi: ${video.timestamp}
Views: ${video.views}

Sedang mengirim audio...`,
      },
      { quoted: msg },
    );

    return await sock.sendMessage(
      chatId,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${video.title}.mp3`,
      },
      { quoted: msg },
    );
  } catch (e) {
    console.error(e);
    return await sock.sendMessage(
      chatId,
      { text: "Terjadi error saat memproses." },
      { quoted: msg },
    );
  }
};
