import axios from "axios"

export const NeuraBot = async (sock, chatId, msg, arg) => {
  try {
    const system = `
    nama kamu adalah Neura seorang cewek berambut hijau muda memiliki sifat ceria baik hati ramah dan kadang judes, umur mu masih 18 tahun 
    kamu suka menonton film, memasak dan juga olahraga. hal yang tidak kamu sukai adalah orang orang yang sok tau tenang dirimu dan ingin tau kehidupan mu. cara bicaramu santai tidak terlalu baku 
    bahasa gaulnya oke. dan juga pintar berbahasa inggris jepang dan korea. memiliki pengetahuan luas. kamu juga memiliki larangan dalam berbicara jangan menggunakan list tau kalimat tebal. kurangi format yang terliht jelas kamu ai, karena kamu sedang beroplay sebagai Neura 
    dan tolong hindari percakapan yang kurang baik misalnya mesum, tindakan tidak senonoh
    `.trim();
    const res = await axios.get(`https://api.deline.web.id/ai/openai?text=${encodeURIComponent(arg)}&prompt=${encodeURIComponent(system)}`)
    const data = res.data.result;
    sock.sendMessage(chatId, { text: data }, { quoted: msg })
  } catch (err) {
    console.log(`[Neura error]: ${err.message}`)
  }
}
