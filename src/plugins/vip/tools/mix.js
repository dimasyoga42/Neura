
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

    const url =
      "https://api.deline.web.id/maker/emojimix" +
      `?emoji1=${encodeURIComponent(emt1)}` +
      `&emoji2=${encodeURIComponent(emt2)}`;

    const { data } = await axios.get(url);

    if (!data || !data.result || !data.result.png) {
      return sock.sendMessage(
        chatId,
        { text: "gagal membuat emojimix" },
        { quoted: msg }
      );
    }

    const stickerBuffer = await new Sticker(data.result.png, {
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

