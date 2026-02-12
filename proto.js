import {
  generateWAMessageFromContent,
  proto,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
import fs from 'fs'

/**
 * Utilitas untuk mendapatkan Buffer.
 * Ditambahkan penanganan error fetch yang lebih robust.
 */
async function getBuffer(media) {
  if (Buffer.isBuffer(media)) return media
  try {
    if (typeof media === 'string') {
      if (media.match(/^https?:\/\//)) {
        const response = await fetch(media)
        if (!response.ok) return null
        return Buffer.from(await response.arrayBuffer())
      }
      if (media.startsWith('data:')) {
        return Buffer.from(media.split(',')[1], 'base64')
      }
      if (fs.existsSync(media)) {
        return fs.readFileSync(media)
      }
    }
  } catch (e) {
    console.error("Error in getBuffer:", e)
    return null
  }
  return null
}

/**
 * Send Interactive Message (Native Flow Buttons)
 * Perbaikan pada: Stringify params secara otomatis & penanganan header title.
 */
export async function sendIAMessage(sock, jid, buttons, options = {}, quoted = null) {
  const {
    header = '',
    content = '',
    footer = '',
    media = null,
    isVideo = false
  } = options

  // Transformasi tombol: memastikan buttonParamsJson selalu string JSON
  const formattedButtons = buttons.map(btn => ({
    name: btn.name,
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

  // Logika Media Header yang lebih bersih
  if (media) {
    const buffer = await getBuffer(media)
    if (buffer) {
      const type = isVideo || (typeof media === 'string' && media.includes('.mp4')) ? 'video' : 'image'
      const mediaData = await prepareWAMessageMedia({ [type]: buffer }, { upload: sock.waUploadToServer })

      messageContent.header = proto.Message.InteractiveMessage.Header.create({
        title: header,
        hasMediaAttachment: true,
        ...(type === 'video' ? { videoMessage: mediaData.videoMessage } : { imageMessage: mediaData.imageMessage })
      })
    }
  } else if (header) {
    messageContent.header = proto.Message.InteractiveMessage.Header.create({
      title: header,
      hasMediaAttachment: false
    })
  }

  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.create({
          ...messageContent,
          contextInfo: {
            mentionedJid: options.mentions || [],
            ...options.contextInfo
          }
        })
      }
    }
  }, { quoted, userJid: sock.user.id })

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/**
 * Send Carousel Message
 * Perbaikan: Menangani array cards secara paralel dengan Promise.all
 */
export async function sendCarousel(sock, jid, cards, options = {}, quoted = null) {
  const { content = '' } = options

  const cardsMessage = await Promise.all(cards.map(async (card) => {
    let cardHeader = {
      title: card.header?.title || '',
      hasMediaAttachment: false
    }

    const mediaSource = card.header?.imageMessage || card.header?.videoMessage
    if (mediaSource) {
      const isVideo = !!card.header.videoMessage
      const buffer = await getBuffer(mediaSource)
      if (buffer) {
        const uploadedMedia = await prepareWAMessageMedia(
          { [isVideo ? 'video' : 'image']: buffer },
          { upload: sock.waUploadToServer }
        )
        cardHeader.hasMediaAttachment = true
        cardHeader[isVideo ? 'videoMessage' : 'imageMessage'] = uploadedMedia[isVideo ? 'videoMessage' : 'imageMessage']
      }
    }

    return {
      header: proto.Message.InteractiveMessage.Header.create(cardHeader),
      body: proto.Message.InteractiveMessage.Body.create({ text: card.body?.text || '' }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: card.nativeFlowMessage.buttons.map(btn => ({
          name: btn.name,
          buttonParamsJson: typeof btn.buttonParamsJson === 'object'
            ? JSON.stringify(btn.buttonParamsJson)
            : (btn.buttonParamsJson || "{}")
        }))
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({ text: card.footer?.text || '' })
    }
  }))

  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({ text: content }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({ cards: cardsMessage })
        })
      }
    }
  }, { quoted, userJid: sock.user.id })

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

export default {
  sendIAMessage,
  sendCarousel,
  replyButton: async (sock, jid, buttons, options = {}, quoted = null) => {
    // Fungsi ini membungkus sendIAMessage untuk kompatibilitas tombol lama
    const converted = buttons.map(btn => ({
      name: btn.name || 'quick_reply',
      buttonParamsJson: btn.buttonParamsJson || { display_text: btn.text, id: btn.command }
    }))
    return sendIAMessage(sock, jid, converted, options, quoted)
  },
  sendPoll: async (sock, jid, name, options = {}) => {
    return sock.sendMessage(jid, {
      poll: {
        name,
        values: options.options || [],
        selectableCount: options.multiselect ? options.options.length : 1
      }
    })
  }
}
