import axios from "axios";

export const myBini = async (sock, chatId, msg) => {
  try {
    const waifu = await axios.get("https://neuraapi.vercel.app/api/etc/waifu");
    const data = waifu.data.result;
    const messagetxt = `Bini Kamu Adalah ${data.message}\n\n source: ${data.source} - (${data.art})\nJumlah Image tersedia: ${data.jumlah}`;
    sock.sendMessage(
      chatId,
      { image: { url: data.url }, caption: messagetxt },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg });
  }
};
