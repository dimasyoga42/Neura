import fetch from "node-fetch";

export const filwep = async (sock, chatId, msg, text) => {
  try {
    const args = text.replace(".filwep", "").trim();

    if (!args) {
      return sock.sendMessage(
        chatId,
        {
          text: `Format salah!

Contoh:
.filwep elefire=max,dteearth%=max,atk%=max,cd=20,def%=min,hpreg%=min,hpreg=min,lv290,pot=121,bs265`,
        },
        { quoted: msg },
      );
    }

    const url = `https://neurapi.mochinime.cyou/api/toram/filwep?text=${encodeURIComponent(
      args,
    )}`;

    const res = await fetch(url);
    const data = await res.json();
    console.log(data);

    if (!data.ok || !data.hasValidResult) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Formula tidak ditemukan." },
        { quoted: msg },
      );
    }

    let message = `*TORAM FILL WEAPON*\n\n`;

    message += `*Success Rate:* ${data.successRate}\n`;
    message += `*Starting Pot:* ${data.startingPot}\n`;
    message += `*Total Steps:* ${data.totalSteps}\n\n`;

    message += `*Steps:*\n`;
    data.steps.forEach((step) => {
      message += `${step}\n`;
    });

    message += `\n*Material Cost*\n`;
    message += `${data.materialCost}\n`;

    message += `\n*Detail Material*\n`;
    message += `Metal: ${data.materialDetails.metal}\n`;
    message += `Beast: ${data.materialDetails.beast}\n`;
    message += `Mana: ${data.materialDetails.mana}\n`;
    message += `Reduction: ${data.materialDetails.reduction}\n`;

    message += `\n*Highest Step Cost:* ${data.highestStepCost}\n`;

    message += `\n*Character Info*\n`;
    message += `Level: ${data.inputConfig.characterLevel}\n`;
    message += `Profession: ${data.inputConfig.professionLevel}\n`;
    message += `Recipe Pot: ${data.inputConfig.recipePotential}\n`;

    await sock.sendMessage(chatId, { text: message }, { quoted: msg });
  } catch (error) {
    await sock.sendMessage(
      chatId,
      { text: "❌ Terjadi error saat mengambil data." },
      { quoted: msg },
    );
  }
};
