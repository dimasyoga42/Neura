
import { supabase } from "../../model/supabase.js";

export const eleMonster = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace(".elemonster", "").trim().toLowerCase();

    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "tolong masukan element setelah .elemonster" },
        { quoted: msg }
      );
    }
    const { data, error } = await supabase
      .from("monster")
      .select("name, element")
      .ilike("element", `%${name}%`)

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "terjadi kesalahan saat mengambil data" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "element yang anda cari tidak ada" },
        { quoted: msg }
      );
    }

    const seen = new Set();
    const filtered = data
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(item => {
        const key = item.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    const list = filtered
      .map((item, i) => `${i + 1}. ${item.name}`)
      .join("\n");

    let finalText = `Daftar Nama Bos & monster Berdasarkan Element (${name})\n\n${list}`;
    if (finalText.length > 4000) {
      const chunks = finalText.match(/[\s\S]{1,3900}/g);
      for (const part of chunks) {
        await sock.sendMessage(chatId, { text: part }, { quoted: msg });
      }
      return;
    }

    await sock.sendMessage(chatId, { text: finalText }, { quoted: msg });

  } catch (err) {
    console.log(err);
    await sock.sendMessage(
      chatId,
      { text: "error tidak diketahui" },
      { quoted: msg }
    );
  }
};


export const eleBos = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ")
    const name = arg[1]
    if (!name) return sock.sendMessage(chatId, { text: "tolong masukan element setelah !elebos" }, { quoted: msg });
    const { data, error } = await supabase.from("bosdef").select("name, element").ilike("element", `%${name}%`);
    if (data.length === 0 || error) return sock.sendMessage(chatId, { text: "element yang anda cari tidak ada" }, { quoted: msg });
    const msgTxt = data.map((item, i) => `${i + 1}. ${item.name}`
    ).join("\n")
    sock.sendMessage(chatId, { text: `Daftar Nama Bos Berdasarkan Element\n${msgTxt}`.trim() }, { quoted: msg })
  } catch (error) {
    console.log(error)
  }

}


