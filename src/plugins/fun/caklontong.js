import axios from "axios"

const answer = new Map();

export const Caklontong = async (sock, chatId, msg, text) => {
  try {
    if (answer.has(chatId)) return sock.sendMessage(chatId, { text: "selesaikan pertanyaan sebelumnya" }, { quoted: msg });
    const res = await axios.get("https://api.deline.web.id/game/caklontong")
    const data = await res.data.data
    const messageData = `*caklontong:*
    - ${data.soal}\nwaktu: 60detik\n> gunakan !j untuk menjawab
      `.trim()
    sock.sendMessage(chatId, { text: messageData }, { quoted: msg });
    answer.set(chatId, {
      jawaban: data.jawaban,
      timestamp: Date.now()
    });
    setTimeout(() => {
      if (answer.has(chatId)) {
        answer.delete(chatId);
        sock.sendMessage(chatId, { text: `waktu habis,jawaban yang benar adalah:${data.jawaban}` }, { quoted: msg })
      }
    }, 60000)
  } catch (err) {
  }
}
