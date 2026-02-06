import axios from "axios"

const answer = new Map()

export const Family100 = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(
        chatId,
        { text: "selesaikan game sebelumnya" },
        { quoted: msg }
      )
    }

    const res = await axios.get("https://api.deline.web.id/game/family100")
    const data = res.data.data

    const soal = data.soal
    const jawabanList = data.jawaban.map(v => v.toUpperCase())

    const sent = await sock.sendMessage(
      chatId,
      {
        text:
          `family100\n\n` +
          `${soal}\n\n` +
          `jumlah jawaban: ${jawabanList.length}\n` +
          `jawab dengan reply pesan ini\n` +
          `waktu: 60 detik`,
      },
      { quoted: msg }
    )

    const timeout = setTimeout(async () => {
      if (!answer.has(chatId)) return
      const game = answer.get(chatId)
      answer.delete(chatId)

      await sock.sendMessage(
        chatId,
        {
          text:
            `waktu habis\n` +
            `jawaban tersisa:\n` +
            game.list.join("\n"),
        },
        { quoted: sent }
      )
    }, 60000)

    answer.set(chatId, {
      type: "family100",
      list: jawabanList,
      timeout,
      msgId: sent.key.id,
    })
  } catch {
    sock.sendMessage(chatId, { text: "gagal memuat family100" }, { quoted: msg })
  }
}

export const jawab = async (sock, chatId, msg) => {
  try {
    if (!answer.has(chatId)) return
    const game = answer.get(chatId)

    const ctx = msg.message?.extendedTextMessage?.contextInfo
    if (!ctx || ctx.stanzaId !== game.msgId) return

    const userAnswer = msg.message.extendedTextMessage.text.trim().toUpperCase()
    if (!userAnswer) return

    if (game.type === "family100") {
      const index = game.list.findIndex(v => v === userAnswer || v.includes(userAnswer))
      if (index !== -1) {
        const benar = game.list[index]
        game.list.splice(index, 1)

        if (game.list.length === 0) {
          clearTimeout(game.timeout)
          answer.delete(chatId)
          return sock.sendMessage(
            chatId,
            { text: `jawaban benar: ${benar}\nsemua jawaban habis, game selesai` },
            { quoted: msg }
          )
        }

        return sock.sendMessage(
          chatId,
          {
            text:
              `jawaban benar: ${benar}\n` +
              `sisa jawaban: ${game.list.length}`,
          },
          { quoted: msg }
        )
      }

      return sock.sendMessage(chatId, { text: "jawaban salah" }, { quoted: msg })
    }

  } catch { }
}
