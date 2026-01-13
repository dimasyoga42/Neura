import axios from "axios"

const answer = new Map();

export const Caklontong = async (sock, chatId, msg, text) => {
  try {
    if (answer.has(chatId)) return sock.sendMessage(chatId, { text: "selesaikan pertanyaan sebelumnya" }, { quoted: msg });
    const res = await axios.get("https://api.deline.web.id/game/caklontong")
    const data = await res.data.data
    const messageData = `*caklontong:*\n*${data.soal}*\nwaktu: 60detik\n> gunakan !j untuk menjawab
      `.trim()
    sock.sendMessage(chatId, { text: messageData }, { quoted: msg });
    answer.set(chatId, {
      jawaban: data.jawaban,
      timestamp: Date.now()
    });
    setTimeout(() => {
      if (answer.has(chatId)) {
        answer.delete(chatId);
        sock.sendMessage(chatId, { text: `waktu habis,jawaban yang benar adalah: *${data.jawaban}* penjelasan: ${data.deskripsi}` }, { quoted: msg })
      }
    }, 60000)
  } catch (err) {
  }
}
export const tebakGambar = async (sock, chatId, msg, text) => {
  try {
    if (answer.has(chatId)) sock.sendMessage(chatId, { text: "selesaikan terlebih dahulu game yang sedang berjalan" }, { quoted: msg });
    const res = await axios.get("https://api.deline.web.id/game/tebakgambar");
    const Imag = res.data?.Result;
    console.log(Imag)
    answer.set(chatId, {
      jawaban: Imag.jawaban,
      timestamp: Date.now()
    })
    sock.sendMessage(chatId, { text: "sedang memuat..." }, { quoted: msg });
    sock.sendMessage(chatId, { image: { url: `${Imag.img}` }, caption: `${Imag.deskripsi}\n> jawab menggunakan !j` }, { quoted: msg });
    setTimeout(() => {
      if (answer.has(chatId)) {
        answer.delete(chatId);
        sock.sendMessage(chatId, { text: `waktu habis. jawaban yang benar adalah *${Imag.jawaban}*` }, { quoted: msg })
      }
    }, 60000)
  } catch (err) {
    sock.sendMessage(chatId, { text: `error tolong !report <error>\n ${err}` }, { quoted: msg })
  }
}
export const jawab = (sock, chatId, msg, text) => {
  try {
    const jawab = text.replace("!j", "");
    if (!answer.has(chatId)) return sock.sendMessage(chatId, { text: "anda tidak memulai permainan apapun gunakan salah satu cmd fun untuk memulai permainan" });
    if (!jawab) return sock.sendMessage(chatId, { text: "mana jawaban nya kocak" }, { quoted: msg });
    const jwb = answer.get(chatId);
    const jwbBener = jwb.jawaban
    if (jwb === jwbBener || jawab.includes(jwbBener) || jwbBener.includes(jawab)) return sock.sendMessage(chatId, { text: "hebat jawaban mu benar...." });
    sock.sendMessage(chatId, { text: "masih salah coba di jawab lagi" }, { quoted: msg })

  } catch (err) {
    console.log(err)
  }
}
