import axios from "axios"

const answer = new Map()

export const Caklontong = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(
        chatId,
        { text: "selesaikan pertanyaan sebelumnya" },
        { quoted: msg }
      )
    }

    const res = await axios.get("https://api.deline.web.id/game/caklontong")
    const data = res.data.data

    const sent = await sock.sendMessage(
      chatId,
      {
        text:
          `caklontong\n\n` +
          `${data.soal}\n\n` +
          `waktu: 60 detik\n` +
          `jawab dengan reply pesan ini`,
      },
      { quoted: msg }
    )

    const timeout = setTimeout(async () => {
      if (!answer.has(chatId)) return
      answer.delete(chatId)
      await sock.sendMessage(
        chatId,
        {
          text:
            `waktu habis\n` +
            `jawaban: ${data.jawaban}\n` +
            `penjelasan: ${data.deskripsi}`,
        },
        { quoted: sent }
      )
    }, 60000)

    answer.set(chatId, {
      jawaban: data.jawaban,
      timeout,
      msgId: sent.key.id,
    })
  } catch {
    sock.sendMessage(chatId, { text: "terjadi kesalahan" }, { quoted: msg })
  }
}

export const tebakGambar = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(
        chatId,
        { text: "selesaikan game yang sedang berjalan" },
        { quoted: msg }
      )
    }

    const res = await axios.get("https://api.deline.web.id/game/tebakgambar")
    const data = res.data.result

    await sock.sendMessage(chatId, { text: "memuat..." }, { quoted: msg })

    const sent = await sock.sendMessage(
      chatId,
      {
        image: { url: data.img },
        caption:
          `tebak gambar\n\n` +
          `${data.deskripsi}\n\n` +
          `jawab dengan reply gambar ini\n` +
          `waktu: 60 detik`,
      },
      { quoted: msg }
    )

    const timeout = setTimeout(async () => {
      if (!answer.has(chatId)) return
      answer.delete(chatId)
      await sock.sendMessage(
        chatId,
        { text: `waktu habis\njawaban: ${data.jawaban}` },
        { quoted: sent }
      )
    }, 60000)

    answer.set(chatId, {
      jawaban: data.jawaban,
      timeout,
      msgId: sent.key.id,
    })
  } catch {
    sock.sendMessage(chatId, { text: "gagal memuat tebak gambar" }, { quoted: msg })
  }
}

export const jawab = async (sock, chatId, msg) => {
  try {
    if (!answer.has(chatId)) return

    const game = answer.get(chatId)

    const ctx = msg.message?.extendedTextMessage?.contextInfo
    if (!ctx || !ctx.stanzaId) return

    if (ctx.stanzaId !== game.msgId) return

    const userAnswer = msg.message.extendedTextMessage.text.trim()
    if (!userAnswer) return

    const user = userAnswer.toUpperCase()
    const correct = game.jawaban.toUpperCase()

    if (user === correct || correct.includes(user)) {
      clearTimeout(game.timeout)
      answer.delete(chatId)
      return sock.sendMessage(
        chatId,
        { text: "jawaban benar" },
        { quoted: msg }
      )
    }

    sock.sendMessage(chatId, { text: "jawaban salah" }, { quoted: msg })
  } catch { }
}
