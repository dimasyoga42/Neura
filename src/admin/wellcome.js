import { supabase } from "../model/supabase.js";
import { createCanvas, loadImage } from "canvas";
import axios from "axios";
// Fungsi SetWelcome (Tidak berubah)
export const SetWelcome = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace(".setwc", "").trim();

    if (!arg)
      return sock.sendMessage(
        chatId,
        {
          text: `Format salah!\n\nCara penggunaan:\n.setwc Teks Welcome Kamu\ntag yang tersedia:\n@user : untuk tag member yang join\n@group : untuk mengambil nama grub\n@count : untuk menampilkan jumlah member\n@desc : untuk menampilkan deskripsi grub`,
        },
        { quoted: msg },
      );

    const { error } = await supabase
      .from("wellcome")
      .upsert({ id_grub: chatId, message: arg }, { onConflict: "id_grub" });

    if (error) throw new Error(error.message);

    await sock.sendMessage(
      chatId,
      {
        text: "✅ Welcome message berhasil disimpan!",
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("[SETWELCOME]", err);
    await sock.sendMessage(
      chatId,
      {
        text: "Gagal menyimpan data.",
      },
      { quoted: msg },
    );
  }
};

const getDisplayName = async (sock, jid, groupId) => {
  try {
    let displayName = jid.split("@")[0]; // Default: nomor HP

    try {
      const groupMetadata = await sock.groupMetadata(groupId);
      const participant = groupMetadata.participants.find((p) => p.id === jid);

      if (participant) {
        if (participant.notify) {
          return participant.notify;
        }
      }
    } catch (e) {
      console.log("Gagal ambil dari group metadata:", e.message);
    }

    try {
      const [contactInfo] = await sock.onWhatsApp(jid);
      if (contactInfo && contactInfo.notify) {
        return contactInfo.notify;
      }
    } catch (e) {
      console.log("Gagal ambil dari onWhatsApp:", e.message);
    }

    try {
      const businessProfile = await sock.getBusinessProfile(jid);
      if (businessProfile && businessProfile.description) {
      }
    } catch (e) {}

    try {
      const contacts = await sock.fetchStatus(jid);
      if (contacts && contacts.status) {
      }
    } catch (e) {}

    return displayName;
  } catch (err) {
    console.error("Error getDisplayName:", err);
    return jid.split("@")[0];
  }
};
// ============= HANDLER WELCOME =============
// ============= HANDLER WELCOME =============
export const HandleWelcome = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update;
    if (action !== "add") return;

    const groupMetadata = await sock.groupMetadata(chatId);
    const groupName = groupMetadata.subject;
    const memberCount = groupMetadata.participants.length;
    const groupDesc = groupMetadata.desc?.toString() || "Tidak ada deskripsi";

    // 1. Ambil Welcome Message dari Database
    const { data, error } = await supabase
      .from("wellcome")
      .select("message")
      .eq("id_grub", chatId)
      .maybeSingle();

    // Loop untuk Setiap Member Baru
    for (const participant of participants) {
      const jid =
        typeof participant === "string" ? participant : participant.id;

      // === DAPATKAN NAMA PENGGUNA ===
      let username = await getDisplayName(sock, jid, chatId);
      const phoneNumber = jid.split("@")[0];

      // === DAPATKAN FOTO PROFIL ===
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(jid, "image");
      } catch {
        ppUrl = "https://telegra.ph/file/24fa902ead26340f3df2c.png";
      }

      // 4. Generate Welcome Image via API
      // DISESUAIKAN:
      // phone = Nomor HP (kiri bawah)
      // name = Nama User (kanan bawah)
      // group = Nama Grup (tengah)
      // image = Foto Profil
      const apiUrl = `https://neuraapi.vercel.app/api/etc/wellcome?phone=${phoneNumber}&name=${encodeURIComponent(username)}&group=${encodeURIComponent(groupName)}&image=${ppUrl}`;

      const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
      const imageBuffer = Buffer.from(response.data, "binary");

      // 5. Format Caption
      const rawText = data?.message || "@user Selamat datang di @group";
      const caption = rawText
        .replace(/@user/g, `@${phoneNumber}`)
        .replace(/@nama/g, username)
        .replace(/@group/g, groupName)
        .replace(/@desc/g, groupDesc)
        .replace(/@count/g, memberCount.toString());

      // 6. Kirim Welcome Message
      await sock.sendMessage(chatId, {
        image: imageBuffer,
        caption: caption,
        mentions: [jid],
      });

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (err) {
    console.error("[WELCOME ERROR]", err);
  }
};
export const outGC = async (sock, update) => {
  try {
    const { id: chatId, participants, action } = update;
    if (action !== "remove") return;

    const groupMetadata = await sock.groupMetadata(chatId);
    if (!groupMetadata) return;

    const groupName = groupMetadata.subject || "Group";
    const memberCount = groupMetadata.participants?.length || 0;
    const groupDesc = groupMetadata.desc?.toString() || "Tidak ada deskripsi";

    for (const participant of participants) {
      const jid =
        typeof participant === "string" ? participant : participant.id;
      if (!jid) continue;

      let username = await getDisplayName(sock, jid, chatId);

      // fallback jika nama = nomor
      if (username === jid.split("@")[0]) {
        const participantObj = groupMetadata.participants?.find(
          (p) => p.id === jid,
        );
        if (participantObj?.notify) {
          username = participantObj.notify;
        }
      }

      const number = jid.split("@")[0];

      const message = `
Selamat tinggal @${number}
`.trim();

      await sock.sendMessage(chatId, {
        text: message,
        mentions: [jid],
      });
    }
  } catch (err) {
    console.log("outGC error:", err);
  }
};
