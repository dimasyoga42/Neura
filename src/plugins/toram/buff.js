// ================= BUFF MESSAGE =================
export const buffMessage = `
Code buff
> by Neura Bot
> use !report <nama buff, code buff> untuk menambahkan code buff mu kedalam bot

*MAX HP*
- 2020096
- 1010032
- 1010084
- 1010356
- 1250015
- 2010228
- 3090618
- 3092003
- 3191130
- 3260178
- 54154629
- 6010062
- 6199999

*MAX MP*
- 1010216
- 1011212
- 1020808
- 1027777
- 2010510
- 2020101
- 3017676
- 3204544
- 4261111
- 6053838
- 7100720
- 7150029
- 6060008
- 5111000

*AMPR*
- 1010017
- 1010596
- 1011010
- 1023040
- 1047777
- 1111000
- 3020777
- 3201003
- 4040404
- 4206969
- 4233333
- 5236969
- 7069420
- 7088807
- 7220777
- 8120000
- 4040088
- 1016969

ATK
- 1119876
- 7170717

MATK
- 1024649
- 1021684 Lv 9

STR
- 1010055
- 1010968
- 1011069
- 1110033
- 2017890
- 2020303
- 2180000
- 4010024
- 5261919
- 7070777
- 2202202
- 1026234

DEX
- 2020222
- 1010058
- 5010031
- 4084545
- 5010092
- 1010106
- 7011001
- 3111999
- 3220777
- 7012899

INT
- 2020707
- 6061294
- 1010489
- 6010701
- 1032222
- 1010140
- 1010498
- 1047777
- 7012899

AGI
- 1220777
- 2020037
- 4262222
- 2010750

VIT
- 5130123 Lv 9
- 2020909 Lv 9
- 4032850

CRITICAL RATE
- 1069927
- 1012000
- 1010433
- 3020108
- 6065000
- 7162029
- 6022292
- 1200069
- 1010006
- 1010092
- 1010017
- 1010050
- 1011010
- 1100000

ACCURACY
- 4261111
- 1010013 Lv 9
- 7010077 Lv 9
- 3188000 Lv 8

WEAPON ATK
- 1010810
- 1011122
- 1180020
- 2020404
- 1010029
- 1010099
- 6010024
- 1011126
- 2010136
- 7050301
- 3081024

-AGGRO
- 1010147
- 1016646
- 6010009
- 3010018
- 1010038
- 1010002

+AGGRO
- 6262000
- 1010207
- 3204544
- 3158668
- 1264321
- 2020606
- 3053131
- 1010297
- 1140002
- 3030110
- 7171717

PHYSICAL RESIST
- 3010034
- 7010014
- 6011415 Lv 9
- 4200069 Lv 9
- 6010701 Lv 9
- 1018989 Lv 9
- 3011999 Lv 9
- 1020001
- 1010081
- 1100000

MAGICAL RESIST
- 1111575
- 2020505
- 5200052
- 1010004
- 7010016
- 7030023
- 1100002 Lv 9
- 4080087 Lv 9
- 7227777 Lv 9

FRACTIONAL BARRIER
- 1222002 Lv 8
- 6181999 Lv 8
- 6010062 Lv 8
- 7010082 Lv 10

DROP RATE
- 1010084 Lv 6
- 4196969 Lv 6

━━━━━━━━━━━━━━━━━━━━
`.trim();


// ================= SEARCH FUNCTION =================
export const searchBuff = (keyword) => {
  if (!keyword) return null;

  const key = keyword.toUpperCase();
  const lines = buffMessage.split('\n');

  let currentCategory = null;
  const buffData = {};

  for (const line of lines) {
    const t = line.trim();

    if (
      !t ||
      t.startsWith('Code buff') ||
      t.startsWith('>') ||
      t.startsWith('━')
    ) continue;

    // kategori
    if (
      t.startsWith('*') ||
      (/^[A-Z+\s]+$/.test(t) && !t.startsWith('-'))
    ) {
      currentCategory = t.replace(/\*/g, '').trim();
      buffData[currentCategory] ??= [];
      continue;
    }

    // code
    if (t.startsWith('-') && currentCategory) {
      buffData[currentCategory].push(t.slice(1).trim());
    }
  }

  const results = [];

  for (const [cat, codes] of Object.entries(buffData)) {
    if (cat.includes(key)) {
      results.push({ category: cat, codes });
      continue;
    }

    const matched = codes.filter(c => c.toUpperCase().includes(key));
    if (matched.length) {
      results.push({ category: cat, codes: matched });
    }
  }

  return results.length ? results : null;
};


// ================= WHATSAPP COMMAND =================
export const buff = async (sock, chatId, msg, text) => {
  try {
    const keyword = text.replace(/!buff/i, '').trim();

    if (!keyword) {
      return sock.sendMessage(
        String(chatId),
        { text: `${buffMessage}\n\nBy Neura Sama` },
        msg ? { quoted: msg } : {}
      );
    }

    const results = searchBuff(keyword);

    if (!results) {
      return sock.sendMessage(
        String(chatId),
        {
          text: `Buff "${keyword}" tidak ditemukan.\n\nGunakan !buff untuk melihat semua daftar buff.\n\nBy Neura Sama`
        },
        msg ? { quoted: msg } : {}
      );
    }

    let res = `*TORAM BUFF — ${keyword.toUpperCase()}*\n\n`;

    for (const r of results) {
      res += `*${r.category}*\n`;
      r.codes.forEach(c => res += `- ${c}\n`);
      res += `\n`;
    }

    res += `By Neura Sama`;

    await sock.sendMessage(
      String(chatId),
      { text: res },
      msg ? { quoted: msg } : {}
    );

  } catch (e) {
    console.error(e);
    await sock.sendMessage(
      String(chatId),
      { text: `Error mencari buff\n${e.message}` },
      msg ? { quoted: msg } : {}
    );
  }
};
