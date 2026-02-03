// SPMADV SIMULATOR - FIXED FORMULA
// Formula referensi dari https://toramtools.github.io/xp.html
// EXP required = (level^4 / 40) + (level * 2)

export async function spmadv(sock, chatId, msg, text) {
  try {
    const MAX_LEVEL = 315
    const args = text.replace(".spmadv", "").trim()
    if (!args) {
      return sock.sendMessage(chatId, {
        text: "Format:\n!spmadv <levelAwal> <persenXP> <targetLevel> <chapterAwal> - <chapterAkhir>\n\nContoh:\n.spmadv 175 20 180 6 - 6"
      })
    }

    const match = args.match(/(\d+)\s+(\d+)\s+(\d+)\s+(\d+)\s*-\s*(\d+)/)
    if (!match) {
      return sock.sendMessage(chatId, {
        text: "Format:\n!spmadv <levelAwal> <persenXP> <targetLevel> <chapterAwal> - <chapterAkhir>\n\nContoh:\n!spmadv 175 20 180 6 - 6"
      })
    }

    let level = parseInt(match[1])
    let percent = parseInt(match[2])
    let targetLevel = parseInt(match[3])
    const chapterFrom = parseInt(match[4])
    const chapterTo = parseInt(match[5])

    if (level >= MAX_LEVEL) {
      return sock.sendMessage(chatId, { text: `Level awal sudah mencapai max level (${MAX_LEVEL})` })
    }

    if (targetLevel > MAX_LEVEL) targetLevel = MAX_LEVEL
    if (percent < 0 || percent >= 100) {
      return sock.sendMessage(chatId, { text: "Persen XP harus 0 - 99" })
    }

    if (targetLevel <= level) {
      return sock.sendMessage(chatId, { text: "Target level harus lebih tinggi dari level awal!" })
    }

    const needXP = (lvl) => {
      if (lvl >= MAX_LEVEL) return Infinity
      return Math.floor((Math.pow(lvl, 4) / 40) + (lvl * 2))
    }

    const MQ = [
      { "title": "First Time Visit", "boss": "-", "chapter": 1, "episode": 1, "exp": 30 },
      { "title": "Straye Brother and Sister", "boss": "Boss Colon", "chapter": 1, "episode": 2, "exp": 80 },
      { "title": "A Golem on a Rampage", "boss": "Excavated Golem", "chapter": 1, "episode": 3, "exp": 730 },
      { "title": "The Goddess of Wisdom", "boss": "-", "chapter": 1, "episode": 4, "exp": 2050 },
      { "title": "The Dragon's Den", "boss": "Eerie Crystal", "chapter": 1, "episode": 5, "exp": 4700 },
      { "title": "The Ruined Temple", "boss": "-", "chapter": 1, "episode": 6, "exp": 9330 },
      { "title": "The First Magic Stone", "boss": "Minotaur", "chapter": 1, "episode": 7, "exp": 16700 },
      { "title": "Purification Incense", "boss": "-", "chapter": 1, "episode": 8, "exp": 27900 },
      { "title": "The Dragon and Black Crystal", "boss": "Brutal Dragon Decel", "chapter": 1, "episode": 9, "exp": 43000 },
      { "title": "The Merchant Girl", "boss": "Mochelo", "chapter": 2, "episode": 10, "exp": 64000 },
      { "title": "Where Are the Gems?", "boss": "Flare Volg", "chapter": 2, "episode": 11, "exp": 92000 },
      { "title": "Who is the Black Knight?!", "boss": "Ooze", "chapter": 2, "episode": 12, "exp": 118200 },
      { "title": "Trials in the Palace", "boss": "-", "chapter": 2, "episode": 13, "exp": 149000 },
      { "title": "The Moon Wizard", "boss": "Mauez", "chapter": 2, "episode": 14, "exp": 172000 },
      { "title": "The Follower and Hater", "boss": "Ganglef", "chapter": 2, "episode": 15, "exp": 227000 },
      { "title": "The Wizard's Cave", "boss": "-", "chapter": 2, "episode": 16, "exp": 240000 },
      { "title": "The Star Wizard", "boss": "Boss Roga", "chapter": 2, "episode": 17, "exp": 255000 },
      { "title": "The Invincible... Enemy??", "boss": "-", "chapter": 3, "episode": 18, "exp": 270000 },
      { "title": "The Ancient Empress", "boss": "Ancient Empress", "chapter": 3, "episode": 19, "exp": 284000 },
      { "title": "The Culprit", "boss": "Masked Warrior", "chapter": 3, "episode": 20, "exp": 319000 },
      { "title": "Fate of the Fortress", "boss": "-", "chapter": 3, "episode": 21, "exp": 335000 },
      { "title": "Memory in the Lost Town", "boss": "Pillar Golem", "chapter": 3, "episode": 22, "exp": 398000 },
      { "title": "The Stolen Sorcery Gem", "boss": "-", "chapter": 3, "episode": 23, "exp": 417000 },
      { "title": "Living with a Dragon", "boss": "Grass Dragon Yelb", "chapter": 3, "episode": 24, "exp": 462300 },
      { "title": "Monsters from Outerworld", "boss": "Nurethoth", "chapter": 3, "episode": 25, "exp": 540000 },
      { "title": "Unda's Rescue Operartion", "boss": "Gula the Gourmet", "chapter": 15, "episode": 122, "exp": 222200000 }
    ]

    const questXP = MQ
      .filter(q => q.chapter >= chapterFrom && q.chapter <= chapterTo)
      .reduce((a, b) => a + b.exp, 0)

    if (questXP === 0) {
      return sock.sendMessage(chatId, { text: "Chapter tidak valid atau tidak ada quest di range tersebut!" })
    }

    let currentXP = Math.floor((percent / 100) * needXP(level))
    let runs = 0
    let progress = []

    const startLevel = level
    const startPercent = percent

    while (runs < 1000 && level < targetLevel) {
      runs++
      currentXP += questXP

      while (level < targetLevel && currentXP >= needXP(level)) {
        currentXP -= needXP(level)
        level++
      }

      const pct = Math.floor((currentXP / needXP(level)) * 100)
      progress.push(`${runs}x - Lv ${level} (${pct}%)`)
    }

    const finalPercent = Math.floor((currentXP / needXP(level)) * 100)

    const result = `
*Spam Adv By Neura Sama*
Level Awal  : ${startLevel} (${startPercent}%)
Target Level: ${targetLevel}
Chapter     : ${chapterFrom} - ${chapterTo}
Quest XP    : ${questXP.toLocaleString()} exp
Final Level : ${level} (${finalPercent}%)
Butuh Run   : ${runs}x

Progress:
${progress.join('\n')}

Referensi: Toram Tools
`.trim()

    await sock.sendMessage(chatId, { text: result })
  } catch (err) {
    console.error(err)
    sock.sendMessage(chatId, { text: "Terjadi kesalahan pada SPMADV simulator!" })
  }
}
