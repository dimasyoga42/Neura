import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"

const ENHANCE_API = "https://api.neoxr.eu/api/remini"
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

    await sock.sendMessage(chatId, { text: "⏳ Sedang diproses..." }, { quoted: msg })

    // Download & upload
    const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, { reuploadRequest: sock.updateMediaMessage })
    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const { data } = await axios.post(`${IMGBB_API}?expiration=600&key=${process.env.BBI_KEY}`, form, {
      headers: form.getHeaders()
    })

    if (!data?.data?.url) throw "Upload gagal"

    // Enhance dengan Neoxr API
    const enhance = await axios.get(`${ENHANCE_API}?image=${encodeURIComponent(data.data.url)}&apikey=${process.env.NEOXR_KEY}`)

    const result = enhance.data?.data?.url || enhance.data?.url

    if (!result?.startsWith('http')) {
      throw `Response tidak valid: ${JSON.stringify(enhance.data)}`
    }

    await sock.sendMessage(chatId, {
      image: { url: result },
      caption: "✅ Berhasil ditingkatkan!"
    }, { quoted: msg })

  } catch (err) {
    console.error("[REMINI]", err?.response?.data || err)
    sock.sendMessage(chatId, {
      text: `❌ ${err?.response?.data?.message || err?.message || "Gagal memproses"}`
    }, { quoted: msg })
  }
}
