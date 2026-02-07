import axios from "axios"
import { generateWelcomeImage } from "../../config/imgaetext.js"
import { menuMessage } from "../../config/variabel.js"
import { supabase } from "../../model/supabase.js"

const randomMenu = Math.floor(Math.random() * 4) + 1
export const setMenu = async (sock, chatId, msg, text) => {
  try {
    const thumbUrl = `https://raw.githubusercontent.com/dimasyoga42/dataset/main/image/menu/menu_${randomMenu}.gif`
    const { data: thumb } = await axios.get(thumbUrl, { responseType: "arraybuffer" })
    console.log(randomMenu)
    if (text !== "!menu") return

    // Jika bukan group, kirim menu text saja
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg })
    }

    // Fetch data dari supabase dengan error handling
    const fetchCount = async (table, column = "name") => {
      try {
        const { count, error } = await supabase
          .from(table)
          .select(column, { count: 'exact', head: true })

        if (error) throw error
        return count || 0
      } catch (err) {
        console.error(`Error fetching count from ${table}:`, err)
        return 0
      }
    }

    // Fetch semua count secara parallel
    const [
      bosdefCount,
      appviewCount,
      monsterCount,
      xtalCount,
      abilityCount,
      itemCount,
      registCount
    ] = await Promise.all([
      fetchCount("bosdef"),
      fetchCount("appview"),
      fetchCount("monster"),
      fetchCount("xtall"),
      fetchCount("ability"),
      fetchCount("item", "nama"),
      fetchCount("regist")
    ])


    const totalData = bosdefCount + appviewCount + monsterCount + xtalCount +
      abilityCount + itemCount + registCount


    const user = msg.key.participant || msg.key.remoteJid
    const userName = msg.pushName || sock.contacts?.[user]?.notify || user.split("@")[0]


    const groupName = sock.groupMetadataCache?.[chatId]?.subject || "Group"


    let ppUrl
    try {
      ppUrl = await sock.profilePictureUrl(user, "image")
    } catch {
      ppUrl = "https://i.imgur.com/6VBx3io.png"
    }


    let image
    try {
      image = await generateWelcomeImage(ppUrl, userName, groupName)
    } catch (err) {
      console.error("Error generating image:", err)
      return sock.sendMessage(chatId, {
        text: `
*Database Statistik*
 Data Boss: ${bosdefCount.toLocaleString()}
 Data AppView: ${appviewCount.toLocaleString()}
 Data Monster: ${monsterCount.toLocaleString()}
 Data Xtal: ${xtalCount.toLocaleString()}
 Data Regist: ${registCount.toLocaleString()}
 Data Items: ${itemCount.toLocaleString()}
 Data Ability: ${abilityCount.toLocaleString()}
 *Total Database: ${totalData.toLocaleString()}*


${menuMessage}`,
        mentions: [user]
      }, { quoted: msg })
    }


    await sock.sendMessage(chatId, {
      image: { url: `https://raw.githubusercontent.com/dimasyoga42/dataset/main/image/menu/menu_${randomMenu}.gif` },
      jpegThumbnail: thumb,
      gifPlayback: true,
      caption: `
*Database Statistik*
 Data Boss: ${bosdefCount.toLocaleString()}
 Data AppView: ${appviewCount.toLocaleString()}
 Data Monster: ${monsterCount.toLocaleString()}
 Data Xtal: ${xtalCount.toLocaleString()}
 Data Regist: ${registCount.toLocaleString()}
 Data Items: ${itemCount.toLocaleString()}
 Data Ability: ${abilityCount.toLocaleString()}
*Total Database: ${totalData.toLocaleString()}*
${menuMessage}`.trim(),
      mentions: [user]
    }, { quoted: msg })

  } catch (err) {
    console.error("Error in setMenu:", err)


    try {
      await sock.sendMessage(chatId, {
        text: `⚠️ Terjadi kesalahan saat memuat menu.\n\n${menuMessage}`
      }, { quoted: msg })
    } catch (fallbackErr) {
      console.error("Error sending fallback menu:", fallbackErr)
    }
  }
}
