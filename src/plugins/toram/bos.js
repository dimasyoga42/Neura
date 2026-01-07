import { readToramData } from "../../config/readToramData.js";

export const searchBosDef = async (sock, chatId, msg, text) => {
  try {
    const keyword = text.replace("!bosdef", "").trim().toLowerCase();

    if (!keyword) {
      return sock.sendMessage(
        chatId,
        { text: "Format salah\n> gunakan !bosdef <nama boss>" },
        { quoted: msg }
      );
    }

    const data = await readToramData();

    if (!data || !Array.isArray(data.bosdef)) {
      return sock.sendMessage(
        chatId,
        { text: "Database bosdef tidak tersedia" },
        { quoted: msg }
      );
    }

    // 🔍 SEARCH TANPA LIMIT
    const results = data.bosdef.filter(b =>
      b.name.toLowerCase().includes(keyword)
    );

    if (results.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "Boss tidak ditemukan" },
        { quoted: msg }
      );
    }

    let message = `
*SEARCH BOS DEF*
> By Neura Bot
`.trim();

    results.forEach((b, i) => {
      message += `

${i + 1}. ${b.name}
   Level   : ${b.level}
   Element : ${b.element}
   HP      : ${b.hp}
   EXP     : ${b.xp}

   DEF     : ${b.def}
   MDEF    : ${b.mdef}
   FLEE    : ${b.flee}
   Guard   : ${b.guard}
   Evade   : ${b.evade}

   Proration:
   - Normal : ${b.proration_normal}
   - Phys   : ${b.proration_phys}
   - Magic  : ${b.proration_magic}

   Resistance:
   - Physical : ${b.res_phys}
   - Magic    : ${b.res_magic}
   - Critical : ${b.res_crit}
`;
    });

    sock.sendMessage(
      chatId,
      { text: message.trim() },
      { quoted: msg }
    );

  } catch (err) {
    console.log(err);
    sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan saat mencari boss" },
      { quoted: msg }
    );
  }
};

