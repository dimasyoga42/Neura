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

    // Cari video
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
    let audioUrl;

    // Downloader utama
    try {
      const dl = await fetch(
        `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
      );
      const dlJson = await dl.json();
      if (dlJson.status && dlJson.result?.dlink) {
        audioUrl = dlJson.result.dlink;
      }
    } catch (err) {
      console.error("Downloader utama gagal:", err.message);
    }

    // Fallback: langsung ambil stream YouTube (itag 140 = m4a 128kbps)
    if (!audioUrl) {
      try {
        const ytRes = await fetch(
          `https://api.siputzx.my.id/api/s/ytstream?url=${encodeURIComponent(video.url)}`,
        );
        const ytJson = await ytRes.json();
        if (
          ytJson.success &&
          ytJson.data?.[0]?.stream?.mp3?.["320"]?.streams?.[0]
        ) {
          audioUrl = ytJson.data[0].stream.mp3["320"].streams[0];
        } else if (
          ytJson.success &&
          ytJson.data?.[0]?.stream?.mp3?.["192"]?.streams?.[0]
        ) {
          audioUrl = ytJson.data[0].stream.mp3["192"].streams[0];
        } else if (
          ytJson.success &&
          ytJson.data?.[0]?.stream?.mp3?.["128"]?.streams?.[0]
        ) {
          audioUrl = ytJson.data[0].stream.mp3["128"].streams[0];
        }
      } catch (err) {
        console.error("Fallback stream gagal:", err.message);
      }
    }

    if (!audioUrl) {
      return await sock.sendMessage(
        chatId,
        { text: "Downloader gagal di semua server." },
        { quoted: msg },
      );
    }

    const safeFileName = video.title.replace(/[<>:"/\\|?*]+/g, "").trim();

    await sock.sendMessage(
      chatId,
      {
        image: { url: video.thumbnail },
        caption: `*${video.title}*\n\nChannel: ${video.author.name}\nDurasi: ${video.timestamp}\nViews: ${video.views}\n\nSedang mengirim audio...`,
      },
      { quoted: msg },
    );

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
