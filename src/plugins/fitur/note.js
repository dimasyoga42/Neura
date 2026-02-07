import { supabase } from "../../model/supabase.js";

export const setNote = async (sock, chatId, msg, text) => {
  try {
    // contoh input:
    // !setnote ,judul note, isi note panjang bebas
    const args = text.replace(".setnote", "").split(",");

    const noteName = args[1]?.trim();
    const notemessage = args.slice(2).join(",").trim();

    if (!noteName || !notemessage) {
      return sock.sendMessage(
        chatId,
        {
          text: "mohon masukan judul note dan isi setelah !setnote\ncontoh:\n!setnote ,Judul Note, ini isi note"
        },
        { quoted: msg }
      );
    }

    const { error } = await supabase.from("note").insert({
      grubId: chatId,
      note_name: noteName,
      isi: notemessage
    });

    if (error) {
      return sock.sendMessage(
        chatId,
        { text: "terjadi kesalahan saat menyimpan note ke database" },
        { quoted: msg }
      );
    }

    sock.sendMessage(
      chatId,
      { text: "note berhasil di simpan" },
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

export const note = async (sock, chatId, msg, text) => {
  try {
    const noteName = text.replace(".note", "").trim();

    if (!noteName) {
      return sock.sendMessage(
        chatId,
        { text: "mana judul catatan yang di cari" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("note")
      .select("note_name, isi")
      .eq("grubId", chatId)
      .ilike("note_name", `%${noteName}%`)
      .limit(1);

    if (error) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil data note" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "note tidak ditemukan" },
        { quoted: msg }
      );
    }

    const note = data[0];

    const cxMessage = `
Judul Catatan: *${note.note_name}*

*Isi Catatan*:
${note.isi}
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
export const notelist = async (sock, chatId, msg) => {
  try {
    const { data, error } = await supabase
      .from("note")
      .select("note_name")
      .eq("grubId", chatId)
      .order("id", { ascending: true });

    if (error) {
      return sock.sendMessage(
        chatId,
        { text: "gagal mengambil daftar note" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "belum ada note yang tersimpan di grup ini" },
        { quoted: msg }
      );
    }

    let list = "*Daftar Judul Note:*\n";

    data.forEach((item, index) => {
      list += `${index + 1}. ${item.note_name}\n`;
    });

    sock.sendMessage(
      chatId,
      { text: list.trim() },
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
