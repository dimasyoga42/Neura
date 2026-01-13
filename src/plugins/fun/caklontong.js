import axios from "axios"

const answer = []

export const Caklontong = async (sock, chatId, msg, text) => {
  try {
    if (answer.id === chatId) return sock.sendMessage(chatId, { text: "selesaikan pertanyaan sebelumnya" }, { quoted: msg });
    const res = await axios.get("https://api.deline.web.id/game/caklontong")
    const data = await res.data.data
    const messageData = `*caklontong:*
    - ${data.soal}
    > gunakan !j untuk menjawab
      `.trim()
    sock.sendMessage(chatId, { text: messageData }, { quoted: msg })
    const newAnswer = {
      id: chatId,
      jawaban: data.jawaban
    }
    answer.push(newAnswer);
  } catch (err) {

  }
}
