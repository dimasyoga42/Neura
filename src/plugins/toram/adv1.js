import fetch from "node-fetch";

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

    // Eksekusi permintaan HTTP
    const response = await fetch(
      `https://neuraapi.vercel.app/api/toram/spamadv?lv=${lv}&exp=${exp}&lvmx=${max}&from=${from}`,
    );

    // Node-fetch memerlukan tahap parsing JSON secara eksplisit
    const jsonResponse = await response.json();

    // Berdasarkan struktur JSON Anda: { "status": 200, "success": true, "data": { ... } }
    const result = jsonResponse.data;

    if (!result) {
      return await sock.sendMessage(
        chatId,
        {
          text: "Gagal mendapatkan data: Respons API tidak mengandung data yang valid.",
        },
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
    // Penanganan kesalahan pada node-fetch sedikit berbeda karena tidak memiliki err.response otomatis seperti Axios
    await sock.sendMessage(
      chatId,
      { text: `Terjadi kesalahan sistem: ${err.message}` },
      { quoted: msg },
    );
  }
};
