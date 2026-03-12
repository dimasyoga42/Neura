export const play = async (sock, chatId, msg, text) => {
  try {
    if (!text) {
      return sock.sendMessage(
        chatId,
        {
          text: "Masukkan judul lagu\n\nContoh: .play dia",
        },
        { quoted: msg },
      );
    }

    const search = await fetch(
      `https://api.siputzx.my.id/api/s/youtube?query=${encodeURIComponent(text)}`,
    );
    const res = await search.json();

    if (!res.success) {
      return sock.sendMessage(
        chatId,
        {
          text: "Search gagal",
        },
        { quoted: msg },
      );
    }

    const video = res.data[0].data[0];

    const title = video.meta.title;
    const duration = video.meta.duration;
    const thumb = video.thumb;

    const mp3path = video.stream.mp3["320"].streams[0];
    const mp3 = `https://api.siputzx.my.id${mp3path}`;

    await sock.sendMessage(
      chatId,
      {
        image: { url: thumb },
        caption: `🎵 *${title}*

Duration : ${duration}
Quality : 320kbps
Mengirim audio...`,
      },
      { quoted: msg },
    );

    await sock.sendMessage(
      chatId,
      {
        audio: { url: mp3 },
        mimetype: "audio/mpeg",
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.log(err);
    await sock.sendMessage(
      chatId,
      {
        text: "Terjadi error saat mengambil lagu",
      },
      { quoted: msg },
    );
  }
};
