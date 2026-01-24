import { supabase } from "../../model/supabase.js"
const formatStatList = (stat) => {
  if (!stat || stat === "None") return "- None";

  return stat
    .split("|")
    .map(s => `- ${s.trim()}`)
    .join("\n");
};


const parseStat = (stat) => {
  if (!stat) return "-";

  const result = [];
  const regex = /([a-zA-Z% ]+)\s*(-?\d+(?:\.\d+)?)/g;

  let match;
  while ((match = regex.exec(stat)) !== null) {
    const label = match[1].trim();
    const value = match[2];
    result.push(`${label} : ${value}`);
  }

  return result.length ? result.join("\n- ") : "-";
};


export const setxtall = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split('-').map(v => v.trim())

    const name = arg[1]
    const upgrade = arg[2]
    const type = arg[3]
    const stat = arg[4]
    const rute = arg[5]

    // Validasi input
    if (!name || !upgrade || !type || !stat || !rute) {
      return sock.sendMessage(
        chatId,
        {
          text: `Format salah!\nGunakan:\n!setxtall-nama-upgrade-type-stat-rute`
        },
        { quoted: msg }
      )
    }

    const { error } = await supabase
      .from('xtall')
      .insert({
        name: name,
        upgrade: upgrade,
        type: type,
        stat: stat,
        rute: rute
      })

    if (error) {
      return sock.sendMessage(
        chatId,
        {
          text: `Gagal menambahkan xtall:\n${error.message}`
        },
        { quoted: msg }
      )
    }

    sock.sendMessage(
      chatId,
      {
        text: `${name} berhasil ditambahkan`
      },
      { quoted: msg }
    )

  } catch (err) {
    sock.sendMessage(
      chatId,
      {
        text: `Terjadi error:\n${err.message}`
      },
      { quoted: msg }
    )
  }
}


export const searchXtall = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!xtall", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !xtall <name>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("xtall")
      .select("name, type, upgrade, stat, route")
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
        { text: "Xtall tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH XTALL (${data.length})*
${data.map((xtall, i) => `
${xtall.name}
Type    : ${xtall.type}
Upgrade : ${xtall.upgrade}
Stat    : 
- ${parseStat(xtall.stat)}
Rute: ${xtall.route}
`).join("━━━━━━━━━━━━━━━━━━━━\n")}
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

export const Xtall = async (sock, chatId, msg) => {
  try {
    const { data, error } = await supabase
      .from("xtall")
      .select("name");

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
        { text: "Data xtall masih kosong" },
        { quoted: msg }
      );
    }

    const messageData = `
*LIST XTALL (${data.length})*
${data
        .map((xtall, i) => `${i + 1}. ${xtall.name}`)
        .join("\n")}
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



export const searchRegist = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!regist", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !regist <nama regist>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("regist")
      .select("name, effect, max_lv, levels_studied")
      .ilike("name", `%${nama}%`);

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
        { text: "Regist tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH REGIST*
${data.map((rg, i) => `
${rg.name}
Effect         : ${rg.effect}
Max Level      : ${rg.max_lv}
Levels Studied : ${rg.levels_studied}
`).join("\n")}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan" },
      { quoted: msg }
    );
  }
};


export const ability = async (sock, chatId, msg) => {
  try {
    const { data, error } = await supabase
      .from("ability")
      .select("name")
      .order('name', { ascending: true });

    if (error) {
      console.error("Supabase Error:", error); // Log ke console server untuk debugging
      return sock.sendMessage(chatId, { text: "Gagal mengambil data dari database." }, { quoted: msg });
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(chatId, { text: "Belum ada data ability yang tersimpan." }, { quoted: msg });
    }

    const formattedList = data
      .map((item, i) => `${i + 1}. ${item.name}`)
      .join("\n");

    const txt = `*List Ability Toram*\nTotal: ${data.length} Data\n\n${formattedList}`;

    // Mengirim pesan
    await sock.sendMessage(chatId, { text: txt }, { quoted: msg });

  } catch (err) {
    console.error("System Error:", err);
    // Pesan error ke user sebaiknya generik, detail error cukup di console server
    await sock.sendMessage(chatId, { text: "Terjadi kesalahan pada sistem bot." }, { quoted: msg });
  }
}
export const searchAbility = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!ability", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !ability <nama ability>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("ability")
      .select("name, stat_effect, tier, stat_id")
      .ilike("name", `%${nama}%`);

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
        { text: "Ability tidak ditemukan" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH ABILITY*
${data.map((ab, i) => `
${ab.name}
Tier        : ${ab.tier}
Stat Effect : ${ab.stat_effect}
`).join("\n")}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan" },
      { quoted: msg }
    );
  }
};




export const searchItem = async (sock, chatId, msg, text) => {
  try {
    const namaItem = text.replace("!item", "").trim();

    if (!namaItem) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !item <nama item>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("item")
      .select("nama, jenis, stat, drop")
      .ilike("nama", `%${namaItem}%`);

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
        { text: "Item tidak ditemukan\ntips jika item yang dicari tidak ada gunakan nama versi bahasa inggrisnya" },
        { quoted: msg }
      );
    }

    const messageData = `
*SEARCH ITEM*
> By Neura Bot
${data.map((item, i) => `
  ${item.nama}
Jenis : ${item.jenis}
Stat  :
${formatStatList(item.stat)}
Drop  : ${item.drop}
`).join("\n")}
`.trim();

    sock.sendMessage(
      chatId,
      { text: messageData.trim() },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan" },
      { quoted: msg }
    );
  }
};


export const searchApp = async (sock, chatId, msg, text) => {
  try {
    const nama = text.replace("!appview", "").trim();

    if (!nama) {
      return sock.sendMessage(
        chatId,
        { text: "Gunakan: !appview <nama>" },
        { quoted: msg }
      );
    }

    const { data, error } = await supabase
      .from("appview")
      .select("name, image_url")
      .ilike("name", `${nama}%`)
      .limit(1);

    if (error) {
      console.log(error);
      return sock.sendMessage(
        chatId,
        { text: "Terjadi kesalahan saat mencari data" },
        { quoted: msg }
      );
    }

    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "App tidak ditemukan" },
        { quoted: msg }
      );
    }

    const app = data[0];

    const messageData = `
Nama App : ${app.name}
`.trim();

    await sock.sendMessage(
      chatId,
      {
        image: { url: app.image_url },
        caption: messageData
      },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Error internal" },
      { quoted: msg }
    );
  }
};

