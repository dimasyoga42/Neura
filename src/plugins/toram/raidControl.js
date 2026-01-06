import path from "path";
import { getUserData, saveUserData } from "../../config/func.js";
import { adminValid } from "../../admin/controlAdmin.js";
const db = path.resolve("database", "raid.json");
export const createRaid = async (sock, chatId, msg, text, element, count) => {
  try {
    adminValid(sock, chatId, msg, text)
    const getdata = await getUserData(db);
    const idValidation = getdata.find((item) => item.id && item.id.some((i) => i.id === chatId));
    if (idValidation) return sock.sendMessage(chatId, { text: "party Raid sudah terbuat\n !clearRaid untuk membubarkan nya" }, { quoted: msg });
    let partyEnrty = getdata.find((item) => item.id === chatId);
    if (!partyEnrty) {
      partyEnrty = {
        id: chatId,
        bos_ele: element,
        hadiah: count,
        party: [
          {
            pt1: {},
            pt2: {},
            pt3: {},
            pt4: {},
          }
        ]
      }
      getdata.push(partyEnrty);
    }
    saveUserData(db, getdata);
    const messageUp = `
    Join Party raid now\n> use !join <party> <ign>, !join pt1 sheyzo (pt1 - pt4)
    element bos: ${element}
    hadiah: ${count}
    party 1 
    -
    -
    -
    -
    party 2 
    -
    -
    -
    -
    party 3 
    -
    -
    -
    -
    party 4 
    -
    -
    -
    -
    `.trim()
    sock.sendMessage(chatId, { text: messageUp }, { quoted: msg })

  } catch (err) {
    sock.sendMessage(chatId, { text: err }, { quoted: msg })
  }
}
