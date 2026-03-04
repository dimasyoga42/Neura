import axios from "axios";

export const myBini = async (sock, chatId, msg) => {
  try {
    const { data } = await axios.get(
      "https://neuraapi.vercel.app/api/etc/waifu",
      { timeout: 15000 },
    );

    if (data?.result?.status !== 200) {
      return await sock.sendMessage(
        chatId,
        { text: "Gagal mengambil data waifu" },
        { quoted: msg },
      );
    }

    const { message, source, art, jumlah, Url } = data.result;

    const imageResponse = await axios.get(Url, {
      responseType: "arraybuffer",
      headers: {
        Referer: "https://www.pixiv.net/",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      timeout: 20000,
    });

    const buffer = Buffer.from(imageResponse.data);

    await sock.sendMessage(
      chatId,
      {
        image: buffer,
        caption: `Bini Kamu ${message}
Source: ${source} (${art})
Jumlah: ${jumlah}`,
      },
      { quoted: msg },
    );
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: "Server error, coba lagi nanti" },
      { quoted: msg },
    );
  }
};
