import axios from "axios";

const tiktokDownloader = async (sock, chatId, msg, text) => {
  try {
    const args = text.trim().split(" ");
    const link = args[1];

    if (!link) {
      return sock.sendMessage(
        chatId,
        { text: "masukan link setelah .tt" },
        { quoted: msg },
      );
    }

    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/tiktok?url=${encodeURIComponent(link)}`,
      { timeout: 15000 },
    );

    if (!data?.status || !data?.result) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil data tiktok" },
        { quoted: msg },
      );
    }

    const result = data.result;

    const title = result.title || "video tiktok";
    const username = result.author?.unique_id || "unknown";
    const nickname = result.author?.nickname || "";
    const avatar = result.author?.avatar;
    const videoUrl = result.download;
    const musicUrl = result.music;

    if (!videoUrl) {
      return sock.sendMessage(
        chatId,
        { text: "video tidak tersedia" },
        { quoted: msg },
      );
    }

    if (avatar) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: avatar },
          caption: `🎬 ${title}\n👤 ${nickname} (@${username})`,
        },
        { quoted: msg },
      );
    }

    await sock.sendMessage(
      chatId,
      {
        video: { url: videoUrl },
        mimetype: "video/mp4",
        fileName: `${result.id}.mp4`,
      },
      { quoted: msg },
    );

    if (musicUrl) {
      await sock.sendMessage(
        chatId,
        {
          audio: { url: musicUrl },
          mimetype: "audio/mpeg",
          fileName: `${result.id}.mp3`,
        },
        { quoted: msg },
      );
    }
  } catch (err) {
    return sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat memproses video" },
      { quoted: msg },
    );
  }
};

export default tiktokDownloader;
