import axios from "axios";

export const spamAdv = async (sock, chatId, msg, text) => {
  try {
    const arg = text.split(" ");
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

    const data = await axios.get(
      `https://neuraapi.vercel.app/api/toram/spamadv?lv=${lv}&exp=${exp}&lvmx=${max}&from=${from}`,
    );
    console.log(data.data.result);
    if (!data.data.result || data.data.result.status !== 200) {
      return await sock.sendMessage(
        chatId,
        { text: "terjadi kesalahan saat mengambil data" },
        { quoted: msg },
      );
    }

    const result = data.data.result; // ✅ langsung data.data, bukan data.data.result

    if (!result) {
      return await sock.sendMessage(
        chatId,
        { text: "data tidak ditemukan" },
        { quoted: msg },
      );
    }

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
Start Level : ${result.data.startLevel} (${result.data.startPercent}%)
Target Level: ${result.data.targetLevel}
━━━━━━━━━━━━━━━━━━
Runs Needed : ${result.data.runs}x
Final Level : ${result.data.finalLevel} (${result.data.finalPercent}%)
Final EXP   : ${result.data.finalExp.toLocaleString()}
Reached     : ${result.data.reachedTarget ? "✅ Ya" : "❌ Belum"}
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
