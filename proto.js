import { generateWAMessageFromContent, proto } from '@whiskeysockets/baileys'

/**
 * Send Interactive Button Message (Native Flow)
 * @param {Object} sock - Baileys socket connection
 * @param {String} jid - Chat ID (group or personal)
 * @param {Array} buttons - Array of button objects
 * @param {Object} options - Message options
 * @param {Object} quoted - Quoted message (optional)
 */
export async function sendIAMessage(sock, jid, buttons, options = {}, quoted = null) {
  const {
    header = '',
    content = '',
    footer = '',
    media = null,
    v2 = false,
    multiple = null
  } = options

  let messageContent = {
    body: proto.Message.InteractiveMessage.Body.create({
      text: content
    }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: footer
    }),
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: buttons.map(btn => {
        if (btn.name === 'single_select') {
          return {
            name: btn.name,
            buttonParamsJson: btn.buttonParamsJson
          }
        }
        return {
          name: btn.name,
          buttonParamsJson: btn.buttonParamsJson
        }
      })
    })
  }

  // Add header if exists
  if (header) {
    messageContent.header = proto.Message.InteractiveMessage.Header.create({
      title: header,
      hasMediaAttachment: false
    })
  }

  // Add media if exists
  if (media) {
    const mediaType = media.includes('.mp4') || media.includes('video') ? 'video' : 'image'
    const mediaBuffer = await getBuffer(media)

    if (v2) {
      messageContent.header = proto.Message.InteractiveMessage.Header.create({
        hasMediaAttachment: true,
        ...(mediaType === 'video' ? {
          videoMessage: await prepareWAMessageMedia({ video: mediaBuffer }, { upload: sock.waUploadToServer }).then(m => m.videoMessage)
        } : {
          imageMessage: await prepareWAMessageMedia({ image: mediaBuffer }, { upload: sock.waUploadToServer }).then(m => m.imageMessage)
        })
      })
    } else {
      messageContent.header = proto.Message.InteractiveMessage.Header.create({
        title: header,
        hasMediaAttachment: true,
        ...(mediaType === 'video' ? {
          videoMessage: await prepareWAMessageMedia({ video: mediaBuffer }, { upload: sock.waUploadToServer }).then(m => m.videoMessage)
        } : {
          imageMessage: await prepareWAMessageMedia({ image: mediaBuffer }, { upload: sock.waUploadToServer }).then(m => m.imageMessage)
        })
      })
    }
  }

  // Multiple list style
  if (multiple) {
    messageContent.contextInfo = {
      mentionedJid: [],
      externalAdReply: {
        title: multiple.name || 'Bot',
        body: multiple.code || '',
        mediaType: 1,
        renderLargerThumbnail: false
      }
    }
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

  await sock.relayMessage(jid, msg.message, {
    messageId: msg.key.id
  })

  return msg
}

/**
 * Send Carousel Message
 * @param {Object} sock - Baileys socket connection
 * @param {String} jid - Chat ID
 * @param {Array} cards - Array of card objects
 * @param {Object} options - Message options
 * @param {Object} quoted - Quoted message (optional)
 */
export async function sendCarousel(sock, jid, cards, options = {}, quoted = null) {
  const {
    content = ''
  } = options

  const cardsMessage = await Promise.all(cards.map(async (card) => {
    let cardHeader = {}

    if (card.header && card.header.imageMessage) {
      const mediaBuffer = await getBuffer(card.header.imageMessage)
      const uploadedMedia = await prepareWAMessageMedia(
        { image: mediaBuffer },
        { upload: sock.waUploadToServer }
      )

      cardHeader = {
        title: card.header.title || '',
        hasMediaAttachment: true,
        imageMessage: uploadedMedia.imageMessage
      }
    } else if (card.header && card.header.videoMessage) {
      const mediaBuffer = await getBuffer(card.header.videoMessage)
      const uploadedMedia = await prepareWAMessageMedia(
        { video: mediaBuffer },
        { upload: sock.waUploadToServer }
      )

      cardHeader = {
        title: card.header.title || '',
        hasMediaAttachment: true,
        videoMessage: uploadedMedia.videoMessage
      }
    }

    return {
      header: proto.Message.InteractiveMessage.Header.create(cardHeader),
      body: proto.Message.InteractiveMessage.Body.create({
        text: card.body.text || ''
      }),
      nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
        buttons: card.nativeFlowMessage.buttons.map(btn => ({
          name: btn.name,
          buttonParamsJson: btn.buttonParamsJson
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
          body: proto.Message.InteractiveMessage.Body.create({
            text: content
          }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.create({
            cards: cardsMessage
          })
        })
      }
    }
  }, { quoted })

  await sock.relayMessage(jid, msg.message, {
    messageId: msg.key.id
  })

  return msg
}

/**
 * Send Old Style Button (Template Message)
 * @param {Object} sock - Baileys socket connection
 * @param {String} jid - Chat ID
 * @param {Array} buttons - Array of button objects with text and command
 * @param {Object} options - Message options
 * @param {Object} quoted - Quoted message (optional)
 */
export async function replyButton(sock, jid, buttons, options = {}, quoted = null) {
  const {
    text = '',
    footer = '',
    media = null,
    document = null
  } = options

  // Convert old button format to new format
  const convertedButtons = buttons.map((btn, index) => {
    // If button already has native flow format
    if (btn.name && btn.buttonParamsJson) {
      return btn
    }

    // Convert old format to new format
    if (btn.name === 'single_select') {
      return {
        name: 'single_select',
        buttonParamsJson: JSON.stringify(btn.param || {})
      }
    }

    return {
      name: 'quick_reply',
      buttonParamsJson: JSON.stringify({
        display_text: btn.text || `Button ${index + 1}`,
        id: btn.command || `.button${index + 1}`
      })
    }
  })

  return await sendIAMessage(sock, jid, convertedButtons, {
    content: text,
    footer: footer,
    media: media,
    v2: document ? true : false
  }, quoted)
}

/**
 * Send Poll Message
 * @param {Object} sock - Baileys socket connection
 * @param {String} jid - Chat ID
 * @param {String} name - Poll question
 * @param {Object} options - Poll options
 */
export async function sendPoll(sock, jid, name, options = {}) {
  const {
    options: pollOptions = [],
    multiselect = false
  } = options

  const msg = {
    pollCreationMessage: {
      name: name,
      options: pollOptions.map(opt => ({ optionName: opt })),
      selectableOptionsCount: multiselect ? pollOptions.length : 1
    }
  }

  return await sock.sendMessage(jid, msg)
}

/**
 * Helper function to get buffer from URL or Buffer
 * @param {String|Buffer} media - Media URL or Buffer
 * @returns {Promise<Buffer>}
 */
async function getBuffer(media) {
  if (Buffer.isBuffer(media)) {
    return media
  }

  if (typeof media === 'string') {
    // If URL
    if (media.startsWith('http://') || media.startsWith('https://')) {
      const response = await fetch(media)
      return Buffer.from(await response.arrayBuffer())
    }

    // If base64
    if (media.startsWith('data:')) {
      return Buffer.from(media.split(',')[1], 'base64')
    }

    // If file path
    const fs = await import('fs')
    return fs.readFileSync(media)
  }

  throw new Error('Invalid media format')
}

// Import prepareWAMessageMedia from baileys
import { prepareWAMessageMedia } from '@whiskeysockets/baileys'

export default {
  sendIAMessage,
  sendCarousel,
  replyButton,
  sendPoll
}
