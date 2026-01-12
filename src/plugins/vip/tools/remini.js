import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"

const ENHANCE_API = "https://magma-api.biz.id/edits/enhance"
const IMGBB_API = "https://api.imgbb.com/1/upload"

const getMediaMessage = (msg) => {
  if (msg.message?.imageMessage) return msg
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
        { text: "❗ Kirim / reply gambar dengan `!remini`" },
        { quoted: msg }
      )

    // download image
    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    )

    // upload ke imgbb
    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const upload = await axios.post(
      `${IMGBB_API}?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() }
    )

    const imageUrl = upload.data?.data?.url
    if (!imageUrl) throw "Upload gagal"

    // enhance
    const enhance = await axios.get(
      `${ENHANCE_API}?image=${encodeURIComponent(imageUrl)}`
    )

    // ✅ AMBIL SEMUA KEMUNGKINAN RESPONSE
    const res = enhance.data
    console.log(res)
  } catch (err) {
    console.error("[REMINI ERROR]", err?.response?.data || err)
    sock.sendMessage(
      chatId,
      { text: "❌ Gagal memproses gambar (API bermasalah)" },
      { quoted: msg }
    )
  }
}
