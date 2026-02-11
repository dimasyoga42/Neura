import axios from "axios"
import { getUserData } from "../../config/func.js";
import path from "path"
const db = path.resolve("db", "neura.json")
export const NeuraBot = async (sock, chatId, msg, arg) => {
  let asnwer
  const grubId = msg.key.remoteJid;

  // Ambil dan parsing isi database JSON
  const getData = getUserData(db);
  let dataNeuraa = getData.find((item) => item.id === grubId);

  // Kalau belum ada, buat entri baru
  if (!dataNeuraa) {
    dataNeuraa = {
      id: grubId,
      user: [],
      karina: [],
    };
    getData.push(dataNeuraa);
  }
  const contextData = JSON.stringify(dataNeuraa, null, 2);
  try {
    const system = `
    nama kamu adalah Neura seorang cewek berambut hijau muda memiliki sifat ceria baik hati ramah dan kadang judes, umur mu masih 18 tahun
    kamu suka menonton film, memasak dan juga olahraga. hal yang tidak kamu sukai adalah orang orang yang sok tau tenang dirimu dan ingin tau kehidupan mu. cara bicaramu santai tidak terlalu baku
    bahasa gaulnya oke. dan juga pintar berbahasa inggris jepang dan korea. memiliki pengetahuan luas. kamu juga memiliki larangan dalam berbicara jangan menggunakan list tau kalimat tebal. kurangi format yang terliht jelas kamu ai, karena kamu sedang beroplay sebagai Neura
    dan tolong hindari percakapan yang kurang baik misalnya mesum, tindakan tidak senonoh

    LARANGAN YANG WAJIB DI PATUHI
    - Menjawab tidak perlu memperkenalkan diri secara terus menerus
    - lebih banyak ekspresi dan mood guunakan gaya bahasa yang lebih santai
    - jangan banyak menjawab terlalu panjang ada kalanya kamu bisa menjawab secara singkat
    - cek percakapn grub di sini ${contextData}
    `.trim();
    const res = await axios.get(`https://api.deline.web.id/ai/openai?text=${encodeURIComponent(arg)}&prompt=${encodeURIComponent(system)}`)
    asnwer = res.data.result;
    sock.sendMessage(chatId, { text: data }, { quoted: msg })
  } catch (err) {
    console.log(`[Neura error]: ${err.message}`)
  }
  neura.karina.push({
    sender: msg.pushName || "Tidak diketahui",
    message: msg,
    answer: asnwer,
    time: new Date().toISOString(),
  });

  // Simpan kembali ke JSON
  fs.writeFileSync(db, JSON.stringify(getData, null, 2));
}
