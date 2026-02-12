import fetch from "node-fetch"
import fs from "fs"
import { proto, generateWAMessageFromContent, prepareWAMessageMedia } from "@whiskeysockets/baileys"

/**
 * ===============================
 * GET BUFFER (URL / PATH / BASE64)
 * ===============================
 */
async function getBuffer(input) {
  if (!input) return null

  try {
    if (Buffer.isBuffer(input)) return input

    if (typeof input === "string") {
      if (/^https?:\/\//.test(input)) {
        const res = await fetch(input)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
      }

      if (input.startsWith("data:")) {
        return Buffer.from(input.split(",")[1], "base64")
      }

      if (fs.existsSync(input)) {
        return fs.readFileSync(input)
      }
    }
  } catch (e) {
    console.log("getBuffer error:", e)
  }

  return null
}

/**
 * ===============================
 * SEND INTERACTIVE MESSAGE
 * ===============================
 */
export async function sendInteractiveMessage(sock, jid, data, quoted = null) {
  if (!sock?.user?.id) throw new Error("Socket belum siap")

  const {
    title = "",
    body = "",
    footer = "",
    image = null,
    buttons = []
  } = data

  /**
   * ================= MEDIA =================
   */
  let imageMessage = null

  if (image) {
    const buffer = await getBuffer(image)
    if (buffer) {
      const media = await prepareWAMessageMedia(
        { image: buffer },
        { upload: sock.waUploadToServer }
      )
      imageMessage = media.imageMessage
    }
  }

  /**
   * ================= BUTTON FORMAT =================
   */
  const formattedButtons = buttons.map(btn => ({
    name: btn.name || "quick_reply",
    buttonParamsJson:
      typeof btn.buttonParamsJson === "string"
        ? btn.buttonParamsJson
        : JSON.stringify(btn.buttonParamsJson || {})
  }))

  /**
   * ================= MESSAGE BUILD =================
   */
  const msg = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({
              text: body || "‎"
            }),

            footer: proto.Message.InteractiveMessage.Footer.create({
              text: footer || "‎"
            }),

            header: proto.Message.InteractiveMessage.Header.create({
              title: title || "‎",
              hasMediaAttachment: !!imageMessage,
              ...(imageMessage ? { imageMessage } : {})
            }),

            nativeFlowMessage:
              proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: formattedButtons
              })
          })
        }
      }
    },
    { quoted, userJid: sock.user.id }
  )

  await sock.relayMessage(jid, msg.message, {
    messageId: msg.key.id
  })

  return msg
}

export default {
  sendInteractiveMessage
}
