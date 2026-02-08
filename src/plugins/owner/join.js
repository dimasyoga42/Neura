import { isAdminvalid } from "../../admin/controlAdmin.js"

export const setDesc = async (sock, chatId, msg, text) => {
  try {
    if (isAdminvalid(sock, chatId, msg)) return;
    const txt = text.replace(".setdescgc", "")
    if (!txt) return sock.sendMessage(chatId, { text: "mana teks nya" }, { quoted: msg });
    await sock.groupUpdateDescription(chatId, `${txt}`.trim())
    sock.sendMessage(chatId, { text: "deskripsi grub berhasil di ubah" }, { quoted: msg });
  } catch (error) {
    console.log(error.message)
  }
}

export const getUndangan = () => {
  try {

  } catch (error) {

  }
}

//owner
export const join = () => {

}
