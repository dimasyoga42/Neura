// Storage untuk welcome messages
const welcomeData = new Map()

export const SetWelcome = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!setwc", "")
    if (!arg) return sock.sendMessage(
      chatId,
      {
        text:
          `Format salah!

Cara penggunaan:
!setwc teks welcome

Tag yang tersedia:
@user = mention user yang masuk
@decs = deskripsi grup`
      },
      { quoted: msg }
    )
    welcomeData.set(chatId, arg)
    sock.sendMessage(chatId, { text: "✅ Welcome diset!" }, { quoted: msg })
  } catch (err) {
    console.error("[SETWELCOME]", err)
  }
}

export const HandleWelcome = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update
    if (action !== 'add') return

    const welcomeText = welcomeData.get(chatId)
    if (!welcomeText) return

    const groupMetadata = await sock.groupMetadata(chatId)

    for (const participant of participants) {
      const message = welcomeText
        .replace(/{user}/g, `@${participant.split('@')[0]}`)
        .replace(/{group}/g, groupMetadata.subject)
        .replace(/{count}/g, groupMetadata.participants.length)

      await sock.sendMessage(chatId, {
        text: message,
        mentions: [participant]
      })
    }
  } catch (err) {
    console.error("[WELCOME]", err)
  }
}
