import axios from "axios";
import Sticker, { StickerTypes } from "wa-sticker-formatter";




export const Mix = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ")
    const emt1 = arg[1]
    const emt2 = arg[2]
    if (!emt1 || !emt2) return sock.sendMessage(chatId, { text: "mana emotnya" }, { quoted: msg })
    const media = `ttps://api.deline.web.id/maker/emojimix?emoji1=${encodeURIComponent(emt1)}=${encodeURIComponent(emt2)}`;
    const data = await axios.get(media)
    const urls = data.data.result.png

    const stiker = await new Sticker(urls, {
      pack: "Neura",
      author: "Neura Sama",
      type: StickerTypes.FULL,
      quality: 50
    }).toBuffer();
    sock.sendMessage(chatId, { stiker }, { quoted: msg })
  } catch (err) {

  }
}
