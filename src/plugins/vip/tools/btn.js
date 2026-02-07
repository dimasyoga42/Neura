import { registerCommand } from "../../../../setting.js"

export const btntest = async (sock, chatId, m) => {
  const buttons = [
    {
      buttonId: ".ping",
      buttonText: { displayText: "Ping" },
      type: 1
    },
    {
      buttonId: ".menu",
      buttonText: { displayText: "Menu" },
      type: 1
    },
    {
      buttonId: ".owner",
      buttonText: { displayText: "Owner" },
      type: 1
    }
  ]

  const buttonMessage = {
    text: "Test Button Neura Sama",
    footer: "Neura Sama Bot",
    buttons: buttons,
    headerType: 1
  }

  await sock.sendMessage(chatId, buttonMessage, { quoted: m })
}
registerCommand({
  name: "btntest",
  alias: ["button"],
  category: "Test",
  desc: "test button message",
  run: async (sock, chatId, msg) => {
    await btntest(sock, chatId, msg)
  }
})
