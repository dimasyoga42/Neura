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

export const HandleWelcome = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update

    // Hanya proses jika ada yang masuk (add)
    if (action !== 'add') return

    // 1. Cek Database
    const { data, error } = await supabase
      .from("wellcome")
      .select("message")
      .eq("id_grub", chatId)
      .maybeSingle()

    // Jika database error atau tidak ada data welcome, berhenti.
    if (error || !data || !data.message) return;

    const welcomeText = data.message;

    // 2. Ambil Informasi Grup
    const groupMetadata = await sock.groupMetadata(chatId)
    const groupName = groupMetadata.subject
    const memberCount = groupMetadata.participants.length

    // 3. Loop Member yang Masuk
    for (const participant of participants) {
      const jid = typeof participant === 'string' ? participant : participant.id
      const username = jid.split('@')[0]
      const nama = jid.pushName
      // --- PERBAIKAN LOGIKA FOTO PROFIL ---
      // Kita ambil URL foto profil dari server WhatsApp.
      // Hasilnya SUDAH BERUPA LINK (String URL).
      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(jid, 'image')
      } catch {
        // Jika user mem-private foto profil, gunakan link default
        ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
      }

      // 4. Susun Link API Canvas
      // Gunakan encodeURIComponent agar URL tidak rusak oleh karakter aneh
      const bg = "https://api.deline.web.id/Eu3BVf3K4x.jpg"
      const apiUrl = `https://api.deline.web.id/canvas/welcome?username=${encodeURIComponent(username || nama)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppUrl)}&background=${encodeURIComponent(bg)}&quality=99`

      // 5. Format Pesan Teks
      const caption = welcomeText
        .replace(/@user/g, `@${username}`)
        .replace(/@group/g, groupName)
        .replace(/@desc/g, groupMetadata.desc?.toString() || "")
        .replace(/@count/g, memberCount)

      // 6. Kirim Pesan
      await sock.sendMessage(chatId, {
        image: { url: apiUrl }, // Link API langsung dimasukkan ke sini
        caption: caption,
        mentions: [jid]
      })
    }
  } catch (err) {
    console.error("[WELCOME ERROR]", err)
  }
}
