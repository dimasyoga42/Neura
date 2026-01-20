import axios from "axios";
import Sticker, { StickerTypes } from "wa-sticker-formatter";

export const Mix = async (sock, chatId, msg, text) => {
  try {
    const arg = text.trim().split(/\s+/);
    const emt1 = arg[1];
    const emt2 = arg[2];

    if (!emt1 || !emt2) {
      return sock.sendMessage(
        chatId,
        { text: "mana emotnya" },
        { quoted: msg }
      );
    }

    const apiUrl =
      "https://api.deline.web.id/maker/emojimix" +
      `?emoji1=${encodeURIComponent(emt1)}` +
      `&emoji2=${encodeURIComponent(emt2)}`;

    const res = await axios.get(apiUrl);
    const imgUrl = res?.data?.result?.png;

    if (!imgUrl) {
      return sock.sendMessage(
        chatId,
        { text: "emojimix tidak ditemukan" },
        { quoted: msg }
      );
    }

    const img = await axios.get(imgUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(img.data);

    const stickerBuffer = await new Sticker(buffer, {
      pack: "Neura",
      author: "Neura Sama",
      type: StickerTypes.FULL,
      quality: 50
    }).toBuffer();

    await sock.sendMessage(
      chatId,
      { sticker: stickerBuffer },
      { quoted: msg }
    );
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan sistem" },
      { quoted: msg }
    );
  }
};
