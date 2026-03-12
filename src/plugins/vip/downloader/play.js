export const play = async (sock, chatId, msg, text) => {
  try {
    // Membersihkan prefix untuk mendapatkan kata kunci pencarian yang murni
    const msc = text.replace(/^\.\w+\s+/, "").trim();
    if (!msc) {
      return sock.sendMessage(
        chatId,
        {
          text: "Silakan masukkan judul lagu atau kata kunci pencarian.\n\nContoh: .play dia",
        },
        { quoted: msg },
      );
    }

    // Tahap 1: Pencarian Video melalui YouTube API
    const searchResponse = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(msc)}`,
    );
    const searchResult = await searchResponse.json();

    if (
      !searchResult.status ||
      !searchResult.data ||
      searchResult.data.length === 0
    ) {
      return sock.sendMessage(
        chatId,
        { text: "Pencarian gagal atau video tidak ditemukan." },
        { quoted: msg },
      );
    }

    const videoData = searchResult.data.find((v) => v.type === "video");
    if (!videoData) {
      return sock.sendMessage(
        chatId,
        { text: "Entitas video tidak ditemukan." },
        { quoted: msg },
      );
    }

    // Tahap 2: Mendapatkan Tautan Unduh melalui Savefrom API
    const downloadResponse = await fetch(
      `https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(videoData.url)}`,
    );
    const downloadResult = await downloadResponse.json();

    /* PENYESUAIAN STRUKTUR JSON:
      Berdasarkan data yang Anda berikan, audio berada di:
      downloadResult.data[0].data[0].stream.mp3['320'].url
    */
    const videoGroup = downloadResult.data?.find(
      (group) => group.type === "video",
    );
    const downloadInfo = videoGroup?.data?.[0];

    if (!downloadInfo) {
      return sock.sendMessage(
        chatId,
        { text: "Gagal mengekstraksi informasi unduhan." },
        { quoted: msg },
      );
    }

    // Menentukan URL Audio dengan fallback kualitas (320k -> 256k -> 192k)
    const mp3Options = downloadInfo.stream?.mp3;
    const selectedMp3 =
      mp3Options?.["320"] || mp3Options?.["256"] || mp3Options?.["192"];

    // Penanganan Local Converter jika URL utama tidak tersedia secara langsung
    let finalAudioUrl = selectedMp3?.url;
    if (finalAudioUrl === "#local-converter" || !finalAudioUrl) {
      // Menggunakan data converter jika URL fisik tidak langsung diberikan
      finalAudioUrl = `https://api.siputzx.my.id/api/d/convert?data=${encodeURIComponent(downloadInfo.mp3Converter)}`;
    }

    // Tahap 3: Pengiriman Metadata dan Thumbnail
    await sock.sendMessage(
      chatId,
      {
        image: { url: downloadInfo.thumb || videoData.thumbnail },
        caption: `🎵 *${downloadInfo.meta?.title || videoData.title}*

👤 Kanal: ${videoData.author.name}
⏱ Durasi: ${downloadInfo.meta?.duration || videoData.timestamp}
👀 Penayangan: ${videoData.views.toLocaleString()}

⏳ Sedang memproses pengiriman audio, mohon tunggu...`,
      },
      { quoted: msg },
    );

    // Tahap 4: Pengiriman File Audio (Buffer/URL)
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
    console.error("Error pada fungsi play:", error);
    return sock.sendMessage(
      chatId,
      {
        text: "Terjadi kesalahan sistemis saat mencoba memproses permintaan Anda.",
      },
      { quoted: msg },
    );
  }
};
