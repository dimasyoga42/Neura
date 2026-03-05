export const dyePredictor = async (sock, chatId, msg, text) => {
  try {
    await sock.sendMessage(
      chatId,
      {
        image: {
          url: "https://raw.githubusercontent.com/dimasyoga42/dataset/main/dye_weapon.png",
        },
        caption: `Dye Weapon Prediction`,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error(err);
    sock.sendMessage(chatId, { text: err }, { quoted: msg });
  }
};
