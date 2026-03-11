import { supabase } from "../model/supabase.js";

export const setVip = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ");
    const idGrub = arg[1];
    const limit = arg[2];

    const exp = parseInt(limit);

    if (!idGrub || isNaN(exp)) {
      return sock.sendMessage(
        chatId,
        { text: "Format: .setvip idgroup hari" },
        { quoted: msg },
      );
    }

    const sekarang = new Date();
    const tanggal = new Date(sekarang.getTime() + exp * 24 * 60 * 60 * 1000);
    await supabase.from("vip-member").insert({
      idGrub: idGrub,
      exp: tanggal,
    });
    sock.sendMessage(
      chatId,
      {
        text: `VIP berhasil diset\nGroup: ${idGrub}\nExpired: ${tanggal}`,
      },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};

export const autoDeleteVip = async () => {
  const now = new Date().toISOString();
  await supabase.from("vip-member").delete().lt("exp", now);
};

export const cekVip = async (sock, chatId, msg) => {
  try {
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(
        chatId,
        { text: "Command ini hanya bisa dipakai di grup." },
        { quoted: msg },
      );
    }

    const { data, error } = await supabase
      .from("vip-member")
      .select("*")
      .eq("idGrub", chatId)
      .single();

    if (error || !data) {
      return sock.sendMessage(
        chatId,
        { text: "Grup ini bukan VIP." },
        { quoted: msg },
      );
    }

    const now = new Date();
    const exp = new Date(data.exp);

    if (now > exp) {
      await supabase.from("vip").delete().eq("idGrub", chatId);

      return sock.sendMessage(
        chatId,
        { text: "VIP grup ini sudah expired." },
        { quoted: msg },
      );
    }

    const expFormat = exp.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "short",
    });

    sock.sendMessage(
      chatId,
      {
        text: `Grup ini VIP\nExpired: ${expFormat}`,
      },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};

export const isVipGroup = async (chatId) => {
  const { data, error } = await supabase
    .from("vip-member")
    .select("exp")
    .eq("idGrub", chatId)
    .single();

  if (error || !data) {
    return false;
  }

  const now = new Date();
  const exp = new Date(data.exp);

  if (now > exp) {
    await supabase.from("vip-member").delete().eq("idGrub", chatId);

    return false;
  }

  return true;
};
export const cekIdGrub = async (sock, chatId, msg) => {
  try {
    if (!chatId.endsWith("@g.us")) {
      return sock.sendMessage(
        chatId,
        { text: "Command ini hanya bisa dipakai di grup." },
        { quoted: msg },
      );
    }

    const metadata = await sock.groupMetadata(chatId);

    const text = `INFO GRUP
Nama Grup : ${metadata.subject}
ID Grup   : ${chatId}
Member    : ${metadata.participants.length}
`.trim();

    sock.sendMessage(chatId, { text }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(chatId, { text: err.message }, { quoted: msg });
  }
};
