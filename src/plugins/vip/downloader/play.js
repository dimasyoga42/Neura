export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(".play", "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "Silakan masukkan judul lagu." },
        { quoted: msg },
      );
    }

    const searchResponse = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
    );

    if (!searchResponse.ok) {
      throw new Error("Search API tidak merespon.");
    }

    const searchData = await searchResponse.json();

    if (
      !searchData?.status ||
      !Array.isArray(searchData?.data) ||
      !searchData.data.length
    ) {
      return await sock.sendMessage(
        chatId,
        { text: "Video tidak ditemukan." },
        { quoted: msg },
      );
    }

    const video = searchData.data[0];

    const dlResponse = await fetch(
      `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
    );

    if (!dlResponse.ok) {
      throw new Error("Downloader API tidak merespon.");
    }

    const dlJson = await dlResponse.json();

    if (!dlJson?.status || !dlJson?.result?.dlink) {
      return await sock.sendMessage(
        chatId,
        { text: "Gagal mengambil audio dari server downloader." },
        { quoted: msg },
      );
    }

    const finalAudioUrl = dlJson.result.dlink;
    const info = dlJson.result.youtube;
    const detail = dlJson.result.pick;

    await sock.sendMessage(
      chatId,
      {
        image: { url: info.thumbnail },
        caption: `*${info.title}*

Ukuran: ${detail.size}
Kualitas: ${detail.quality}
Format: ${detail.ext}

Sedang mengirim audio, mohon tunggu...`,
      },
      { quoted: msg },
    );

    return await sock.sendMessage(
      chatId,
      {
        audio: { url: finalAudioUrl },
        mimetype: "audio/mpeg",
        fileName: `${info.title}.mp3`,
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (error) {
    console.error("PLAY ERROR:", error);

    return await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan internal sistem." },
      { quoted: msg },
    );
  }
};
