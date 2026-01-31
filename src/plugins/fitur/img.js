import { generateWelcomeImage } from "../../config/imgaetext.js"
import { menuMessage } from "../../config/variabel.js"
import { supabase } from "../../model/supabase.js"

export const setMenu = async (sock, chatId, msg, text) => {
  try {
    if (text !== "!menu") return
    if (!chatId.endsWith("@g.us")) return sock.sendMessage(chatId, { text: menuMessage }, { quoted: msg })
    const { data, err } = await supabase.from("bosdef").select("name")
    const { appview, erro } = await supabase.from("appview").select("name")
    const { monster, errorMons } = await supabase.from("monster").select("name")
    const { xtal, errorxtal } = await supabase.from("xtall").select("name")
    const { abili, errorabili } = await supabase.from("ability").select("name")
    const { item, erroritem } = await supabase.from("item").select("nama")
    const { regis, errorregis } = await supabase.from("regist").select("name")
    const user = msg.key.participant || msg.key.remoteJid
    const userName =
      msg.pushName ||
      sock.contacts?.[user]?.notify ||
      user.split("@")[0]

    const groupName =
      sock.groupMetadataCache?.[chatId]?.subject || "Group"

    let ppUrl
    try {
      ppUrl = await sock.profilePictureUrl(user, "image")
    } catch {
      ppUrl = "https://i.imgur.com/6VBx3io.png"
    }

    const image = await generateWelcomeImage(ppUrl, userName, groupName)

    await sock.sendMessage(chatId, {
      image,
      caption: `
      *Database statistik*
      Data bos:${data.length}
      Data appView: ${appview.length}
      Data Monster: ${monster.length}
      Data Xtall: ${xtal.length}
      Data regist: ${regis.length}
      Data Items: ${item.length}
      Data Ability: ${abili.length}
      \n\n${menuMessage}`,
      mentions: [user]
    }, { quoted: msg })

  } catch (err) {
    console.error("menu:", err)
  }
}

