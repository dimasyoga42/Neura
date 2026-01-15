import { supabase } from "../../model/supabase.js";

export const skill = async (sock, chatId, msg, text) => {
  try {
    const input = text.replace("!skill", "").trim();

    // Validasi input kosong
    if (!input) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah.\nContoh penggunaan: !skill Assassin" },
        { quoted: msg }
      );
    }

    // Melakukan query ke Supabase
    // Perhatikan penggunaan tanda kutip ganda ("") untuk kolom dengan spasi
    const { data, error } = await supabase
      .from("skill")
      .select('"Skill Tree", "Nama Skill", Type, "MP Cost", Element, Range, Deskripsi_Indo')
      .ilike('"Skill Tree"', `%${input}%`);

    console.log(data);

    // Validasi jika error atau data tidak ditemukan
    if (error || !data || data.length === 0) {
      console.error(error); // Log error untuk debugging developer
      return sock.sendMessage(
        chatId,
        { text: "Skill tidak ditemukan atau terjadi kesalahan pada database." },
        { quoted: msg }
      );
    }

    // Membangun pesan balasan dengan format yang lebih rapi
    // Menggunakan data[0]["Skill Tree"] agar kapitalisasi sesuai dengan database, bukan input user
    const header = `*Skill Information By Neura Sama*\n*Skill Tree: ${data[0]["Skill Tree"]}*\n`;

    const body = data.map((item, i) => {
      return `
${i + 1}. *${item["Nama Skill"]}*
• Type: ${item.Type}
• MP Cost: ${item["MP Cost"]}
• Element: ${item.Element}
• Range: ${item.Range}
• Deskripsi: ${item.Deskripsi_Indo}`.trim();
    }).join("\n\n");

    const rgMessage = `${header}\n${body}`;

    await sock.sendMessage(chatId, { text: rgMessage }, { quoted: msg });

  } catch (err) {
    console.error(err);
    sock.sendMessage(chatId, { text: `[ERROR] Terjadi kesalahan sistem: ${err.message}` }, { quoted: msg });
  }
};




export const listSkill = async (sock, chatId, msg) => {
  try {
    // 1. Mengambil hanya kolom "Skill Tree" dari database
    const { data, error } = await supabase
      .from("skill")
      .select('"Skill Tree"');

    if (error) {
      console.error("Database Error:", error);
      return sock.sendMessage(
        chatId,
        { text: "Terjadi kesalahan saat mengambil data kategori skill." },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Data Skill Tree belum tersedia." },
        { quoted: msg }
      );
    }

    // 2. Eliminasi duplikasi menggunakan Set
    // Kita mengambil value dari object, memasukkannya ke Set (agar unik), lalu kembalikan ke Array
    const uniqueTrees = [...new Set(data.map((item) => item["Skill Tree"]))];

    // 3. Mengurutkan secara alfabetis (A-Z) agar terstruktur rapi
    uniqueTrees.sort();

    // 4. Membangun pesan balasan
    const listMessage = uniqueTrees
      .map((tree, index) => `${index + 1}. ${tree}`)
      .join("\n");

    const finalMessage = `*Daftar Kategori Skill Tree*\n\n${listMessage}\n\n_Gunakan perintah !skill [nama tree] untuk melihat detail._`;

    await sock.sendMessage(chatId, { text: finalMessage }, { quoted: msg });

  } catch (err) {
    console.error("System Error:", err);
    sock.sendMessage(
      chatId,
      { text: `[ERROR] Terjadi kesalahan sistem: ${err.message}` },
      { quoted: msg }
    );
  }
};

