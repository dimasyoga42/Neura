import pkg from "@whiskeysockets/baileys"
const { proto, generateWAMessageFromContent, generateWAMessageContent } = pkg

/**
 * Fungsi untuk mengirim pesan interaktif dengan media
 */
export const sendInteractiveMessage = async (sock, jid, options = {}, quoted = {}) => {
  // Helper untuk generate konten media (image/video)
  const generateMedia = async (type, url) => {
    const generated = await generateWAMessageContent({
      [type]: { url }
    }, {
      upload: sock.waUploadToServer
    })
    return generated[`${type}Message`]
  }

  // Persiapan Header (Media atau Teks)
  let header;
  if (options.image) {
    header = proto.Message.InteractiveMessage.Header.create({
      title: options.title || "",
      hasMediaAttachment: true,
      imageMessage: await generateMedia("image", options.image)
    })
  } else if (options.video) {
    header = proto.Message.InteractiveMessage.Header.create({
      title: options.title || "",
      hasMediaAttachment: true,
      videoMessage: await generateMedia("video", options.video)
    })
  } else {
    header = proto.Message.InteractiveMessage.Header.create({
      title: options.title || "",
      hasMediaAttachment: false
    })
  }

  // Konstruksi Pesan
  const interactiveMessage = proto.Message.InteractiveMessage.create({
    body: proto.Message.InteractiveMessage.Body.create({
      text: options.body || ""
    }),
    footer: proto.Message.InteractiveMessage.Footer.create({
      text: options.footer || ""
    }),
    header: header,
    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
      buttons: options.buttons || []
    })
  })

  const message = generateWAMessageFromContent(jid, {
    viewOnceMessage: {
      message: {
        messageContextInfo: {
          deviceListMetadata: {},
          deviceListMetadataVersion: 2
        },
        interactiveMessage: interactiveMessage
      }
    }
  }, { quoted, userJid: sock.user.id })

  await sock.relayMessage(jid, message.message, {
    messageId: message.key.id
  })

  return message
}
