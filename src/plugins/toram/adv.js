import { mq_data } from "../fitur/expData.js"

export const floor = Math.floor
export const ceil = Math.ceil

export const getXP = (lv) =>
  floor(0.025 * lv ** 4 + 2 * lv)

export const getTotalXP = (begin, beginPercentage, end) => {
  let xp = floor((1 - beginPercentage / 100) * getXP(begin))
  for (let i = begin + 1; i < end; i++) {
    xp += getXP(i)
  }
  return xp
}

export const addXP = (begin, beginPercentage, extraXP) => {
  let remainingXP = extraXP
  let needXP = (1 - beginPercentage / 100) * getXP(begin)

  if (extraXP < needXP) {
    let currentXP =
      beginPercentage / 100 * getXP(begin) + extraXP
    return [begin, floor(100 * currentXP / getXP(begin))]
  }

  remainingXP -= needXP
  let lv = begin + 1

  while (getXP(lv) <= remainingXP) {
    remainingXP -= getXP(lv)
    lv++
  }

  let lvP = floor(100 * remainingXP / getXP(lv))
  return [lv, lvP]
}




export default async function spamAdvCommand(sock, msg, args) {
  if (args.length < 5) {
    return sock.sendMessage(msg.key.remoteJid, {
      text:
        "📘 FORMAT:\n" +
        "!spamadv <level> <percent> <targetLv> <babMulai> <babAkhir>"
    }, { quoted: msg })
  }

  let lv = Number(args[0])
  let lvP = Number(args[1])
  const targetLv = Number(args[2])
  const babMulai = Number(args[3])
  const babAkhir = Number(args[4])

  if (babMulai > babAkhir) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Bab mulai tidak boleh lebih besar dari bab akhir"
    }, { quoted: msg })
  }

  const keys = Object.keys(mq_data)

  // Total XP target
  const targetXP = getTotalXP(lv, lvP, targetLv)

  // XP satu kali run MQ
  let mqXP = 0
  for (let i = babMulai; i <= babAkhir; i++) {
    mqXP += Number(mq_data[keys[i]]) || 0
  }

  if (mqXP <= 0) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: "❌ Total EXP MQ bernilai 0"
    }, { quoted: msg })
  }

  const runs = floor(targetXP / mqXP)
  if (runs > 100) {
    return sock.sendMessage(msg.key.remoteJid, {
      text: `❌ Terlalu banyak run (${runs}), perbesar rentang BAB`
    }, { quoted: msg })
  }

  let output = `📘 *SPAM ADVENTURE (MQ)*\n\n`
  output += `Bab: ${keys[babMulai]} → ${keys[babAkhir]}\n`
  output += `Target: Lv ${targetLv}\n\n`

  // Simulasi tiap run
  for (let i = 1; i <= runs; i++) {
    ;[lv, lvP] = addXP(lv, lvP, mqXP)
    output += `${i}. Lv ${lv} (${lvP}%)\n`
  }

  // Sisa XP (run terakhir tidak full)
  if (lv < targetLv) {
    let curXP = 0
    let stackedXP = 0

    for (let i = babMulai; i <= babAkhir; i++) {
      const xp = Number(mq_data[keys[i]]) || 0
      curXP += xp
      stackedXP += xp

      if (curXP >= targetXP) {
        ;[lv, lvP] = addXP(lv, lvP, stackedXP)
        output += `${runs + 1}. Stop di "${keys[i]}" → Lv ${lv} (${lvP}%)\n`
        break
      }
    }
  }

  await sock.sendMessage(msg.key.remoteJid, {
    text: output.trim()
  }, { quoted: msg })
}
