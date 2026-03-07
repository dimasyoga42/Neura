import { Resapi } from "../../../setting.js";

export const newkhodam = async (sock, chatId, msg) => {
  try {
    const response = await fetch(`${Resapi.neura}/etc/khodam`);

    const res = await response.json();

    if (res.result && res.result.data && res.result.data.length > 0) {
      const item = res.result.data[0];

      const txt =
        `khodam kamu adalah ${item.khodam} karena ${item.alasan}`.trim();

      await sock.sendMessage(chatId, { text: txt }, { quoted: msg });
    } else {
      throw new Error("Format data API tidak valid atau data kosong.");
    }
  } catch (err) {
    console.error("Error pada fungsi newkhodam:", err);
    await sock.sendMessage(
      chatId,
      { text: `Terjadi kesalahan: ${err.message}` },
      { quoted: msg },
    );
  }
};
