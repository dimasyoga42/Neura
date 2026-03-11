import axios from "axios";

export const filarm = async (sock, chatId, msg, text) => {
  try {
    const args = text.replace(".filarm", "").trim();

    if (!args) {
      return sock.sendMessage(
        chatId,
        {
          text: `Format salah!

Contoh:
.filarm atk%=max,cr=max,def%=min,lv300,pot120,bs300`,
        },
        { quoted: msg },
      );
    }

    const url = `https://neurapi.mochinime.cyou/api/toram/filarm?text=${encodeURIComponent(args)}`;

    const { data } = await axios.get(url);

    if (!data?.ok || !data?.hasValidResult) {
      return sock.sendMessage(
        chatId,
        { text: "Formula tidak ditemukan." },
        { quoted: msg },
      );
    }

    const steps = data.steps.map((s, i) => `${i + 1}. ${s}`).join("\n");

    const positiveStats = data.inputConfig.positiveStats
      .map((v) => `${v.name} (${v.level})`)
      .join("\n");

    const negativeStats =
      data.inputConfig.negativeStats.length > 0
        ? data.inputConfig.negativeStats
            .map((v) => `${v.name} (${v.level})`)
            .join("\n")
        : "-";

    const material = Object.entries(data.materialDetails)
      .filter(([k]) => k !== "reduction")
      .map(([k, v]) => `${k.toUpperCase()} : ${v}`)
      .join("\n");

    const result = `
*TORAM STAT FORMULA*

*Success Rate:* ${data.successRate}
*Starting Potential:* ${data.startingPot}

*Positive Stats*
${positiveStats}

*Negative Stats*
${negativeStats}

*Steps (${data.totalSteps})*
${steps}

*Material Cost*
${material}

Reduction : ${data.materialDetails.reduction}

Highest Step Cost : ${data.highestStepCost}

*Character Config*
Character Lv : ${data.inputConfig.characterLevel}
BS Lv        : ${data.inputConfig.professionLevel}
Start Pot    : ${data.inputConfig.startingPotential}

Process Time : ${data.duration} ms
`.trim();

    await sock.sendMessage(chatId, { text: result }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: "Terjadi error saat mengambil data stat." },
      { quoted: msg },
    );
  }
};
