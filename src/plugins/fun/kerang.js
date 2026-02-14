import { messageEn, registerCommand } from "../../../setting.js";
import { isBan } from "../fitur/ban.js";

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

const kerang = (sock, chatId, msg, text) => {
  try {
    const args = text.split(" ")[1];
    if (!args) return sock.sendMessage(chatId, { text: messageEn.missingArgs + "\nUsage: .kerang <pertanyaan>" }, { quoted: msg });
    const answer = kerangAnswer[Math.floor(Math.random() * kerangAnswer.length)];
    sock.sendMessage(chatId, { text: answer }, { quoted: msg });
  } catch (error) {
    sock.sendMessage(chatId, { text: messageEn.errors }, { quoted: msg });
  }
}

registerCommand({
  name: "kerang",
  alias: ["kerangajaib"],
  category: "Menu fun",
  desc: "Menjawab pertanyaan dengan jawaban acak ala kerang ajaib",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    kerang(sock, chatId, msg, text);
  }
})
