import fs from "fs"

/* =========================
   LOAD DATA MQ
========================= */
const MQ_DATA = JSON.parse(
  fs.readFileSync("./../dbs/data_mq_clean.json", "utf-8")
)

/* =========================
   RUMUS EXP (BISA DIGANTI)
========================= */
function expToNextLevel(lv) {
  return Math.floor(lv * lv * 10000)
}

/* =========================
   HITUNG TOTAL QUEST XP
========================= */
function getQuestXP(chStart, chEnd) {
  return MQ_DATA
    .filter(q => q.chapter >= chStart && q.chapter <= chEnd)
    .reduce((a, b) => a + b.exp, 0)
}

/* =========================
   SPMADV SIMULATOR
========================= */
function spmadvSimulator({
  level,
  percent,
  chapterStart,
  chapterEnd,
  targetLevel
}) {
  let expNow = Math.floor(expToNextLevel(level) * (percent / 100))
  const questXp = getQuestXP(chapterStart, chapterEnd)

  let run = 0
  let progress = []

  while (level < targetLevel) {
    run++
    expNow += questXp

    while (expNow >= expToNextLevel(level)) {
      expNow -= expToNextLevel(level)
      level++

      if (level >= targetLevel) {
        expNow = 0
        break
      }
    }

    const percentNow =
      level >= targetLevel
        ? 0
        : Math.floor((expNow / expToNextLevel(level)) * 100)

    progress.push(`${run}x → Lv ${level} (${percentNow}%)`)
  }

  return {
    run,
    questXp,
    progress
  }
}

/* =========================
   COMMAND HANDLER
========================= */
export const spamadv = async (sock, chatId, text) => {
  try {
    // FORMAT:
    // !spamadv level percent chapterAwal chapterAkhir targetLevel
    // contoh:
    // !spamadv 175 20 6 6 185

    const args = text.trim().split(/\s+/)

    if (args.length < 6) {
      return sock.sendMessage(chatId, {
        text:
          `Format salah
Contoh:
!spamadv 175 20 6 6 185

Keterangan:
level awal
persen exp
chapter awal
chapter akhir
target level`
      })
    }

    const level = parseInt(args[1])
    const percent = parseInt(args[2])
    const chapterStart = parseInt(args[3])
    const chapterEnd = parseInt(args[4])
    const targetLevel = parseInt(args[5])

    if (
      isNaN(level) ||
      isNaN(percent) ||
      isNaN(chapterStart) ||
      isNaN(chapterEnd) ||
      isNaN(targetLevel)
    ) {
      return sock.sendMessage(chatId, {
        text: "Input harus berupa angka"
      })
    }

    const sim = spmadvSimulator({
      level,
      percent,
      chapterStart,
      chapterEnd,
      targetLevel
    })

    const result =
      `SPMADV SIMULATOR

Level Awal : ${level} (${percent}%)
Chapter    : ${chapterStart} - ${chapterEnd}
Quest XP   : ${sim.questXp.toLocaleString()}
Target Lv  : ${targetLevel}
Butuh Run  : ${sim.run}x

Progress:
${sim.progress.join("\n")}`

    await sock.sendMessage(chatId, { text: result })

  } catch (err) {
    console.error(err)
    await sock.sendMessage(chatId, {
      text: "Terjadi kesalahan pada SPMADV simulator"
    })
  }
}
