import { supabase } from "../../model/supabase.js";

export const setperpus = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split("|");
    const judul = arg[1]?.trim();
    const isi = arg[2]?.trim();
    if (!judul || !isi) return sock.sendMessage(chatId, { text: "Format: !setperpus|Judul|Isi" }, { quoted: msg });
    const { error } = await supabase.from("perpus").insert({ judulPerpus: judul, isiBuku: isi });
    if (error) throw error;
    sock.sendMessage(chatId, { text: "Buku ditambahkan" }, { quoted: msg });
  } catch (error) {
    sock.sendMessage(chatId, { text: error.message }, { quoted: msg });
    throw error;
  }
};

export const listperpus = async (sock, chatId, msg) => {
  try {
    const { data, error } = await supabase.from("perpus").select("id,judulPerpus").order("id", { ascending: true });
    if (error) throw error;
    if (!data || data.length === 0) return sock.sendMessage(chatId, { text: "Perpustakaan kosong" }, { quoted: msg });
    let teks = "Daftar Buku\n> gunakan .baca nama buku\n";
    data.forEach((item, i) => { teks += `${i + 1}. ${item.judulPerpus} (${item.id})\n`; });
    sock.sendMessage(chatId, { text: teks.trim() }, { quoted: msg });
  } catch (error) {
    sock.sendMessage(chatId, { text: error.message }, { quoted: msg });
    throw error;
  }
};

export const editperpus = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split("|");
    const id = arg[1]?.trim();
    const judul = arg[2]?.trim();
    const isi = arg[3]?.trim();
    if (!id || !judul || !isi) return sock.sendMessage(chatId, { text: "Format: .editperpus|ID|Judul|Isi" }, { quoted: msg });
    const { error } = await supabase.from("perpus").update({ judulPerpus: judul, isiBuku: isi }).eq("id", id);
    if (error) throw error;
    sock.sendMessage(chatId, { text: "Buku diperbarui" }, { quoted: msg });
  } catch (error) {
    sock.sendMessage(chatId, { text: error.message }, { quoted: msg });
    throw error;
  }
};

export const hapusperpus = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split("|");
    const id = arg[1]?.trim();
    if (!id) return sock.sendMessage(chatId, { text: "Format: .hapusperpus|ID" }, { quoted: msg });
    const { error } = await supabase.from("perpus").delete().eq("id", id);
    if (error) throw error;
    sock.sendMessage(chatId, { text: "Buku dihapus" }, { quoted: msg });
  } catch (error) {
    sock.sendMessage(chatId, { text: error.message }, { quoted: msg });
    throw error;
  }
};

export const bacaBuku = async (sock, chatId, msg, text) => {
  try {
    const noteName = text.replace(".baca", "").trim();

    if (!noteName) {
      return sock.sendMessage(
        chatId,
        { text: "mana judul catatan yang di cari" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("perpus")
      .select("judulPerpus, isiBuku")
      .ilike("judulPerpus", `%${noteName}%`)
      .limit(1);

    if (error) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil data Buku" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Buku tidak ditemukan" },
        { quoted: msg }
      );
    }

    const note = data[0];

    const cxMessage = `
Judul: *${note.judulPerpus}*

${note.isiBuku}\n> gunakan .baca nama buku
`.trim();

    sock.sendMessage(
      chatId,
      { text: cxMessage },
      { quoted: msg }
    );

  } catch (error) {
    sock.sendMessage(
      chatId,
      { text: String(error) },
      { quoted: msg }
    );
  }
};
