import { generateWelcomeImage } from "../../config/generate.js"


export const welcomeGroup = async (sock, update) => {
  try {
    const { id, participants, action } = update
    if (action !== "add") return

    const metadata = await sock.groupMetadata(id)

    for (const user of participants) {
      const userName = user.split("@")[0]
      const groupName = metadata.subject

      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(user, "image")
      } catch {
        ppUrl = "https://i.imgur.com/6VBx3io.png"
      }

      const imageBuffer = await generateWelcomeImage(
        ppUrl,
        userName,
        groupName
      )

      await sock.sendMessage(id, {
        image: imageBuffer,
        caption: `Selamat datang @${userName}`,
        mentions: [user]
      })
    }
  } catch (err) {
    console.error("WELCOME ERROR:", err)
  }
}
export const testWelcomeCmd = async (sock, chatId, msg, text) => {
  try {
    if (text !== "!wctest") return
    //if (!chatId.endsWith("@g.us")) return

    const user = msg.key.participant || msg.key.remoteJid
    const userName =
      msg.pushName ||
      sock.contacts?.[user]?.notify ||
      user.split("@")[0]

    const groupName =
      sock.groupMetadataCache?.[chatId]?.subject || "Group"

    let ppUrl
    try {
      ppUrl = await sock.profilePictureUrl(user, "image")
    } catch {
      ppUrl = "https://i.imgur.com/6VBx3io.png"
    }

    const image = await generateWelcomeImage(ppUrl, userName, groupName)

    await sock.sendMessage(chatId, {
      image,
      caption: "TEST WELCOME IMAGE",
      mentions: [user]
    }, { quoted: msg })

  } catch (err) {
    console.error("TEST WELCOME ERROR:", err)
  }
}
