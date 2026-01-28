import axios from "axios";
import { Sticker, StickerTypes } from "wa-sticker-formatter";


export const mix = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ")
    const emj1 = arg[1]
    const emj2 = arg[2]
    if (!emj1) return sock.sendMessage(chatId, { text: "emoji harus ada dua\ncontoh: !mix 🤣 👾" }, { quoted: msg });
    const link = `https://api.deline.web.id/maker/emojimix?emoji1=${emj1}&emoji2=${encodeURIComponent(emj2)}`
    const res = await axios.get(link)
    const data = res.data.result
    const sticker = new Sticker(data.png, {
      pack: "Neura Sama",
      author: "Neura Sama",
      type: StickerTypes.FULL,
      quality: 80
    })
    const buffer = await sticker.toBuffer();
    await sock.sendMessage(
      chatId,
      { sticker: buffer },
      { quoted: msg }
    );
  } catch (error) {
    sock.sendMessage(chatId, { text: "terjadi kesalahan saat membuat stiker" }, { quoted: msg });
  }
}
