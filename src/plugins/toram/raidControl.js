import path from "path";
import { getUserData } from "../../config/func.js";
import { adminValid } from "../../admin/controlAdmin.js";
const db = path.resolve("database", "raid.json");
export const createRaid = async (sock, chatId, msg, text) => {
  try {
    adminValid(sock, chatId, msg, text)
    const getdata = await getUserData(db);
    const idValidation = getdata.find((item) => item.id && item.id.some((i) => i.id === chatId));
    if (idValidation) return sock.sendMessage(chatId, { text: "party Raid sudah terbuat\n !clearRaid untuk membubarkan nya" }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg })
  }
}
