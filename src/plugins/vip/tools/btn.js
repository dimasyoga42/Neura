import { registerCommand } from "../../../../setting.js"

export async function btnTest(sock, chatId, m) {
  await sock.sendMessage(chatId, {
    text: "Neura Sama Interactive Button",
    footer: "Neura Sama",
    interactiveButtons: [
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Ping",
          id: ".ping"
        })
      },
      {
        name: "quick_reply",
        buttonParamsJson: JSON.stringify({
          display_text: "Menu",
          id: ".menu"
        })
      }
    ]
  }, { quoted: m })
}

registerCommand({
  name: "btntest",
  alias: ["button"],
  category: "Test",
  desc: "test button message",
  run: async (sock, chatId, msg) => {
    await btnTest(sock, chatId, msg)
  }
})
