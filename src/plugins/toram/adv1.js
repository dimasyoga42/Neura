import fetch from "node-fetch";

export const spamAdv = async (sock, chatId, msg, text) => {
  try {
    const arg = text.trim().split(/\s+/);
    const [, lv, exp, max, from] = arg;

    if (!lv || !exp || !max || !from) {
      return await sock.sendMessage(
        chatId,
        {
          text: "*Format salah!*\nGunakan: `.spamadv <lv> <exp> <target_lv> <bab>`\n*Contoh:* `.spamadv 177 0 315 11`",
        },
        { quoted: msg },
      );
    }

    // Validasi agar input harus berupa angka
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

    /**
     * Penyesuaian Hierarki Data Baru:
     * Objek utama -> result -> data (Array) -> indeks [0]
     */
    const result = jsonResponse.result?.data?.[0];

    if (!result) {
      return await sock.sendMessage(
        chatId,
        {
          text: "Gagal mendapatkan data: Format respons API tidak dikenali atau data kosong.",
        },
        { quoted: msg },
      );
    }

    const progressText =
      Array.isArray(result.progress) && result.progress.length > 0
        ? result.progress
            .map((v) => `${v.run}x: ${v.level} (${v.percent}%)`)
            .join("\n")
        : "Detail progres tidak tersedia.";

    const responseText = `*SPAM ADV CALCULATOR*
━━━━━━━━━━━━━━━━━━
*Initial State:*
- Start Level  : ${result.startLevel} (${result.startPercent}%)
- Target Level : ${result.targetLevel}

*Calculation Result:*
- Runs Needed  : ${result.runs}x
- Final Level  : ${result.finalLevel} (${result.finalPercent}%)
- Final EXP    : ${result.finalExp?.toLocaleString("id-ID")}
- Reached      : ${result.reachedTarget ? "Berhasil" : "Belum"}
━━━━━━━━━━━━━━━━━━
*Progress Detail:*
${progressText}

*Source:* ${jsonResponse.result.source || "Neura API"}`;

    await sock.sendMessage(chatId, { text: responseText }, { quoted: msg });
  } catch (err) {
    await sock.sendMessage(
      chatId,
      { text: `Terjadi kesalahan sistem: ${err.message}` },
      { quoted: msg },
    );
  }
};
