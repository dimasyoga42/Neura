import axios from "axios";

export const filwep = async (sock, chatId, msg, text) => {
  try {
    const args = text.replace(".filwep", "").trim();

    if (!args || !args.includes("=")) {
      return sock.sendMessage(
        chatId,
        {
          text: `*Format salah!*\nContoh:\n.filwep atk%=max,cr=max,def%=min,lv300,pot120,bs300`,
        },
        { quoted: msg },
      );
    }

    const url = `https://neurapi.mochinime.cyou/api/toram/filwep?text=${encodeURIComponent(args)}`;
    const raw = await axios.get(url, { timeout: 15000 });

    if (raw.status !== 200) {
      return sock.sendMessage(
        chatId,
        { text: `API error: ${raw.status}` },
        { quoted: msg },
      );
    }

    const data = typeof raw.data === "string" ? JSON.parse(raw.data) : raw.data;

    // if (!data.hasValidResult) {
    //   return sock.sendMessage(
    //     chatId,
    //     { text: "Formula tidak ditemukan atau input tidak valid." },
    //     { quoted: msg },
    //   );
    // }

    const sanitize = (str) =>
      str.replace(/（/g, "(").replace(/）/g, ")").replace(/：/g, ":");

    const steps = (data.steps ?? []).map((v) => `• ${sanitize(v)}`).join("\n");

    const positiveStats =
      (data.inputConfig?.positiveStats ?? []).length > 0
        ? data.inputConfig.positiveStats
            .map((v) => `• ${v.name} (${v.level})`)
            .join("\n")
        : "-";

    const negativeStats =
      (data.inputConfig?.negativeStats ?? []).length > 0
        ? data.inputConfig.negativeStats
            .map((v) => `• ${v.name} (${v.level})`)
            .join("\n")
        : "-";

    const material = Object.entries(data.materialDetails ?? {})
      .filter(([k]) => k !== "reduction")
      .map(
        ([k, v]) =>
          `• ${(k.charAt(0).toUpperCase() + k.slice(1)).padEnd(6)} : ${v}`,
      )
      .join("\n");

    const compassion = data.inputConfig?.compassion
      ? Object.entries(data.inputConfig.compassion)
          .map(
            ([k, v]) =>
              `• ${(k.charAt(0).toUpperCase() + k.slice(1)).padEnd(9)} : ${v}`,
          )
          .join("\n")
      : "-";

    const result = `*Toram Statting Result*
\`\`\`
Success Rate : ${data.successRate ?? "-"}
Start Pot    : ${data.startingPot ?? "-"}

[ Positive Stats ]
${positiveStats}

[ Negative Stats ]
${negativeStats}

[ Steps (${data.totalSteps ?? 0}) ]
${steps}

[ Material Cost ]
${material}
- Reduction   : ${data.materialDetails?.reduction ?? "-"}
- Max Cost    : ${data.highestStepCost ?? "-"}

[ Character ]
- Lv Char     : ${data.inputConfig?.characterLevel ?? "-"}
- Lv BS       : ${data.inputConfig?.professionLevel ?? "-"}
- Pot         : ${data.inputConfig?.startingPotential ?? "-"}
- Recipe Pot  : ${data.inputConfig?.recipePotential ?? "-"}

[ Compassion ]
${compassion}

Process : ${data.duration ?? "-"} ms
\`\`\``;

    const sendMsg = async (text) =>
      sock.sendMessage(chatId, { text }, { quoted: msg });

    if (result.length > 4000) {
      const chunks = [];
      let current = "";
      for (const line of result.split("\n")) {
        if ((current + "\n" + line).length > 4000) {
          chunks.push(current);
          current = line;
        } else {
          current += (current ? "\n" : "") + line;
        }
      }
      if (current) chunks.push(current);
      for (const chunk of chunks) await sendMsg(chunk);
    } else {
      await sendMsg(result);
    }
  } catch (err) {
    const isTimeout =
      err.code === "ECONNABORTED" || err.message?.includes("timeout");
    const errMsg = isTimeout
      ? "Request timeout. Coba lagi beberapa saat."
      : "Terjadi error saat mengambil data stat.";
    await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
  }
};
