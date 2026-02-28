import axios from "axios";

export const pin = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(".pinterest", "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "mana judulnya" },
        { quoted: msg },
      );
    }

    await sock.sendMessage(chatId, { text: "mohon tunggu.." }, { quoted: msg });

    const res = await axios.get(
      `https://api.deline.web.id/search/pinterest?q=${encodeURIComponent(query)}`,
      { timeout: 10000 },
    );

    const data = res.data?.data;

    if (!Array.isArray(data) || data.length === 0) {
      return await sock.sendMessage(
        chatId,
        { text: "gagal memproses" },
        { quoted: msg },
      );
    }

    for (const item of data.slice(0, 5)) {
      await sock.sendMessage(
        chatId,
        {
          image: { url: item.image },
        },
        { quoted: msg },
      );
    }
  } catch (err) {
    console.error("Pinterest error:", err);
    await sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat mengambil data" },
      { quoted: msg },
    );
  }
};
