import { generateWelcomeImage } from "../../config/imgaetext.js"
import { menuMessage } from "../../config/variabel.js"
import { supabase } from "../../model/supabase.js"

export const setMenu = async (sock, chatId, msg, text) => {
  try {
    if (text !== "!menu") return

    // Jika bukan group, kirim menu text saja
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg })
    }

    // Fetch data dari supabase dengan error handling
    const fetchData = async (table, column = "name") => {
      try {
        const { data, error } = await supabase.from(table).select(column)
        if (error) throw error
        return data || []
      } catch (err) {
        console.error(`Error fetching ${table}:`, err)
        return []
      }
    }

    // Fetch semua data secara parallel
    const [
      bosdefData,
      appviewData,
      monsterData,
      xtalData,
      abilityData,
      itemData,
      registData
    ] = await Promise.all([
      fetchData("bosdef"),
      fetchData("appview"),
      fetchData("monster"),
      fetchData("xtall"),
      fetchData("ability"),
      fetchData("item", "nama"),
      fetchData("regist")
    ])

    // Get user info
    const user = msg.key.participant || msg.key.remoteJid
    const userName = msg.pushName || sock.contacts?.[user]?.notify || user.split("@")[0]

    // Get group name
    const groupName = sock.groupMetadataCache?.[chatId]?.subject || "Group"

    // Get profile picture
    let ppUrl
    try {
      ppUrl = await sock.profilePictureUrl(user, "image")
    } catch {
      ppUrl = "https://i.imgur.com/6VBx3io.png"
    }

    // Generate welcome image
    let image
    try {
      image = await generateWelcomeImage(ppUrl, userName, groupName)
    } catch (err) {
      console.error("Error generating image:", err)
      // Fallback: kirim menu text saja jika gagal generate image
      return sock.sendMessage(chatId, {
        text: `
*Database Statistik*
📊 Data Boss: ${bosdefData.length}
📱 Data AppView: ${appviewData.length}
👹 Data Monster: ${monsterData.length}
💎 Data Xtal: ${xtalData.length}
📝 Data Regist: ${registData.length}
🎒 Data Items: ${itemData.length}
⚡ Data Ability: ${abilityData.length}

${menuMessage}`,
        mentions: [user]
      }, { quoted: msg })
    }

    // Send message with image
    await sock.sendMessage(chatId, {
      image,
      caption: `
*Database Statistik*
 Data Boss: ${bosdefData.length}
 Data AppView: ${appviewData.length}
 Data Monster: ${monsterData.length}
 Data Xtal: ${xtalData.length}
 Data Regist: ${registData.length}
 Data Items: ${itemData.length}
 Data Ability: ${abilityData.length}

${menuMessage}`.trim(),
      mentions: [user]
    }, { quoted: msg })

  } catch (err) {
    console.error("Error in setMenu:", err)

    // Fallback error handling - kirim menu basic
    try {
      await sock.sendMessage(chatId, {
        text: `⚠️ Terjadi kesalahan saat memuat menu.\n\n${menuMessage}`
      }, { quoted: msg })
    } catch (fallbackErr) {
      console.error("Error sending fallback menu:", fallbackErr)
    }
  }
}
