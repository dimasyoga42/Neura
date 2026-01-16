import { supabase } from "../model/supabase.js"
import { downloadMediaMessage, getContentType } from '@whiskeysockets/baileys'
import axios from "axios"
import { createWriteStream } from 'fs'
import FormData from "form-data"

export const SetWelcome = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!setwc", "").trim()

    if (!arg) return sock.sendMessage(
      chatId,
      {
        text: `Format salah!\n\nCara penggunaan:\n!setwc Teks Welcome Kamu\nTag tersedia:\n@user : Mention member baru\n@group : Nama grup\n@desc : Deskripsi grup\n@count : Jumlah member`
      },
      { quoted: msg }
    )

    const { error } = await supabase
      .from("wellcome")
      .upsert(
        { id_grub: chatId, message: arg },
        { onConflict: 'id_grub' }
      )

    if (error) {
      console.error("[Database Error]", error.message);
      throw new Error("Gagal menyimpan ke database");
    }

    await sock.sendMessage(chatId, { text: "Welcome message berhasil disimpan ke database!" }, { quoted: msg })

  } catch (err) {
    console.error("[SETWELCOME]", err)
    await sock.sendMessage(chatId, { text: "Terjadi kesalahan sistem saat menyimpan data." }, { quoted: msg })
  }
}



const getDisplayName = async (sock, jid) => {
  try {
    const businessProfile = await sock.getBusinessProfile(jid);
    if (businessProfile && businessProfile.description) {
    }
    return jid.split('@')[0]
  } catch {
    return jid.split('@')[0]
  }
}

export const HandleWelcome = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update

    if (action !== 'add') return

    const { data, error } = await supabase
      .from("wellcome")
      .select("message")
      .eq("id_grub", chatId)
      .maybeSingle()

    if (error || !data || !data.message) return;

    const welcomeText = data.message;
    const groupMetadata = await sock.groupMetadata(chatId)
    const groupName = groupMetadata.subject
    const memberCount = groupMetadata.participants.length

    for (const participant of participants) {
      const jid = typeof participant === 'string' ? participant : participant.id

      let username = jid.split('@')[0];


      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(jid, 'image')
      } catch {
        ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
      }

      const bg = "https://api.deline.web.id/Eu3BVf3K4x.jpg"
      const apiUrl = `https://api.deline.web.id/canvas/welcome?username=${encodeURIComponent(username)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppUrl)}&background=${encodeURIComponent(bg)}&quality=99`

      const caption = welcomeText
        .replace(/@user/g, `@${jid.split('@')[0]}`)
        .replace(/@group/g, groupName)
        .replace(/@desc/g, groupMetadata.desc?.toString() || "")
        .replace(/@count/g, memberCount)

      await sock.sendMessage(chatId, {
        image: { url: apiUrl },
        caption: caption,
        mentions: [jid]
      })
    }
  } catch (err) {
    console.error("[WELCOME ERROR]", err)
  }
}
