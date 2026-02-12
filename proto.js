import {
  generateWAMessageFromContent,
  proto,
  prepareWAMessageMedia
} from '@whiskeysockets/baileys'
import fetch from 'node-fetch'
import fs from 'fs'

/**
 * Utilitas untuk mengonversi berbagai sumber media menjadi Buffer.
 * Mendukung URL eksternal, Base64, dan jalur file lokal.
 * @param {String|Buffer} media
 * @returns {Promise<Buffer>}
 */
async function getBuffer(media) {
  if (Buffer.isBuffer(media)) return media
  if (typeof media === 'string') {
    if (media.match(/^https?:\/\//)) {
      const response = await fetch(media)
      if (!response.ok) throw new Error(`Gagal mengambil media: ${response.statusText}`)
      return Buffer.from(await response.arrayBuffer())
    }
    if (media.startsWith('data:')) {
      return Buffer.from(media.split(',')[1], 'base64')
    }
    if (fs.existsSync(media)) {
      return fs.readFileSync(media)
    }
  }
  throw new Error('Format media tidak valid atau file tidak ditemukan')
}

/**
 * Mengirim pesan tombol interaktif (Native Flow Message).
 * Merupakan standar terbaru WhatsApp untuk interaksi bisnis.
 */
export async function sendIAMessage(sock, jid, buttons, options = {}, quoted = null) {
  const {
    header = '',
    content = '',
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

  // Penanganan Header Media (Gambar atau Video)
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
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create(messageContent)
      }
    }
  }, { quoted })

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/**
 * Mengirim pesan Carousel yang berisi beberapa kartu interaktif.
 */
export async function sendCarousel(sock, jid, cards, options = {}, quoted = null) {
  const { content = '' } = options

  const cardsMessage = await Promise.all(cards.map(async (card) => {
    let cardHeader = {
      title: card.header?.title || '',
      hasMediaAttachment: false
    }

    // Memproses media pada tiap kartu jika tersedia
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
      })
    }
  }))

  const msg = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: proto.Message.InteractiveMessage.create({
          body: proto.Message.InteractiveMessage.Body.create({ text: content }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
            cards: cardsMessage
          })
        })
      }
    }
  }, { quoted })

  await sock.relayMessage(jid, msg.message, { messageId: msg.key.id })
  return msg
}

/**
 * Fungsi pembungkus (wrapper) untuk mempertahankan kompatibilitas dengan format tombol lama.
 */
export async function replyButton(sock, jid, buttons, options = {}, quoted = null) {
  const { text = '', footer = '', media = null } = options

  const convertedButtons = buttons.map((btn, index) => {
    if (btn.name && btn.buttonParamsJson) return btn

    return {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: btn.text || `Button ${index + 1}`,
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
 * Mengirim pesan Jajak Pendapat (Poll).
 */
export async function sendPoll(sock, jid, name, options = {}) {
  const { options: pollOptions = [], multiselect = false } = options
  return await sock.sendMessage(jid, {
    poll: {
      name,
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
