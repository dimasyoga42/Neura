import axios from "axios";

const instagramdownloder = async (sock, chatId, msg, text) => {
  try {
    const cx = text.trim().split(" ");
    const link = cx[1];

    if (!link) {
      return sock.sendMessage(
        chatId,
        { text: "masukan link setelah .ig" },
        { quoted: msg },
      );
    }

    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/ig?url=${encodeURIComponent(link)}`,
      { timeout: 15000 },
    );

    if (!data?.status || !data?.result?.media) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil media" },
        { quoted: msg },
      );
    }

    const { images, videos } = data.result.media;

    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        await sock.sendMessage(
          chatId,
          { image: { url: img } },
          { quoted: msg },
        );
      }
      return;
    }

    if (Array.isArray(videos) && videos.length > 0) {
      for (const vid of videos) {
        await sock.sendMessage(
          chatId,
          { video: { url: vid } },
          { quoted: msg },
        );
      }
      return;
    }

    return sock.sendMessage(
      chatId,
      { text: "media tidak ditemukan" },
      { quoted: msg },
    );
  } catch (err) {
    return sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat mengambil data" },
      { quoted: msg },
    );
  }
};

export { instagramdownloder };
