import { petGuide } from "../../config/variabel.js";

export const pet = (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!pet", "").trim();
    if (!arg) return sock.sendMessage(chatId, { text: "format anda salah\ngunakan !pet pilihan\npilihan yang tersedia:\nleveling\nskill\npadu\nlatih\n> data masih dalam proses update jika ada kesalahan mohon !report" }, { quoted: msg });
    if (arg === "leveling") {
      sock.sendMessage(chatId, { image: { url: 'https://i.ibb.co/dsr6H0t7/Pet-Nature.jpg' } }, { quoted: msg })
      sock.sendMessage(chatId, { text: petGuide.levelingPet }, { quoted: msg })
    } else if (arg === "skill") {
      sock.sendMessage(chatId, { text: petGuide.skillPet }, { quoted: msg })
    } else if (arg === "padu") {
      sock.sendMessage(chatId, { text: petGuide.fusionPet }, { quoted: msg })
    } else if (arg === "latih") {
      sock.sendMessage(chatId, { image: { url: `https://i.ibb.co/B245jnXN/Fuse-Diagram.jpg` }, caption: petGuide.trainingPet }, { quoted: msg })
    } else {
      sock.sendMessage(chatId, { text: "pilihan anda tidak ada" }, { quoted: msg })
    }
  } catch (err) {

  }
}


