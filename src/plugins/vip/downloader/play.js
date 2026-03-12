export const play = async (sock, chatId, msg, text) => {
  try {
    // Ekstraksi query pencarian
    const query = text.replace(".play", "").trim();
    if (!query) {
      return sock.sendMessage(
        chatId,
        { text: "Silakan masukkan judul lagu." },
        { quoted: msg },
      );
    }

    // 1. Pencarian Video (Mendapatkan URL YouTube)
    const searchResponse = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
    );
    const searchData = await searchResponse.json();

    if (!searchData.status || !searchData.data) {
      return sock.sendMessage(
        chatId,
        { text: "Pencarian gagal." },
        { quoted: msg },
      );
    }

    const video = searchData.data[0];
    if (!video)
      return sock.sendMessage(
        chatId,
        { text: "Video tidak ditemukan." },
        { quoted: msg },
      );

    // 2. Request ke API Downloader ytmp3
    const dlResponse = await fetch(
      `https://api.deline.web.id/downloader/ytmp3?url=${encodeURIComponent(video.url)}`,
    );
    const dlJson = await dlResponse.json();

    if (!dlJson.status || !dlJson.result) {
      return sock.sendMessage(
        chatId,
        { text: "Gagal mengambil data dari server downloader." },
        { quoted: msg },
      );
    }

    /* EKSTRAKSI DATA AUDIO:
       Sesuai JSON: dlJson.result.dlink
    */
    const finalAudioUrl = dlJson.result.dlink;
    const info = dlJson.result.youtube;
    const detail = dlJson.result.pick;

    // 3. Mengirim Metadata Video
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

    // 4. Mengirim File Audio
    return await sock.sendMessage(
      chatId,
      {
        audio: { url: finalAudioUrl },
        mimetype: "audio/mpeg",
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (error) {
    console.error("Error Detail:", error);
    return sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan internal sistem." },
      { quoted: msg },
    );
  }
};
