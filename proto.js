import {
  generateWAMessageFromContent,
  proto,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
import fs from 'fs'

/**
 * ===============================
 * GET BUFFER (SAFE FETCH)
 * ===============================
 */
async function getBuffer(media) {
  if (Buffer.isBuffer(media)) return media

  try {
    if (typeof media === 'string') {
      if (media.match(/^https?:\/\//)) {
        const res = await fetch(media)
        if (!res.ok) return null
        return Buffer.from(await res.arrayBuffer())
      }

      if (media.startsWith('data:')) {
        return Buffer.from(media.split(',')[1], 'base64')
      }

      if (fs.existsSync(media)) {
        return fs.readFileSync(media)
      }
    }
  } catch (e) {
    console.error("getBuffer error:", e)
  }

  return null
}

/**
 * ===============================
 * SEND FAKE THUMBNAIL (TUMB)
 * ===============================
 */
export async function sendFThumb(sock, jid, title, desc, body, thumb, url, quoted = null, options = {}) {
  const buffer = await getBuffer(thumb)

  return sock.sendMessage(jid, {
    text: body,
    contextInfo: {
      externalAdReply: {
        title: title,
        body: desc,
        thumbnail: buffer,
        mediaType: 1,
        mediaUrl: url,
        sourceUrl: url,
        renderLargerThumbnail: true,
        showAdAttribution: false
      }
    },
    ...options
  }, { quoted })
}

/**
 * ===============================
 * SEND INTERACTIVE MESSAGE (BUTTON / BTN)
 * ===============================
 */
export async function sendIAMessage(sock, jid, buttons, options = {}, quoted = null) {
  const {
    header = '',
    content = '',
    footer = '',
    media = null,
    isVideo = false
  } = options

  if (!sock?.user?.id) throw new Error("Socket not ready")

  const formattedButtons = buttons.map(btn => ({
    name: btn.name || "quick_reply",
    buttonParamsJson: typeof btn.buttonParamsJson === 'object'
      ? JSON.stringify(btn.buttonParamsJson)
      : (btn.buttonParamsJson || "{}")
  }))

  const messageContent = {
    body: proto.Message.InteractiveMessage.Body.create({ text: content }),
    footer: proto.Message.InteractiveMessage.Footer.create({ text: footer }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: formattedButtons
    })
  }

  /**
   * HEADER MEDIA / TEXT
   */
  if (media) {
    const buffer = await getBuffer(media)

    if (buffer) {
      const type = isVideo || (typeof media === 'string' && media.includes('.mp4')) ? 'video' : 'image'

      const mediaData = await prepareWAMessageMedia(
        { [type]: buffer },
        { upload: sock.waUploadToServer }
      )

      messageContent.header = proto.Message.InteractiveMessage.Header.create({
        title: header,
        hasMediaAttachment: true,
        ...(type === 'video'
          ? { videoMessage: mediaData.videoMessage }
          : { imageMessage: mediaData.imageMessage })
      })
    }
  } else if (header) {
    messageContent.header = proto.Message.InteractiveMessage.Header.create({
      title: header,
      hasMediaAttachment: false
    })
  }

  const msg = generateWAMessageFromContent(jid, {
    interactiveMessage: proto.Message.InteractiveMessage.create({
      ...messageContent,
      contextInfo: {
        mentionedJid: options.mentions || [],
        deviceListMetadata: {},
        deviceListMetadataVersion: 2,
        ...options.contextInfo
      }
    })
  }, { quoted, userJid: sock.user.id })

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/**
 * ===============================
 * REPLY BUTTON (AUTO CONVERT)
 * ===============================
 */
export async function replyButton(sock, jid, buttons, options = {}, quoted = null) {
  const converted = buttons.map(btn => ({
    name: btn.name || "quick_reply",
    buttonParamsJson: btn.buttonParamsJson || {
      display_text: btn.text,
      id: btn.command
    }
  }))

  return sendIAMessage(sock, jid, converted, options, quoted)
}

/**
 * ===============================
 * SEND POLL
 * ===============================
 */
export async function sendPoll(sock, jid, name, options = {}) {
  return sock.sendMessage(jid, {
    poll: {
      name,
      values: options.options || [],
      selectableCount: options.multiselect ? options.options.length : 1
    }
  })
}

export default {
  sendIAMessage,
  replyButton,
  sendPoll,
  sendFThumb
}
