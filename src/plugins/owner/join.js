import { registerCommand } from "../../../setting.js";
import { isAdminvalid } from "../../admin/controlAdmin.js"
import { isBan } from "../fitur/ban.js";

export const setDesc = async (sock, chatId, msg, text) => {
  try {
    if (isAdminvalid(sock, chatId, msg)) return;
    const txt = text.replace(".setdesk", "")
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
registerCommand({
  name: "setdesk",
  alias: ["setdesk"],
  category: "Menu Admin",
  desc: "untuk ganti desc grub",
  run: async (sock, chatId, msg, args, text) => {
    if (isAdminvalid(sock, chatId, msg)) return;
    if (isBan(sock, chatId, msg)) return;
    setDesc(sock, chatId, msg, text);
    sock.sendMessage(chatId, { text: "berhasil di perbarui" }, { quoted: msg });
  }
});
