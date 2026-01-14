import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"
import sharp from "sharp"
import Sticker, { StickerTypes } from "wa-sticker-formatter"

/* =====================
   CONFIG
===================== */
const STICKER_SIZE = 512
const WEBP_QUALITY = 80
const PACK_NAME = "Neura"
const AUTHOR_NAME = "Neura"

/* =====================
   HELPER
===================== */
const getMediaMessage = (msg) => {
  if (msg.message?.imageMessage || msg.message?.videoMessage) return msg

  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage || quoted?.videoMessage) {
    return { message: quoted }
  }
  return null
}

const parseText = (text = "") => {
  const input = text.replace("!stiker", "").trim()
  const [top = "_", bottom = "_"] = input.split("|")
  return {
    top: encodeURIComponent(top || "_"),
    bottom: encodeURIComponent(bottom || "_"),
  }
}

/* =====================
   MAIN
===================== */
const Smeme = async (sock, chatId, msg, text) => {
  try {
    const mediaMsg = getMediaMessage(msg)
    if (!mediaMsg) {
      return sock.sendMessage(
        chatId,
        {
          text:
            "Reply gambar / video dengan `!stiker`\n" +
            "Contoh:\n" +
            "`!stiker Halo | Dunia`\n" +
            "`Reply video + !stiker`",
        },
        { quoted: msg }
      )
    }

    const { top, bottom } = parseText(text)

    /* =====================
       VIDEO → STICKER
    ===================== */
    if (mediaMsg.message?.videoMessage) {
      const vid = await downloadMediaMessage(
        mediaMsg,
        "buffer",
        {},
        { reuploadRequest: sock.updateMediaMessage }
      )

      const sticker = await new Sticker(vid, {
        pack: PACK_NAME,
        author: AUTHOR_NAME,
        type: StickerTypes.FULL,
        quality: 50,
        animated: true,
      }).toBuffer()

      await sock.sendMessage(chatId, { sticker }, { quoted: msg })
      return
    }

    /* =====================
       IMAGE → MEME STICKER
    ===================== */
    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    /* Upload ke IMGBB */
    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const upload = await axios.post(
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() }
    )

    const imageUrl = upload.data.data.url

    /* Generate Meme */
    const memeUrl = `https://api.memegen.link/images/custom/${top}/${bottom}.png?background=${encodeURIComponent(
      imageUrl
    )}`

    const memeImage = await axios.get(memeUrl, {
      responseType: "arraybuffer",
    })

    /* Convert ke WebP Sticker */
    const stickerBuffer = await sharp(memeImage.data)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer()

    await sock.sendMessage(
      chatId,
      { sticker: stickerBuffer },
      { quoted: msg }
    )
  } catch (err) {
    console.error("[SMEME ERROR]", err)
    await sock.sendMessage(
      chatId,
      { text: "Gagal membuat stiker." },
      { quoted: msg }
    )
  }
}

export default Smeme;
