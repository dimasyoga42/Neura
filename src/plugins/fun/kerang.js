
const kerangAnswer = [
  "Ya",
  "Tidak",
  "Mungkin",
  "Coba lagi nanti",
  "Tentu saja",
  "Sangat tidak mungkin",
  "Kemungkinan besar",
  "Tidak bisa dipastikan",
]

export const kerang = (sock, chatId, msg, text) => {
  try {
    const args = text.split(" ")[1];
    if (!args) return sock.sendMessage(chatId, { text: messageEn.missingArgs + "\nUsage: .kerang <pertanyaan>" }, { quoted: msg });
    const answer = kerangAnswer[Math.floor(Math.random() * kerangAnswer.length)];
    sock.sendMessage(chatId, { text: answer }, { quoted: msg });
  } catch (error) {
    sock.sendMessage(chatId, { text: messageEn.errors }, { quoted: msg });
  }
}

