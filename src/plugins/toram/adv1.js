import axios from "axios";

export const spamAdv = async (sock, chatId, msg, text) => {
  try {
    const arg = text.replace(".spamadv", "").trim();

    if (!arg) {
      return await sock.sendMessage(
        chatId,
        {
          text: "masukan lv exp dan bab setelah .spamadv 177 23 315 bab 11",
        },
        { quoted: msg },
      );
    }

    const { data } = await axios.get(
      "https://kinda-apis.vercel.app/api/toram/spamadv",
      {
        params: {
          text: arg,
          lang: "",
          apikey: "",
        },
        timeout: 15000,
      },
    );

    if (!data || data.status !== 200 || !data.success) {
      return await sock.sendMessage(
        chatId,
        {
          text: "terjadi kesalahan saat mengambil data",
        },
        { quoted: msg },
      );
    }

    const result = data.data;

    if (!result) {
      return await sock.sendMessage(
        chatId,
        {
          text: "data tidak ditemukan",
        },
        { quoted: msg },
      );
    }

    const pathText =
      Array.isArray(result.path) && result.path.length > 0
        ? result.path.map((v, i) => `${i + 1}. ${v}`).join("\n")
        : "-";

    const responseText = `*TORAM SPAM ADV RESULT*

Last MQ: ${result.lastmq}
Target Level: ${result.targetLevel}
Diaries Needed: ${result.diariesNeeded}

Path:
${pathText}`;

    await sock.sendMessage(
      chatId,
      {
        text: responseText,
      },
      { quoted: msg },
    );
  } catch (err) {
    await sock.sendMessage(
      chatId,
      {
        text: "server error, coba lagi nanti",
      },
      { quoted: msg },
    );
  }
};
