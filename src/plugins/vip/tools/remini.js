import { downloadMediaMessage } from "@whiskeysockets/baileys"
import axios from "axios"
import FormData from "form-data"

const ENHANCE_API = "https://tools.betabotz.org/tools/remini"
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

    // Download & upload ke imgbb
    const buffer = await downloadMediaMessage(mediaMsg, "buffer", {}, { reuploadRequest: sock.updateMediaMessage })
    const form = new FormData()
    form.append("image", buffer.toString("base64"))

    const { data } = await axios.post(`${IMGBB_API}?expiration=600&key=${process.env.BBI_KEY}`, form, {
      headers: form.getHeaders()
    })

    if (!data?.data?.url) throw "Upload gagal"

    // Enhance dengan BetaBotz API
    const enhance = await axios.get(`${ENHANCE_API}?url=${encodeURIComponent(data.data.url)}`)

    // Response format: { image_data: "url", image_size: "size" }
    const result = enhance.data?.image_data || enhance.data?.url

    if (!result || !result.startsWith('http')) {
      throw `Format response tidak valid: ${JSON.stringify(enhance.data)}`
    }

    await sock.sendMessage(chatId, {
      image: { url: result },
      caption: `✅ Berhasil!\n📦 Size: ${enhance.data?.image_size || 'N/A'}`
    }, { quoted: msg })

  } catch (err) {
    console.error("[REMINI]", err?.response?.data || err)
    sock.sendMessage(chatId, {
      text: `❌ Gagal: ${err?.message || err}`
    }, { quoted: msg })
  }
}
