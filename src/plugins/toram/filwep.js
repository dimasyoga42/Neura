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

    const url = `https://neurapi.mochinime.cyou/api/toram/filwep?text=${encodeURIComponent(args)}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data || data.status === false) {
      return sock.sendMessage(
        chatId,
        {
          text: "Data tidak ditemukan.",
        },
        { quoted: msg },
      );
    }

    let result = `*Toram Fill Weapon*\n\n`;

    if (data.ok) {
      result += `Success Rate: ${data.successRate}\n`;
      result += `Starting Pot: ${data.startingPot}\n\n`;
    }

    if (Array.isArray(data.steps)) {
      result += `*Steps:*\n`;
      data.steps.forEach((step, i) => {
        result += `${i + 1}. ${step}\n`;
      });
    }

    await sock.sendMessage(
      chatId,
      {
        text: result,
      },
      { quoted: msg },
    );
  } catch (err) {
    await sock.sendMessage(
      chatId,
      {
        text: "Terjadi error saat mengambil data.",
      },
      { quoted: msg },
    );
  }
};
