import axios from "axios";

export const filwep = async (sock, chatId, msg, text) => {
  try {
    const args = text.replace(/^\.filwep\s*/i, "").trim();

    if (!args) {
      return sock.sendMessage(
        chatId,
        {
          text: `*Format salah!*\n\nContoh:\n*.filwep atk%=max,cr=max,def%=min,lv300,pot120,bs300*`,
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

    // Steps — API sudah sertakan nomor, jadi langsung join saja
    const steps = data.steps.join("\n");

    // Positive stats
    const positiveStats =
      data.inputConfig.positiveStats.length > 0
        ? data.inputConfig.positiveStats
            .map((v) => `• ${v.name} (${v.level})`)
            .join("\n")
        : "-";

    // Negative stats
    const negativeStats =
      data.inputConfig.negativeStats.length > 0
        ? data.inputConfig.negativeStats
            .map((v) => `• ${v.name} (${v.level})`)
            .join("\n")
        : "-";

    // Material cost (exclude 'reduction' key)
    const material = Object.entries(data.materialDetails)
      .filter(([k]) => k !== "reduction")
      .map(([k, v]) => `${k.toUpperCase().padEnd(8)}: ${v}`)
      .join("\n");

    const result = `
 *Success Rate* : ${data.successRate}
 *Starting Pot* : ${data.startingPot}

*Positive Stats*
${positiveStats}

*Negative Stats*
${negativeStats}

*Steps (${data.totalSteps})*
${steps}

*Material Cost*
${material}
Reduction         : ${data.materialDetails.reduction}
Highest Step Cost : ${data.highestStepCost}

*Character Config*
Character Lv : ${data.inputConfig.characterLevel}
BS Lv        : ${data.inputConfig.professionLevel}
Start Pot    : ${data.inputConfig.startingPotential}

Process Time : ${data.duration} ms
`.trim();

    await sock.sendMessage(chatId, { text: result }, { quoted: msg });
  } catch (err) {
    const isTimeout =
      err.code === "ECONNABORTED" || err.message?.includes("timeout");
    const errMsg = isTimeout
      ? " Request timeout. Coba lagi beberapa saat."
      : " Terjadi error saat mengambil data stat.";

    await sock.sendMessage(chatId, { text: errMsg }, { quoted: msg });
  }
};
