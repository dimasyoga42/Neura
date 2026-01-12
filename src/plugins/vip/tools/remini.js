import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"

const ENHANCE_API = "https://magma-api.biz.id/edits/enhance"
const IMGBB_API = "https://api.imgbb.com/1/upload"

const getMediaMessage = (msg) => {
  // gambar langsung
  if (msg.message?.imageMessage) return msg

  // reply gambar
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  if (quoted?.imageMessage) return { message: quoted }

  return null
}

export const Remini = async (sock, chatId, msg) => {
  try {
    const text =
      msg.message?.conversation ||
      msg.message?.extendedTextMessage?.text ||
      ""

    if (!text.startsWith("!remini")) return

    const mediaMsg = getMediaMessage(msg)
    if (!mediaMsg)
      return sock.sendMessage(
        chatId,
        { text: "❗ Kirim atau reply gambar dengan caption `!remini`" },
        { quoted: msg }
      )

    // ================= DOWNLOAD IMAGE =================
    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    // ================= UPLOAD IMGBB =================
    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const upload = await axios.post(
      `${IMGBB_API}?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() }
    )

    const imageUrl = upload.data?.data?.url
    if (!imageUrl) throw "Gagal upload image"

    // ================= ENHANCE =================
    const enhance = await axios.get(
      `${ENHANCE_API}?url=${encodeURIComponent(imageUrl)}`
    )

    const resultUrl = enhance.data?.result || enhance.data?.url
    if (!resultUrl) throw "Enhance gagal"

    // ================= SEND RESULT =================
    await sock.sendMessage(
      chatId,
      {
        image: { url: resultUrl },
        caption: "✨ Gambar berhasil di-enhance"
      },
      { quoted: msg }
    )

  } catch (err) {
    console.error("[REMINI ERROR]", err?.response?.data || err)

    await sock.sendMessage(
      chatId,
      { text: "❌ Terjadi kesalahan saat memproses gambar" },
      { quoted: msg }
    )
  }
}
