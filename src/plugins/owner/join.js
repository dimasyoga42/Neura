import { registerCommand } from "../../../setting.js";
import { isAdminvalid } from "../../admin/controlAdmin.js"
import { isBan } from "../fitur/ban.js";

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

registerCommand({
  name: "setdescgc",
  alias: ["setdescgc"],
  category: "Menu Admin",
  desc: "untuk merubah desc grub",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    setDesc(sock, chatId, msg, text)
  }
})

export const getUndangan = () => {
  try {

  } catch (error) {

  }
}

//owner
export const join = () => {

}
