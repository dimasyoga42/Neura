import { supabase } from "../model/supabase.js"

// Fungsi SetWelcome (Tidak berubah)
export const SetWelcome = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace("!setwc", "").trim()

    if (!arg) return sock.sendMessage(
      chatId,
      { text: `Format salah!\n\nCara penggunaan:\n!setwc Teks Welcome Kamu` },
      { quoted: msg }
    )

    const { error } = await supabase
      .from("wellcome")
      .upsert({ id_grub: chatId, message: arg }, { onConflict: 'id_grub' })

    if (error) throw new Error(error.message);

    await sock.sendMessage(chatId, {
      text: "✅ Welcome message berhasil disimpan!"
    }, { quoted: msg })
  } catch (err) {
    console.error("[SETWELCOME]", err)
    await sock.sendMessage(chatId, {
      text: "Gagal menyimpan data."
    }, { quoted: msg })
  }
}

// ===== FUNGSI HELPER UNTUK MENDAPATKAN NAMA =====
const getDisplayName = async (sock, jid, groupId) => {
  try {
    let displayName = jid.split('@')[0]; // Default: nomor HP

    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const participant = groupMetadata.participants.find(p => p.id === jid);

      if (participant) {
        // Coba ambil notify name dari participant
        if (participant.notify) {
          return participant.notify;
        }
      }
    } catch (e) {
      console.log('Gagal ambil dari group metadata:', e.message);
    }


    try {
      const [contactInfo] = await sock.onWhatsApp(jid);
      if (contactInfo && contactInfo.notify) {
        return contactInfo.notify;
      }
    } catch (e) {
      console.log('Gagal ambil dari onWhatsApp:', e.message);
    }

    try {
      const businessProfile = await sock.getBusinessProfile(jid);
      if (businessProfile && businessProfile.description) {
      }
    } catch (e) {
    }

    try {
      const contacts = await sock.fetchStatus(jid);
      if (contacts && contacts.status) {
      }
    } catch (e) {
    }

    return displayName; // Return nomor jika semua metode gagal

  } catch (err) {
    console.error('Error getDisplayName:', err);
    return jid.split('@')[0];
  }
}

// ===== HANDLE WELCOME (PERBAIKAN) =====
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
    const groupDesc = groupMetadata.desc?.toString() || "Tidak ada deskripsi"

    for (const participant of participants) {
      const jid = typeof participant === 'string' ? participant : participant.id

      let username = await getDisplayName(sock, jid, chatId);

      if (username === jid.split('@')[0]) {
        const participantObj = groupMetadata.participants.find(p => p.id === jid);
        if (participantObj && participantObj.notify) {
          username = participantObj.notify;
        }
      }

      console.log(`[WELCOME] User: ${username} (${jid})`);

      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(jid, 'image')
      } catch {
        ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
      }

      const bg = "https://api.deline.web.id/Eu3BVf3K4x.jpg"
      const apiUrl = `https://api.deline.web.id/canvas/welcome?username=${encodeURIComponent(username)}&guildName=${encodeURIComponent(groupName)}&memberCount=${memberCount}&avatar=${encodeURIComponent(ppUrl)}&background=${encodeURIComponent(bg)}&quality=99`

      const caption = welcomeText
        .replace(/@user/g, `@${jid.split('@')[0]}`) // Mention tetap pakai nomor
        .replace(/@nama/g, username) // Tambahan: Variabel @nama untuk nama tanpa mention
        .replace(/@group/g, groupName)
        .replace(/@desc/g, groupDesc)
        .replace(/@count/g, memberCount.toString())

      await sock.sendMessage(chatId, {
        image: { url: apiUrl },
        caption: caption,
        mentions: [jid] // Penting: mention harus array JID lengkap
      })

      await new Promise(resolve => setTimeout(resolve, 1000))
    }

  } catch (err) {
    console.error("[WELCOME ERROR]", err)
  }
}


