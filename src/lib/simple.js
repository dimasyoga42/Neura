import pkg from "@whiskeysockets/baileys"
import fetch from "node-fetch"
import fs from "fs"

const {
  proto,
  generateWAMessageFromContent,
  generateWAMessageContent
} = pkg

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
      // URL
      if (/^https?:\/\//.test(input)) {
        const res = await fetch(input)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
      }

      // Base64
      if (input.startsWith("data:")) {
        return Buffer.from(input.split(",")[1], "base64")
      }

      // File lokal
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
 * GENERATE MEDIA (IMAGE / VIDEO)
 * ===============================
 */
async function generateMedia(sock, type, media) {
  const buffer = await getBuffer(media)
  if (!buffer) return null

  const generated = await generateWAMessageContent(
    { [type]: buffer },
    { upload: sock.waUploadToServer }
  )

  return generated[`${type}Message`]
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
    video = null,
    buttons = []
  } = data

  // ================= MEDIA =================
  let imageMessage = null
  let videoMessage = null

  if (image) {
    imageMessage = await generateMedia(sock, "image", image)
  }

  if (video) {
    videoMessage = await generateMedia(sock, "video", video)
  }

  // ================= BUTTON FORMAT =================
  const formattedButtons = buttons.map(btn => ({
    name: btn.name || "quick_reply",
    buttonParamsJson:
      typeof btn.buttonParamsJson === "string"
        ? btn.buttonParamsJson
        : JSON.stringify(btn.buttonParamsJson || {})
  }))

  // ================= MESSAGE BUILD =================
  const msg = generateWAMessageFromContent(
    jid,
    {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text: body }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),

            header: proto.Message.InteractiveMessage.Header.create({
              title: title,
              hasMediaAttachment: !!(imageMessage || videoMessage),
              ...(imageMessage ? { imageMessage } : {}),
              ...(videoMessage ? { videoMessage } : {})
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
