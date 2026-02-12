import {
  generateWAMessageFromContent,
  proto,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
import fs from 'fs'

/**
 * Utilitas untuk mendapatkan Buffer dari berbagai sumber.
 * Implementasi asinkron untuk menjaga performa bot.
 */
async function getBuffer(media) {
  if (Buffer.isBuffer(media)) return media
  if (typeof media === 'string') {
    if (media.match(/^https?:\/\//)) {
      const response = await fetch(media)
      if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`)
      return Buffer.from(await response.arrayBuffer())
    }
    if (media.startsWith('data:')) {
      return Buffer.from(media.split(',')[1], 'base64')
    }
    if (fs.existsSync(media)) {
      return fs.readFileSync(media)
    }
  }
  throw new Error('Format media tidak didukung atau file tidak ditemukan.')
}

/**
 * Send Interactive Message (Native Flow Buttons)
 * Dioptimalkan dengan messageContextInfo terbaru.
 */
export async function sendIAMessage(sock, jid, buttons, options = {}, quoted = null) {
  const {
    header = '',
    content = 'Default Content',
    footer = '',
    media = null,
    isVideo = false
  } = options

  const messageContent = {
    body: proto.Message.InteractiveMessage.Body.create({
      text: content
    }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: footer
    }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: buttons.map(btn => ({
        name: btn.name,
        buttonParamsJson: typeof btn.buttonParamsJson === 'object'
          ? JSON.stringify(btn.buttonParamsJson)
          : btn.buttonParamsJson
      }))
    })
  }

  // Integrasi Media pada Header
  if (media) {
    const mediaBuffer = await getBuffer(media)
    const type = isVideo || (typeof media === 'string' && media.includes('.mp4')) ? 'video' : 'image'
    const mediaData = await prepareWAMessageMedia(
      { [type]: mediaBuffer },
      { upload: sock.waUploadToServer }
    )

    messageContent.header = proto.Message.InteractiveMessage.Header.create({
      title: header,
      hasMediaAttachment: true,
      ...(type === 'video'
        ? { videoMessage: mediaData.videoMessage }
        : { imageMessage: mediaData.imageMessage })
    })
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
            // Penting: Memastikan tombol dirender di multi-device
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
      const mediaBuffer = await getBuffer(mediaSource)
      const uploadedMedia = await prepareWAMessageMedia(
        { [isVideo ? 'video' : 'image']: mediaBuffer },
        { upload: sock.waUploadToServer }
      )

      cardHeader = {
        ...cardHeader,
        hasMediaAttachment: true,
        [isVideo ? 'videoMessage' : 'imageMessage']: uploadedMedia[isVideo ? 'videoMessage' : 'imageMessage']
      }
    }

    return {
      header: proto.Message.InteractiveMessage.Header.create(cardHeader),
      body: proto.Message.InteractiveMessage.Body.create({
        text: card.body?.text || ''
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: card.nativeFlowMessage.buttons.map(btn => ({
          name: btn.name,
          buttonParamsJson: typeof btn.buttonParamsJson === 'object'
            ? JSON.stringify(btn.buttonParamsJson)
            : btn.buttonParamsJson
        }))
      }),
      footer: proto.Message.InteractiveMessage.Footer.create({
        text: card.footer?.text || ''
      })
    }
  }))

  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({ text: content }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
            cards: cardsMessage
          })
        })
      }
    }
  }, { quoted, userJid: sock.user.id })

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/**
 * Konverter format tombol lama ke format Native Flow (IAMessage)
 */
export async function replyButton(sock, jid, buttons, options = {}, quoted = null) {
  const { text = '', footer = '', media = null } = options

  const convertedButtons = buttons.map((btn, index) => {
    // Jika format sudah benar, langsung kembalikan
    if (btn.name && btn.buttonParamsJson) return btn

    // Konversi format legacy ke quick_reply
    return {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: btn.text || `Opsi ${index + 1}`,
        id: btn.command || `.btn${index + 1}`
      })
    }
  })

  return await sendIAMessage(sock, jid, convertedButtons, {
    content: text,
    footer: footer,
    media: media
  }, quoted)
}

/**
 * Send Poll Message dengan metode standar Baileys
 */
export async function sendPoll(sock, jid, name, options = {}) {
  const { options: pollOptions = [], multiselect = false } = options
  return await sock.sendMessage(jid, {
    poll: {
      name: name,
      values: pollOptions,
      selectableCount: multiselect ? pollOptions.length : 1
    }
  })
}

export default {
  sendIAMessage,
  sendCarousel,
  replyButton,
  sendPoll
}
