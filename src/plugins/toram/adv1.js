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
          text: "Format salah. Masukan lv, exp, target level, dan bab setelah .spamadv\nContoh: .spamadv 177 0 315 11",
        },
        { quoted: msg },
      );
    }

    const response = await axios.get(
      `https://neuraapi.vercel.app/api/toram/spamadv?lv=${lv}&exp=${exp}&lvmx=${max}&from=${from}`,
    );

    // Berdasarkan JSON Anda, data berada di response.data.data
    const result = response.data?.data;
    console.log(result);

    if (!result) {
      return await sock.sendMessage(
        chatId,
        { text: "Gagal mendapatkan data: Format respons API tidak sesuai." },
        { quoted: msg },
      );
    }

    const progressText =
      Array.isArray(result.progress) && result.progress.length > 0
        ? result.progress
            .map(
              (v) =>
                `Run ${v.run}: Lv ${v.level} (${v.percent}%) — EXP: ${v.currentExp.toLocaleString()}`,
            )
            .join("\n")
        : "Tidak ada detail progres.";

    const responseText = `*SPAM ADV CALCULATOR*
━━━━━━━━━━━━━━━━━━
*Initial State:*
• Start Level : ${result.startLevel} (${result.startPercent}%)
• Target Level: ${result.targetLevel}

*Calculation Result:*
• Runs Needed : ${result.runs}x
• Final Level : ${result.finalLevel} (${result.finalPercent}%)
• Final EXP   : ${result.finalExp?.toLocaleString()}
• Reached     : ${result.reachedTarget ? "✅ Berhasil" : "❌ Belum Mencapai Target"}
━━━━━━━━━━━━━━━━━━
*Progress Detail:*
${progressText}`;

    await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
  } catch (err) {
    const errorMessage = err.response?.data?.message || err.message;
    await sock.sendMessage(
      chatId,
      { text: `Terjadi kesalahan sistem: ${errorMessage}` },
      { quoted: msg },
    );
  }
};
