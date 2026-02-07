import axios from "axios";
import { registerCommand } from "../../../../setting.js";
import { isBan } from "../../fitur/ban.js";

export const autoGempa = async (sock, chatId, msg) => {
  try {
    const res = await axios.get("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json");
    const data = res.data.Infogempa

    const messagetxt = `
*Informasi Gempa Terbaru By BMKG*
tanggl: ${data.gempa.Tanggal}
jam: ${data.gempa.Jam}
coordinat:${data.gempa.Coordinates}
lintang: ${data.gempa.Lintang}
bujur: ${data.gempa.Bujur}
magnitude: ${data.gempa.Magnitude}
kedalaman: ${data.gempa.Kedalaman}
wilayah: ${data.gempa.Wilayah}
potensi: ${data.gempa.Potensi}
    `.trim()
    sock.sendMessage(chatId, { image: { url: `https://static.bmkg.go.id/${data.gempa.Shakemap}` }, caption: messagetxt }, { quoted: msg })
  } catch (err) {
    console.log(err.message);
  }
}

registerCommand({
  name: "gempa",
  alias: ["infogempa"],
  category: "Menu info",
  desc: "memberikan data terbaru terkait gempa",
  run: async (sock, chatId, msg) => {
    if (isBan(sock, chatId, msg)) return;
    autoGempa(sock, chatId, msg)
  }
})
