import { getUserData, saveUserData } from "../config/func.js";
import path from "path";



const db = path.resolve("db", "prefix")

export const setPrefix = async (sock, chatId, msg, text) => {
  try {
    //ambil input user admin
    const arg = text.split(" ")
    const prefix = arg[1]
    //validasi jika kosong
    if (!prefix) return sock.sendMessage(chatId, { text: "tolong tambahkan prefix setelah .setPrefix" }, { quoted: msg });
    const data = getUserData(db)
    let prefixValid = data.find((item) => item.id === chatId);
    if (!prefixValid) {
      prefixValid = {
        id: chatId,
        prefix: [],
      }
      data.push(prefixValid)
      saveUserData(db, data);
    }

    prefixValid.prefix.push({
      res: prefix
    })
    saveUserData(db, data)
    return sock.sendMessage(chatId, { text: `prefix anda sudah di perbarui menjadi ${prefix}` }, { quoted: msg })
  } catch (error) {
    console.log(error.message);
  }
}


export const prefix = getUserData(db)

