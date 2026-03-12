const play = async (sock, chatId, msg, text) => {
  try {
    // Validasi input parameter teks untuk memastikan query pencarian tersedia
    if (!text) {
      return sock.sendMessage(
        chatId,
        {
          text: "Silakan masukkan judul lagu atau kata kunci pencarian.\n\nContoh: .play dia",
        },
        { quoted: msg },
      );
    }

    // Melakukan request ke API pencarian YouTube
    const searchResponse = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(text)}`,
    );
    const searchResult = await searchResponse.json();

    // Memastikan status respons sukses dan data tersedia dalam bentuk array
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

    // Mengambil entitas pertama yang bertipe video dari hasil pencarian
    const videoData = searchResult.data.find((v) => v.type === "video");
    if (!videoData) {
      return sock.sendMessage(
        chatId,
        { text: "Entitas video tidak ditemukan dalam hasil pencarian." },
        { quoted: msg },
      );
    }

    // Ekstraksi URL video untuk proses pengunduhan
    const videoUrl = videoData.url;

    // Melakukan request ke API downloader (Savefrom)
    const downloadResponse = await fetch(
      `https://api.siputzx.my.id/api/d/savefrom?url=${encodeURIComponent(videoUrl)}`,
    );
    const downloadResult = await downloadResponse.json();

    /* PENTING: Validasi ketersediaan URL audio.
       Beberapa API menyediakan properti 'url' secara langsung,
       namun pastikan struktur 'downloadResult.data.url' memang valid.
    */
    const audioUrl = downloadResult.data?.url;
    if (!audioUrl) {
      return sock.sendMessage(
        chatId,
        { text: "Gagal mendapatkan tautan unduh audio dari server." },
        { quoted: msg },
      );
    }

    // Mengirimkan informasi awal berupa thumbnail dan metadata video
    await sock.sendMessage(
      chatId,
      {
        image: { url: videoData.thumbnail },
        caption: `🎵 *${videoData.title}*\n\n👤 Kanal: ${videoData.author.name}\n⏱ Durasi: ${videoData.timestamp}\n👀 Penayangan: ${videoData.views.toLocaleString()}\n🔗 Sumber: ${videoUrl}\n\n⏳ Sedang memproses pengiriman audio, mohon tunggu...`,
      },
      { quoted: msg },
    );

    // Mengirimkan file audio dalam format mpeg
    return await sock.sendMessage(
      chatId,
      {
        audio: { url: audioUrl },
        mimetype: "audio/mpeg",
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (error) {
    // Logika penanganan error untuk mempermudah debugging pada sisi server
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
