import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"

const baseUrl = "https://magma-api.biz.id/edits/enhance"

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
      return sock.sendMessage(chatId, { text: "Reply / kirim gambar dengan caption !remini" }, { quoted: msg })

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
      `https://api.imgbb.com/1/upload?expiration=600&key=${process.env.BBI_KEY}`,
      form,
      { headers: form.getHeaders() }
    )

    const imageUrl = upload.data.data.url

    // enhance
    const enhance = await axios.get(baseUrl, {
      headers: { url: imageUrl }
    })

    const resultUrl = enhance.data?.result || enhance.data?.url
    if (!resultUrl) throw new Error("Gagal enhance")

    // kirim hasil
    await sock.sendMessage(
      chatId,
      { image: { url: resultUrl }, caption: "✨ Berhasil di-enhance" },
      { quoted: msg }
    )

  } catch (err) {
    console.error(err)
    sock.sendMessage(chatId, { text: "❌ Terjadi kesalahan saat memproses gambar" }, { quoted: msg })
  }
}
