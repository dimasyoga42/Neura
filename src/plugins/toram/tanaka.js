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

    if (!data?.ok) {
      return sock.sendMessage(
        chatId,
        { text: "Gagal mengambil data." },
        { quoted: msg },
      );
    }

    const steps = data.steps.map((v, i) => `${i + 1}. ${v}`).join("\n");

    const material = data.materialDetails;

    const result = `
*TORAM STAT FORMULA*

*Success Rate:* ${data.successRate}
*Starting Potential:* ${data.startingPot}

*Steps (${data.totalSteps})*
${steps}

*Material Cost*
Metal : ${material.metal}
Beast : ${material.beast}
Mana  : ${material.mana}

Reduction : ${material.reduction}

Highest Step Cost : ${data.highestStepCost}

*Input Config*
Character Lv : ${data.inputConfig.characterLevel}
BS Lv        : ${data.inputConfig.professionLevel}
Starting Pot : ${data.inputConfig.startingPotential}
`.trim();

    await sock.sendMessage(chatId, { text: result }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: "Terjadi error saat mengambil formula." },
      { quoted: msg },
    );
  }
};
