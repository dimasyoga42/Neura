import axios from "axios";

const answer = new Map();

const getText = (msg) => {
  if (!msg?.message) return "";
  if (msg.message.conversation) return msg.message.conversation;
  if (msg.message.extendedTextMessage?.text) return msg.message.extendedTextMessage.text;
  return "";
};

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

export const jawabTebakkata = async (sock, chatId, msg) => {
  try {
    if (!answer.has(chatId)) return;

    const game = answer.get(chatId);

    const quotedId =
      msg?.message?.extendedTextMessage?.contextInfo?.stanzaId;

    if (!quotedId || quotedId !== game.msgId) return;

    let userAnswer = getText(msg);
    if (!userAnswer) return;

    userAnswer = userAnswer.toUpperCase().replace(/\s+/g, " ").trim();

    if (userAnswer === game.jawaban) {
      clearTimeout(game.timeout);
      answer.delete(chatId);

      return sock.sendMessage(
        chatId,
        { text: "Jawaban benar!" },
        { quoted: msg }
      );
    } else {
      return sock.sendMessage(
        chatId,
        { text: "Jawaban salah, coba lagi!" },
        { quoted: msg }
      );
    }
  } catch (err) {
    console.error("Error jawabTebakkata:", err?.message);
  }
};
