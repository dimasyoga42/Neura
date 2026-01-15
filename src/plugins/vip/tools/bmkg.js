import axios from "axios";

export const autoGempa = async (sock, chatId, msg) => {
  try {
    const baseURL = "https://static.bmkg.go.id"
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
    sock.sendMessage(chatId, { image: { url: `${baseURL}/${data.gempa.shakemap}` }, caption: messagetxt }, { quoted: msg })
  } catch (err) {
    console.log(err.message);
  }
}
