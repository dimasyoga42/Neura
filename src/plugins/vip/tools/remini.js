import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"

const ENHANCE_API = "https://magma-api.biz.id/edits/enhance"
const IMGBB_API = "https://api.imgbb.com/1/upload"

const getMedia = (msg) => {
  if (msg.message?.imageMessage) return msg
  const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
  return quoted?.imageMessage ? { message: quoted } : null
}

export const Remini = async (sock, chatId, msg) => {
  try {
    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text || ""
    if (!text.startsWith("!remini")) return

    const mediaMsg = getMedia(msg)
    if (!mediaMsg) {
      return sock.sendMessage(chatId, { text: "❗ Kirim/reply gambar dengan `!remini`" }, { quoted: msg })
    }

    // Download & upload
    const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, { reuploadRequest: sock.updateMediaMessage })
    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const { data } = await axios.post(`${IMGBB_API}?expiration=600&key=${process.env.BBI_KEY}`, form, {
      headers: form.getHeaders()
    })

    if (!data?.data?.url) throw "Upload gagal"

    // Enhance - log untuk debugging
    await sock.sendMessage(chatId, { text: "⏳ Memproses gambar..." }, { quoted: msg })

    const enhance = await axios.get(`${ENHANCE_API}?image=${encodeURIComponent(data.data.url)}`)
    console.log("Response enhance:", JSON.stringify(enhance.data, null, 2))

    // Coba berbagai kemungkinan response structure
    const result = enhance.data?.image_data
      || enhance.data?.url
      || enhance.data?.result?.url
      || enhance.data?.data?.url
      || enhance.data

    if (typeof result === 'string' && result.startsWith('http')) {
      await sock.sendMessage(chatId, {
        image: { url: result },
        caption: "✅ Gambar berhasil ditingkatkan!"
      }, { quoted: msg })
    } else {
      // Kirim response mentah jika struktur tidak dikenali
      await sock.sendMessage(chatId, {
        text: `⚠️ Response API:\n\`\`\`json\n${JSON.stringify(enhance.data, null, 2)}\n\`\`\``
      }, { quoted: msg })
    }

  } catch (err) {
    console.error("[REMINI]", err?.response?.data || err)
    sock.sendMessage(chatId, { text: "❌ Gagal memproses gambar" }, { quoted: msg })
  }
}
