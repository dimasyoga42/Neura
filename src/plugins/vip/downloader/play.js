export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(/^\.\w+\s+/, "").trim();
    if (!query) {
      return sock.sendMessage(
        chatId,
        { text: "Masukkan judul lagu." },
        { quoted: msg },
      );
    }

    // 1. Pencarian YouTube
    const searchResponse = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(query)}`,
    );
    const searchResult = await searchResponse.json();

    if (!searchResult.status || !searchResult.data) {
      return sock.sendMessage(
        chatId,
        { text: "Pencarian gagal." },
        { quoted: msg },
      );
    }

    const videoUrl = searchResult.data.find((v) => v.type === "video")?.url;

    // 2. Mendapatkan Data Download
    const dlResponse = await fetch(
      `https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(videoUrl)}`,
    );
    const dlJson = await dlResponse.json();

    /* EKSTRAKSI URL AUDIO LANGSUNG:
       Sesuai struktur JSON Anda, target berada di:
       data[0].data[0].url (array yang berisi daftar format)
    */
    const videoGroup = dlJson.data?.find((g) => g.type === "video");
    const formatList = videoGroup?.data?.[0]?.url; // Ini adalah array berisi berbagai format

    if (!formatList || !Array.isArray(formatList)) {
      return sock.sendMessage(
        chatId,
        { text: "Format audio tidak ditemukan." },
        { quoted: msg },
      );
    }

    // Mencari format yang merupakan audio murni (audio: true)
    // Berdasarkan JSON Anda, itag 140 (m4a 130kbps) atau 139 (m4a 50kbps)
    const audioFormat =
      formatList.find((f) => f.audio === true && f.ext === "m4a") ||
      formatList.find((f) => f.audio === true);

    const finalAudioUrl = audioFormat?.url;

    if (!finalAudioUrl) {
      return sock.sendMessage(
        chatId,
        { text: "Gagal mendapatkan tautan audio langsung." },
        { quoted: msg },
      );
    }

    // 3. Metadata untuk Caption
    const meta = videoGroup.data[0].meta;

    await sock.sendMessage(
      chatId,
      {
        image: { url: videoGroup.data[0].thumb },
        caption: `*${meta.title}*

Durasi: ${meta.duration}
Kualitas: ${audioFormat.subname || audioFormat.quality} kbps
Ukuran: ${(audioFormat.filesize / (1024 * 1024)).toFixed(2)} MB

Mengirim audio langsung dari server...`,
      },
      { quoted: msg },
    );

    // 4. Pengiriman Audio
    return await sock.sendMessage(
      chatId,
      {
        audio: { url: finalAudioUrl },
        mimetype: "audio/mp4", // Menggunakan m4a sesuai ekstensi di JSON
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (error) {
    console.error("Detail Error:", error);
    return sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan sistem saat mengambil data." },
      { quoted: msg },
    );
  }
};
