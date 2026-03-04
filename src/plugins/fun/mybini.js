import axios from "axios";

export const myBini = async (sock, chatId, msg) => {
  try {
    const { data } = await axios.get(
      "https://neuraapi.vercel.app/api/etc/waifu",
    );

    if (data?.result?.status !== 200) {
      return await sock.sendMessage(
        chatId,
        { text: "Gagal mengambil data waifu" },
        { quoted: msg },
      );
    }

    const { message, source, art, jumlah, Url } = data.result;

    const buffer = Buffer.from(Url);

    await sock.sendMessage(
      chatId,
      {
        image: buffer,
        caption: `Bini Kamu ${message}\nSource: ${source} (${art})\nJumlah: ${jumlah}`,
      },
      { quoted: msg },
    );
  } catch (err) {
    await sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};
