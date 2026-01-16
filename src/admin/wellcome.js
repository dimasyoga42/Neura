import { supabase } from "../model/supabase.js"

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

    if (action !== 'add') return


    const { data, error } = await supabase
      .from("wellcome")
      .select("message")
      .eq("id_grub", chatId)
      .maybeSingle() // Gunakan maybeSingle agar tidak error jika data tidak ditemukan (mengembalikan null)

    if (error) {
      console.error("[WELCOME DB ERROR]", error.message);
      return;
    }

    if (!data || !data.message) return;

    const welcomeText = data.message;

    const groupMetadata = await sock.groupMetadata(chatId)

    for (const participant of participants) {
      const jid = typeof participant === 'string' ? participant : participant.id

      const message = welcomeText
        .replace(/@user/g, `@${jid.split('@')[0]}`)
        .replace(/@group/g, groupMetadata.subject)
        .replace(/@desc/g, groupMetadata.desc?.toString() || "Tanpa Deskripsi")
        .replace(/@count/g, groupMetadata.participants.length)

      await sock.sendMessage(chatId, {
        text: message,
        mentions: [jid]
      })
    }
  } catch (err) {
    console.error("[WELCOME HANDLER]", err)
  }
}
