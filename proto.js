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
 * SEND INTERACTIVE MESSAGE (BUTTON)
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

  // Format tombol -> pastikan JSON string
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
   * ===============================
   * HEADER MEDIA / TEXT
   * ===============================
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

  /**
   * ===============================
   * GENERATE MESSAGE (NO VIEWONCE)
   * ===============================
   */
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
 * SEND CAROUSEL MESSAGE
 * ===============================
 */
export async function sendCarousel(sock, jid, cards, options = {}, quoted = null) {
  const { content = '' } = options

  if (!sock?.user?.id) throw new Error("Socket not ready")

  const cardsMessage = await Promise.all(cards.map(async (card) => {
    let header = {
      title: card.header?.title || '',
      hasMediaAttachment: false
    }

    const mediaSource = card.header?.imageMessage || card.header?.videoMessage

    if (mediaSource) {
      const buffer = await getBuffer(mediaSource)
      if (buffer) {
        const isVideo = !!card.header.videoMessage

        const uploaded = await prepareWAMessageMedia(
          { [isVideo ? 'video' : 'image']: buffer },
          { upload: sock.waUploadToServer }
        )

        header.hasMediaAttachment = true
        header[isVideo ? 'videoMessage' : 'imageMessage'] =
          uploaded[isVideo ? 'videoMessage' : 'imageMessage']
      }
    }

    return {
      header: proto.Message.InteractiveMessage.Header.create(header),
      body: proto.Message.InteractiveMessage.Body.create({
        text: card.body?.text || ''
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: card.footer?.text || ''
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: card.nativeFlowMessage.buttons.map(btn => ({
          name: btn.name || "quick_reply",
          buttonParamsJson: typeof btn.buttonParamsJson === 'object'
            ? JSON.stringify(btn.buttonParamsJson)
            : (btn.buttonParamsJson || "{}")
        }))
      })
    }
  }))

  const msg = generateWAMessageFromContent(jid, {
    interactiveMessage: proto.Message.InteractiveMessage.create({
      body: proto.Message.InteractiveMessage.Body.create({ text: content }),
      carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
        cards: cardsMessage
      }),
      contextInfo: {
        deviceListMetadata: {},
        deviceListMetadataVersion: 2
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
  sendCarousel,
  replyButton,
  sendPoll
}
