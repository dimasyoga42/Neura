import { supabase } from "../../model/supabase.js"

const parseStat = (stat) => {
  if (!stat) return "-";

  const parts = stat.split(",").map(s => s.trim());
  const result = [];

  for (let i = 0; i < parts.length - 1; i++) {
    // label harus ada huruf
    if (/[a-zA-Z%]/.test(parts[i])) {
      // value harus angka (boleh minus)
      if (/^-?\d+(\.\d+)?$/.test(parts[i + 1])) {
        result.push(`${parts[i]} : ${parts[i + 1]}`);
        i++; // lompat ke pasangan berikutnya
      }
    }
  }

  return result.length ? result.join("\n- ") : "-";
};
export const searchMonster = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!monster", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !monster name" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("monster")
      .select("name, level, hp, element, map, drops")
      .ilike("name", `%${nama}%`); // ❌ hapus limit(1)

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Internal server error" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "monster tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH MONSTER (${data.length})*
${data.map((m, i) => `
${m.name}
Level: ${m.level}
MaxHP: ${m.hp}
element: ${m.element}
Map: ${m.map}
Drops: 
- ${parseStat(m.drops)}

`).join("")}
`.trim();

    await sock.sendMessage(
      chatId,
      { text: messageData },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan" },
      { quoted: msg }
    );
  }
};

