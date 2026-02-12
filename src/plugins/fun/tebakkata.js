
import axios from "axios";
const answer = new Map()

export const Tekateki = async (sock, chatId, msg, text) => {
  try {
    if (answer.has(chatId)) return sock.sendMessage(chatId, { text: "selesaikan permainan yang sedang berjalan" }, { quoted: msg })
    const res = await axios.get("https://raw.githubusercontent.com/dimasyoga42/dataset_Neura/master/games/susunkata.json")
    const getData = res.data
    //generate soal
    const key = Math.floor(Math.random() * getData.length) + 1
    const soal = getData[key]
    //save Jawaban
    const timeout = setTimeout(async () => {
      if (!answer.has(chatId)) return
      answer.delete(chatId)
      await sock.sendMessage(
        chatId,
        { text: `waktu habis\njawaban: ${soal.jawaban}` },
        { quoted: sent }
      )
    }, 60000)
    answer.set(chatId, { jawaban: soal.jawaban, timeout })
    const message = `
    *${soal.soal}*
    Category: ${soal.tipe}
    Time: 60 sec
    Note: Jawab dengan cara replay bubble chat ini.
    `.trim()
    //sock.sendMessage(chatId, {text: re})
    console.log(answer)
  } catch (error) {
    console.log(error.message)
  }
}

export const jawabTebakkata = async (sock, chatId, msg) => {
  try {
    if (!answer.has(chatId)) return

    const game = answer.get(chatId)

    const userAnswer = msg.message.extendedTextMessage.text.trim().toLowerCase()
    if (!userAnswer) return

    const correct = game.jawaban.toLowerCase()

    if (userAnswer === correct || correct.includes(userAnswer)) {
      clearTimeout(game.timeout)
      answer.delete(chatId)
      return sock.sendMessage(chatId, { text: "jawaban benar" }, { quoted: msg })
    }
    return sock.sendMessage(chatId, { text: "jawaban salah" }, { quoted: msg })

  } catch (error) {
    sock.sendMessage(chatId, { text: error.message }, { quoted: msg })
  }
}

