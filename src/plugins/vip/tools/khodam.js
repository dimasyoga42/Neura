import axios from "axios"


export const khodam = async (sock, chatId, msg) => {
  try {
    const data = await axios.get(`https://api.neoxr.eu/api/khodam?apikey=${process.env.NEOXR_KEY}`)
    const res = data.data
    console.log(res)
  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg })
  }
}
