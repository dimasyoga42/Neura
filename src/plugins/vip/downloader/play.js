import fetch from "node-fetch";

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

    // Cari video di YouTube
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

    // Download audio dari API
    const dl = await fetch(
      `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
    );
    const dlJson = await dl.json();

    if (!dlJson.status || !dlJson.result || !dlJson.result.dlink) {
      return await sock.sendMessage(
        chatId,
        { text: "Downloader gagal." },
        { quoted: msg },
      );
    }

    const audioUrl = dlJson.result.dlink;

    // Sanitasi nama file agar aman
    const safeFileName = video.title.replace(/[<>:"/\\|?*]+/g, "").trim();

    // Kirim info video
    await sock.sendMessage(
      chatId,
      {
        image: { url: video.thumbnail },
        caption: `*${video.title}*\n\nChannel: ${video.author.name}\nDurasi: ${video.timestamp}\nViews: ${video.views}\n\nSedang mengirim audio...`,
      },
      { quoted: msg },
    );

    // Kirim audio
    return await sock.sendMessage(
      chatId,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        fileName: `${safeFileName}.mp3`,
      },
      { quoted: msg },
    );
  } catch (e) {
    console.error("Error di fungsi play:", e.message);
    return await sock.sendMessage(
      chatId,
      { text: "Terjadi error saat memproses." },
      { quoted: msg },
    );
  }
};
