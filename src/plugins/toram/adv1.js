import fetch from "node-fetch";

export const spamAdv = async (sock, chatId, msg, text) => {
  try {
    const arg = text.trim().split(/\s+/);
    const [, lv, exp, max, from] = arg;

    if (!lv || !exp || !max || !from) {
      return await sock.sendMessage(
        chatId,
        {
          text: "*Format salah!*\n\nGunakan: `.spamadv <lv> <exp> <target_lv> <bab>`\n*Contoh:* `.spamadv 177 0 315 11`",
        },
        { quoted: msg },
      );
    }

    if ([lv, exp, max, from].some((v) => isNaN(Number(v)))) {
      return await sock.sendMessage(
        chatId,
        { text: "Semua parameter harus berupa angka." },
        { quoted: msg },
      );
    }

    const response = await fetch(
      `https://neuraapi.vercel.app/api/toram/spamadv?lv=${lv}&exp=${exp}&lvmx=${max}&from=${from}`,
    );

    if (!response.ok) {
      return await sock.sendMessage(
        chatId,
        { text: `API error: ${response.status} ${response.statusText}` },
        { quoted: msg },
      );
    }

    const jsonResponse = await response.json();

    // Struktur: { status, success, data: { ... } }
    const result = jsonResponse.data;
    console.log(result);
    if (!result || !jsonResponse?.success) {
      return await sock.sendMessage(
        chatId,
        { text: "Gagal mendapatkan data dari API." },
        { quoted: msg },
      );
    }

    const progressText =
      Array.isArray(result.progress) && result.progress.length > 0
        ? result.progress
            .map(
              (v) =>
                `Run ${v.run}: Lv ${v.level} (${v.percent}%) — EXP: ${v.currentExp?.toLocaleString("id-ID")}`,
            )
            .join("\n")
        : "Tidak ada detail progres.";

    const responseText = `*SPAM ADV CALCULATOR*
━━━━━━━━━━━━━━━━━━
*Initial State:*
- Start Level  : ${result.startLevel} (${result.startPercent}%)
- Target Level : ${result.targetLevel}

*Calculation Result:*
- Runs Needed  : ${result.runs}x
- Final Level  : ${result.finalLevel} (${result.finalPercent}%)
- Final EXP    : ${result.finalExp?.toLocaleString("id-ID")}
- Reached      : ${result.reachedTarget ? "Berhasil mencapai target!" : "Belum mencapai target"}
━━━━━━━━━━━━━━━━━━
*Progress Detail:*
${progressText}`;

    await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: `⚠️ Terjadi kesalahan sistem: ${err.message}` },
      { quoted: msg },
    );
  }
};
