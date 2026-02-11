import { supabase } from "../model/supabase.js"
import { createCanvas, loadImage } from "canvas"
import axios from "axios"
// Fungsi SetWelcome (Tidak berubah)
export const SetWelcome = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace(".setwc", "").trim()

    if (!arg) return sock.sendMessage(
      chatId,
      { text: `Format salah!\n\nCara penggunaan:\n.setwc Teks Welcome Kamu\ntag yang tersedia:\n@user : untuk tag member yang join\n@group : untuk mengambil nama grub\n@count : untuk menampilkan jumlah member\n@desc : untuk menampilkan deskripsi grub` },
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

const getDisplayName = async (sock, jid, groupId) => {
  try {
    let displayName = jid.split('@')[0]; // Default: nomor HP

    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const participant = groupMetadata.participants.find(p => p.id === jid);

      if (participant) {
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

    return displayName;

  } catch (err) {
    console.error('Error getDisplayName:', err);
    return jid.split('@')[0];
  }
}

export const generateWelcomeImage = async (ppUrl, groupName, memberCount) => {
  const WIDTH = 1024
  const HEIGHT = 450
  const canvas = createCanvas(WIDTH, HEIGHT)
  const ctx = canvas.getContext("2d")

  /* ================= BACKGROUND ================= */
  ctx.fillStyle = "#2d2d2d"
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const bgGradient = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT)
  bgGradient.addColorStop(0, "#4a4a4a")
  bgGradient.addColorStop(0.5, "#2d2d2d")
  bgGradient.addColorStop(1, "#1a1a1a")
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  const centerOverlay = ctx.createRadialGradient(WIDTH / 2, HEIGHT / 2, 0, WIDTH / 2, HEIGHT / 2, WIDTH / 2)
  centerOverlay.addColorStop(0, "rgba(0,0,0,0.3)")
  centerOverlay.addColorStop(1, "rgba(0,0,0,0.8)")
  ctx.fillStyle = centerOverlay
  ctx.fillRect(0, 0, WIDTH, HEIGHT)

  /* ================= AVATAR ================= */
  let avatar
  try {
    const res = await axios.get(ppUrl, { responseType: "arraybuffer" })
    avatar = await loadImage(res.data)
  } catch {
    // Default avatar jika gagal load
    avatar = await loadImage("https://telegra.ph/file/24fa902ead26340f3df2c.png")
  }

  const AVATAR_X = WIDTH / 2
  const AVATAR_Y = 145
  const AVATAR_RADIUS = 85

  ctx.save()

  // Border biru
  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS + 8, 0, Math.PI * 2)
  ctx.fillStyle = "#5bb5f0"
  ctx.fill()
  ctx.closePath()

  // Border putih
  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS + 4, 0, Math.PI * 2)
  ctx.fillStyle = "#ffffff"
  ctx.fill()
  ctx.closePath()

  // Clip untuk avatar
  ctx.beginPath()
  ctx.arc(AVATAR_X, AVATAR_Y, AVATAR_RADIUS, 0, Math.PI * 2)
  ctx.closePath()
  ctx.clip()

  ctx.drawImage(
    avatar,
    AVATAR_X - AVATAR_RADIUS,
    AVATAR_Y - AVATAR_RADIUS,
    AVATAR_RADIUS * 2,
    AVATAR_RADIUS * 2
  )
  ctx.restore()

  /* ================= TEXT ================= */
  ctx.textAlign = "center"
  ctx.fillStyle = "#ffffff"
  ctx.font = "bold 52px Sans-serif"
  ctx.shadowColor = "rgba(0,0,0,0.8)"
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4

  // Nama grup
  ctx.fillText(groupName, WIDTH / 2, 295)

  // Welcome text
  ctx.font = "32px Sans-serif"
  ctx.shadowBlur = 12
  ctx.fillText("Selamat datang di grup, semoga betah", WIDTH / 2, 355)

  // Member count
  ctx.font = "24px Sans-serif"
  ctx.shadowBlur = 10
  ctx.fillStyle = "#d1d5db"
  ctx.fillText(`Member ke ${memberCount}`, WIDTH / 2, 395)

  // Reset shadow
  ctx.shadowColor = "transparent"
  ctx.shadowBlur = 0

  return canvas.toBuffer()
}

// ============= HANDLER WELCOME =============
export const HandleWelcome = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update

    // Hanya proses saat ada member baru
    if (action !== 'add') return

    // 1. Ambil Welcome Message dari Database
    const { data, error } = await supabase
      .from("wellcome")
      .select("message")
      .eq("id_grub", chatId)
      .maybeSingle()

    if (error || !data || !data.message) {
      console.log("[WELCOME] Tidak ada pesan welcome untuk grup ini")
      const groupName = groupMetadata.subject
      const welcomedef = `
      Selamat datang di ${groupName}\n\n>guunakan .setwc untuk menambahkan wellcome message
      `.trim();
      await sock.sendMessage(chatId, {
        text: welcomedef,
      })

      return
    }

    const welcomeText = data.message

    // 2. Ambil Group Metadata
    const groupMetadata = await sock.groupMetadata(chatId)
    const groupName = groupMetadata.subject
    const memberCount = groupMetadata.participants.length
    const groupDesc = groupMetadata.desc?.toString() || "Tidak ada deskripsi"

    // 3. Loop untuk Setiap Member Baru
    for (const participant of participants) {
      const jid = typeof participant === 'string' ? participant : participant.id

      // === DAPATKAN NAMA ===
      let username = await getDisplayName(sock, jid, chatId)

      // Fallback: coba ambil dari participant metadata
      if (username === jid.split('@')[0]) {
        const participantObj = groupMetadata.participants.find(p => p.id === jid)
        if (participantObj && participantObj.notify) {
          username = participantObj.notify
        }
      }

      console.log(`[WELCOME] User: ${username} (${jid})`)

      // === DAPATKAN FOTO PROFIL ===
      let ppUrl
      try {
        ppUrl = await sock.profilePictureUrl(jid, 'image')
      } catch {
        ppUrl = 'https://telegra.ph/file/24fa902ead26340f3df2c.png'
      }

      // 4. Generate Welcome Image
      const imageBuffer = await generateWelcomeImage(ppUrl, groupName, memberCount)

      // 5. Format Caption dengan Replacements
      const caption = welcomeText
        .replace(/@user/g, `@${jid.split('@')[0]}`)
        .replace(/@nama/g, username)
        .replace(/@group/g, groupName)
        .replace(/@desc/g, groupDesc)
        .replace(/@count/g, memberCount.toString())

      // 6. Kirim Welcome Message
      await sock.sendMessage(chatId, {
        image: imageBuffer,
        caption: caption,
        mentions: [jid]
      })

      // Delay untuk menghindari spam
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  } catch (err) {
    console.error("[WELCOME ERROR]", err)
  }
}

export const outGC = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update
    if (action !== "remove") return;

    const user = participants
    const message = `selamat tinggal ${user.split("@")[0]}`.trim()

    sock.sendMessage(id, { text: message })

  } catch (err) {
    console.log(err.message)
  }
}
