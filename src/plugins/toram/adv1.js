import axios from "axios";

export const spamAdv = async (sock, chatId, msg, text) => {
  try {
    const arg = text.trim().split(/\s+/);

    const lv = arg[1];
    const exp = arg[2];
    const max = arg[3];
    const from = arg[4];

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

    if (!data) {
      return await sock.sendMessage(
        chatId,
        { text: "terjadi kesalahan saat mengambil data" },
        { quoted: msg },
      );
    }

    const result = data.data.result;

    const progressText =
      Array.isArray(result.data.progress) && result.data.progress.length > 0
        ? result.data.progress
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
Final EXP   : ${result.finalExp}
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
