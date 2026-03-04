import axios from "axios";

export const myBini = async (sock, chatId, msg) => {
  try {
    const { data } = await axios.get(
      "https://neuraapi.vercel.app/api/etc/waifu",
      {
        timeout: 15000,
      },
    );

    if (!data || !data.result || data.result.status !== 200) {
      return await sock.sendMessage(
        chatId,
        { text: "gagal mengambil data waifu" },
        { quoted: msg },
      );
    }

    const result = data.result;

    const messagetxt = `Bini Kamu Adalah ${result.message}
Source: ${result.source} - (${result.art})
Jumlah Image tersedia: ${result.jumlah}`.trim();

    await sock.sendMessage(
      chatId,
      {
        image: { url: result.Url },
        caption: messagetxt,
      },
      { quoted: msg },
    );
  } catch (err) {
    await sock.sendMessage(
      chatId,
      {
        text: "server error, coba lagi nanti",
      },
      { quoted: msg },
    );
  }
};
