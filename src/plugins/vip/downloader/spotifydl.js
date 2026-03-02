import axios from "axios";

const spotifyDownloader = async (sock, chatId, msg, text) => {
  try {
    const args = text.trim().split(" ");
    const link = args[1];

    if (!link) {
      return sock.sendMessage(
        chatId,
        { text: "masukan link setelah .sptifydl" },
        { quoted: msg },
      );
    }

    const { data } = await axios.get(
      `https://api.deline.web.id/downloader/spotify?url=${encodeURIComponent(link)}`,
      { timeout: 15000 },
    );

    if (!data.status) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil data" },
        { quoted: msg },
      );
    }

    const result = data.result;
    const track = result.data;

    const title = track.name;
    const artist = track.artists.map((a) => a.name).join(", ");
    const thumbnail = track.album.images[0]?.url;
    const downloadUrl = result.download_url;

    if (!downloadUrl) {
      return sock.sendMessage(
        chatId,
        { text: "download url tidak tersedia" },
        { quoted: msg },
      );
    }

    if (thumbnail) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: thumbnail },
          caption: `🎵 ${title}\n👤 ${artist}`,
        },
        { quoted: msg },
      );
    }

    await sock.sendMessage(
      chatId,
      {
        audio: { url: downloadUrl },
        mimetype: "audio/mpeg",
        fileName: `${title}.mp3`,
      },
      { quoted: msg },
    );
  } catch (err) {
    return sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat memproses lagu" },
      { quoted: msg },
    );
  }
};

export { spotifyDownloader };
