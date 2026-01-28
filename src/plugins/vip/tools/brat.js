import Sticker from "wa-sticker-formatter";

export const brat = async (sock, chatId, msg, text) => {
  try {
    const cx = text.replace("!brat", "").trim();

    if (!cx) {
      return sock.sendMessage(
        chatId,
        { text: "mana teksnya?\ncontoh: !brat owner ganteng" },
        { quoted: msg }
      );
    }

    const lnk = `https://api.deline.web.id/maker/brat?text=${encodeURIComponent(cx)}`;

    const sticker = new Sticker(lnk, {
      pack: "Neura",
      author: "Neura Sama",
      type: "full",
      quality: 80
    });

    const buffer = await sticker.toBuffer();

    await sock.sendMessage(
      chatId,
      { sticker: buffer },
      { quoted: msg }
    );

  } catch (error) {
    console.error(error);
    await sock.sendMessage(
      chatId,
      { text: "terjadi error saat membuat sticker" },
      { quoted: msg }
    );
  }
};
