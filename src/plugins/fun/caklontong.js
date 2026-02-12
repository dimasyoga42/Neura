import axios from "axios"
import { registerCommand } from "../../../setting.js"
import { isBan } from "../fitur/ban.js"

const answer = new Map()

/* =========================
   CAKLONTONG
========================= */
export const Caklontong = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(chatId, { text: "selesaikan game sebelumnya" }, { quoted: msg })
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
      type: "caklontong",
      jawaban: data.jawaban.toUpperCase(),
      timeout,
      msgId: sent.key.id,
    })
  } catch {
    sock.sendMessage(chatId, { text: "terjadi kesalahan" }, { quoted: msg })
  }
}

/* =========================
   TEBAK GAMBAR
========================= */
export const tebakGambar = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(chatId, { text: "selesaikan game sebelumnya" }, { quoted: msg })
    }

    const res = await axios.get("https://api.deline.web.id/game/tebakgambar")
    const data = res.data.result

    const sent = await sock.sendMessage(
      chatId,
      {
        image: { url: data.img },
        caption:
          `tebak gambar\n\n` +
          `${data.deskripsi}\n\n` +
          `waktu: 60 detik\n` +
          `jawab dengan reply gambar ini`,
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
      type: "tebakgambar",
      jawaban: data.jawaban.toUpperCase(),
      timeout,
      msgId: sent.key.id,
    })
  } catch {
    sock.sendMessage(chatId, { text: "gagal memuat tebak gambar" }, { quoted: msg })
  }
}

/* =========================
   FAMILY100
========================= */
export const Family100 = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(chatId, { text: "selesaikan game sebelumnya" }, { quoted: msg })
    }

    const res = await axios.get("https://api.deline.web.id/game/family100")
    const data = res.data.result

    const jawabanList = data.jawaban.map(v => v.toUpperCase())

    const sent = await sock.sendMessage(
      chatId,
      {
        text:
          `family100\n\n` +
          `${data.soal}\n\n` +
          `jumlah jawaban: ${jawabanList.length}\n` +
          `waktu: 60 detik\n` +
          `jawab dengan reply pesan ini`,
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

export const Tekateki = async (sock, chatId, msg) => {
  try {
    if (answer.has(chatId)) {
      return sock.sendMessage(
        chatId,
        { text: "Selesaikan permainan yang sedang berjalan sebelum memulai yang baru." },
        { quoted: msg }
      );
    }

    const res = await axios.get(
      "https://raw.githubusercontent.com/dimasyoga42/dataset_Neura/master/games/susunkata.json",
      { timeout: 15000 }
    );

    const data = res?.data;
    if (!Array.isArray(data) || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Database soal kosong atau tidak valid." },
        { quoted: msg }
      );
    }

    const key = Math.floor(Math.random() * data.length);
    const soal = data[key];

    if (!soal?.soal || !soal?.jawaban) {
      return sock.sendMessage(
        chatId,
        { text: "Soal tidak valid." },
        { quoted: msg }
      );
    }

    const message = `
*SUSUN KATA*
Soal: ${soal.soal}
Kategori: ${soal.tipe || "-"}
Waktu: 60 detik

*Note:* Jawab dengan cara me-reply pesan ini.
`.trim();

    const sent = await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    );

    const timeout = setTimeout(async () => {
      if (!answer.has(chatId)) return;

      const game = answer.get(chatId);
      answer.delete(chatId);

      await sock.sendMessage(
        chatId,
        { text: `Waktu habis!\nJawaban yang benar adalah: *${game.jawaban}*` },
        { quoted: sent }
      );
    }, 60000);

    answer.set(chatId, {
      type: "tebakkata",
      jawaban: soal.jawaban.toUpperCase().replace(/\s+/g, " ").trim(),
      timeout,
      msgId: sent.key.id
    });
  } catch (err) {
    console.error("Error Tekateki:", err?.message);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat mengambil soal." },
      { quoted: msg }
    );
  }
};

/* =========================
   JAWAB (REPLY ONLY)
========================= */
export const jawab = async (sock, chatId, msg) => {
  try {
    if (!answer.has(chatId)) return

    const game = answer.get(chatId)

    const ctx = msg.message?.extendedTextMessage?.contextInfo
    if (!ctx || ctx.stanzaId !== game.msgId) return

    const userAnswer = msg.message.extendedTextMessage.text.trim().toUpperCase()
    if (!userAnswer) return

    /* ===== CAKLONTONG & TEBAK GAMBAR ===== */
    if (game.type === "caklontong" || game.type === "tebakgambar") {
      const correct = game.jawaban
      if (userAnswer === correct || correct.includes(userAnswer)) {
        clearTimeout(game.timeout)
        answer.delete(chatId)
        return sock.sendMessage(chatId, { text: "jawaban benar" }, { quoted: msg })
      }
      return sock.sendMessage(chatId, { text: "jawaban salah" }, { quoted: msg })
    }
    if (game.type === "tebakkata" || game.type === "tebakkata") {
      const correct = game.jawaban
      if (userAnswer === correct || correct.includes(userAnswer)) {
        clearTimeout(game.timeout)
        answer.delete(chatId)
        return sock.sendMessage(chatId, { text: "jawaban benar" }, { quoted: msg })
      }
      return sock.sendMessage(chatId, { text: "jawaban salah" }, { quoted: msg })
    }
    /* ===== FAMILY100 ===== */
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
const Skip = async (sock, chatId, msg) => {
  try {
    if (!answer.get(chatId)) return;
    sock.sendMessage(chatId, { text: `yaah payah gitu aja nyerah` }, { quoted: msg })
    answer.delete(chatId);
  } catch (error) {
    sock.sendMessage(chatId, { text: "terjadi kesalaha" }, { quoted: msg })
  }
}

registerCommand({
  name: "skip",
  alias: ["nyerah"],
  category: "Menu Fun",
  desc: "skip all mini game",
  run: async (sock, chatId, msg) => {
    //const allow = await ColdownUser(sock, chatId, msg, ".waifu");
    //if (!allow) return;
    if (isBan(sock, chatId, msg)) return;
    Skip(sock, chatId, msg);
  }
});
