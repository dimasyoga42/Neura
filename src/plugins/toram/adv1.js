import axios from "axios";

export const spamAdv = async (sock, chatId, msg, text) => {
  try {
    const arg = text.trim().split(/\s+/);

    const lv = arg[0];
    const exp = arg[1];
    const max = arg[2];
    const from = arg[3];

    if (!lv || !exp || !max || !from) {
      return await sock.sendMessage(
        chatId,
        {
          text: "masukan lv exp dan bab setelah .spamadv\nContoh: .spamadv 177 0 315 11",
        },
        { quoted: msg },
      );
    }

    const { data } = await axios.get(
      `https://neuraapi.vercel.app/api/toram/spamadv?lv=${lv}&exp=${exp}&lvmx=${max}&from=${from}`,
    );

    if (!data || !data.result || data.result.status !== 200) {
      return await sock.sendMessage(
        chatId,
        { text: "terjadi kesalahan saat mengambil data" },
        { quoted: msg },
      );
    }

    const result = data.result.data;

    if (!result) {
      return await sock.sendMessage(
        chatId,
        { text: "data tidak ditemukan" },
        { quoted: msg },
      );
    }

    const progressText =
      Array.isArray(result.progress) && result.progress.length > 0
        ? result.progress
            .map(
              (v) =>
                `${v.run}. Lv ${v.level} (${v.percent}%) — EXP: ${v.currentExp.toLocaleString()}`,
            )
            .join("\n")
        : "-";

    const responseText = `*SPAM ADV CALCULATOR*
━━━━━━━━━━━━━━━━━━
Start Level : ${result.startLevel} (${result.startPercent}%)
Target Level: ${result.targetLevel}
━━━━━━━━━━━━━━━━━━
Runs Needed : ${result.runs}x
Final Level : ${result.finalLevel} (${result.finalPercent}%)
Final EXP   : ${result.finalExp.toLocaleString()}
Reached     : ${result.reachedTarget ? "✅ Ya" : "❌ Belum"}
━━━━━━━━━━━━━━━━━━
*Progress Detail:*
${progressText}`;

    await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: `server error: ${err.message}` },
      { quoted: msg },
    );
  }
};
