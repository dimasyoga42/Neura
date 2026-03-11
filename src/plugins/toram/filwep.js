import axios from "axios";

export const filwep = async (sock, chatId, msg, text) => {
  try {
    const args = text.replace(/^\.filwep\s*/i, "").trim();

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
    const { data } = await axios.get(url, { timeout: 15000 });

    if (!data?.ok || !data?.hasValidResult) {
      return sock.sendMessage(
        chatId,
        { text: "Formula tidak ditemukan atau input tidak valid." },
        { quoted: msg },
      );
    }

    const steps = (data.steps ?? []).map((v) => `• ${v}`).join("\n");

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
      .map(([k, v]) => `${k.toUpperCase()} : ${v}`)
      .join("\n");

    const result = `*Toram Statting Result*
\`\`\`
Success Rate : ${data.successRate ?? "-"}
Start Pot    : ${data.startingPot ?? "-"}
Positive Stats
${positiveStats}
Negative Stats
${negativeStats}
Steps (${data.totalSteps ?? 0})
${steps}
Material Cost
${material}
Reduction : ${data.materialDetails?.reduction ?? "-"}
Max Cost  : ${data.highestStepCost ?? "-"}
Character
Lv Char : ${data.inputConfig?.characterLevel ?? "-"}
Lv BS   : ${data.inputConfig?.professionLevel ?? "-"}
Pot     : ${data.inputConfig?.startingPotential ?? "-"}
Process : ${data.duration ?? "-"} ms
\`\`\``;

    await sock.sendMessage(chatId, { text: result }, { quoted: msg });
  } catch (err) {
    const isTimeout =
      err.code === "ECONNABORTED" || err.message?.includes("timeout");
    const errMsg = isTimeout
      ? "Request timeout. Coba lagi beberapa saat."
      : "Terjadi error saat mengambil data stat.";
    await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
  }
};
