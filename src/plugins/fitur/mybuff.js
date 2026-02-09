import { supabase } from "../../model/supabase.js";

export const mybuff = async (sock, chatId, msg) => {
  try {
    const user =
      msg?.key?.participant ||
      msg?.key?.remoteJid;

    const { data, error } = await supabase
      .from("mybuff")
      .select("stat")
      .eq("name", user);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil data buff" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "kamu belum memiliki buff" },
        { quoted: msg }
      );
    }

    const list = data
      .map((item, i) => `${item.stat}`)
      .join("\n\n");

    let finalText = `Buff kamu\n\n${list}`;

    if (finalText.length > 4000) {
      const chunks = finalText.match(/[\s\S]{1,3900}/g);
      for (const part of chunks) {
        await sock.sendMessage(chatId, { text: part }, { quoted: msg });
      }
      return;
    }

    await sock.sendMessage(
      chatId,
      { text: finalText },
      { quoted: msg }
    );

  } catch (error) {
    console.log(error);
    await sock.sendMessage(
      chatId,
      { text: "error tidak diketahui" },
      { quoted: msg }
    );
  }
};



export const setMybuff = async (sock, chatId, msg, text) => {
  try {
    const arg = text.trim().split(" ");
    const name = arg[1];

    const user =
      msg?.key?.participant ||
      msg?.key?.remoteJid;

    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "mana nama buff nya" },
        { quoted: msg }
      );
    }

    // ================= AMBIL DATA BUFF =================
    const { data: buffData, error: buffError } = await supabase
      .from("buff")
      .select("name, code")
      .ilike("name", `%${name}%`)
      .single();

    if (buffError || !buffData) {
      return sock.sendMessage(
        chatId,
        { text: "buff tidak ditemukan" },
        { quoted: msg }
      );
    }

    const msgTxt = `${buffData.name}\n${buffData.code}`;

    // ================= CEK APAKAH BUFF INI SUDAH ADA =================
    const { data: duplicate } = await supabase
      .from("mybuff")
      .select("id")
      .eq("name", user)
      .eq("stat", msgTxt)
      .maybeSingle();

    if (duplicate) {
      return sock.sendMessage(
        chatId,
        { text: "buff ini sudah kamu pakai" },
        { quoted: msg }
      );
    }

    // ================= INSERT (APPEND, TIDAK OVERWRITE) =================
    const { error: insertError } = await supabase
      .from("mybuff")
      .insert({
        name: user,
        stat: msgTxt
      });

    if (insertError) {
      console.log(insertError);
      return sock.sendMessage(
        chatId,
        { text: "gagal menyimpan buff" },
        { quoted: msg }
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "buff berhasil ditambahkan" },
      { quoted: msg }
    );

  } catch (error) {
    console.log(error);
    await sock.sendMessage(
      chatId,
      { text: "error tidak diketahui" },
      { quoted: msg }
    );
  }
};
