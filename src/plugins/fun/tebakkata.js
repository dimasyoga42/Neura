import axios from "axios";


const answer = new Map();

export const Tekateki = async (sock, chatId, msg) => {
  try {

    if (answer.has(chatId)) {
      return sock.sendMessage(chatId, { text: "Selesaikan permainan yang sedang berjalan sebelum memulai yang baru." }, { quoted: msg });
    }


    const res = await axios.get("https://raw.githubusercontent.com/dimasyoga42/dataset_Neura/master/games/susunkata.json");
    const getData = res.data;


    const key = Math.floor(Math.random() * getData.length);
    const soal = getData[key];

    const message = `
*SUSUN KATA*
Soal: ${soal.soal}
Kategori: ${soal.tipe}
Waktu: 60 detik

*Note:* Jawab dengan cara me-reply pesan ini.
`.trim();


    const sent = await sock.sendMessage(chatId, { text: message }, { quoted: msg });


    const timeout = setTimeout(async () => {
      if (answer.has(chatId)) {
        const game = answer.get(chatId);

        answer.delete(chatId);
        await sock.sendMessage(
          chatId,
          { text: `Waktu habis!\nJawaban yang benar adalah: *${game.jawaban}*` },
          { quoted: sent }
        );
      }
    }, 60000);

    // Menyimpan data permainan ke dalam Map
    answer.set(chatId, {
      jawaban: soal.jawaban.toUpperCase(),
      timeout,
      msgId: sent.key.id
    });

  } catch (error) {
    console.error("Error pada fungsi Tekateki:", error.message);
    sock.sendMessage(chatId, { text: "Terjadi kesalahan saat memproses permainan." }, { quoted: msg });
  }
};

export const jawabTebakkata = async (sock, chatId, msg) => {
  try {
    if (!answer.has(chatId)) return;

    const game = answer.get(chatId);


    const userAnswer = msg.message.extendedTextMessage.text.trim().toUpperCase()
    if (!userAnswer) return

    // Logika Validasi: Harus sama persis untuk menghindari kecurangan (substring matching)
    if (userAnswer === game.jawaban) {
      clearTimeout(game.timeout);
      answer.delete(chatId);
      return sock.sendMessage(chatId, { text: "🎉 Jawaban Anda benar!" }, { quoted: msg });
    } else {

      return sock.sendMessage(chatId, { text: "Jawaban salah, coba lagi!" }, { quoted: msg });
    }

  } catch (error) {
    console.error("Error pada fungsi jawabTebakkata:", error.message);
  }
};
