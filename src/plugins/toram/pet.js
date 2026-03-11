export const pet = (sock, chatId, msg) => {
  try {
    const sections = {
      personality: `
KLASIFIKASI SIFAT (PERSONALITY)
 1. Antusias     → ATK +30% (Fokus Fisik)
 2. Intelek      → MATK +30% (Fokus Sihir)
 3. Kokoh        → ATK & MATK +15%, Phys & Magic Res +15%
 4. Heroik       → Critical Damage +30
 5. Mantap²      → Critical Rate -100%, HIT +30
 6. Proaktif     → ASPD +1000, CSPD +500
 7. Lincah       → Motion Speed Up
 8. Adil         → AMPR x2
 9. Licik        → Aggro -30%
10. Setia        → Phys & Magic Res +30%, Aggro +400%
11. Kalem        → Max HP +30%
12. Penakut      → Range Attack Only, MP Regen
13. Lembut       → Can't Attack (Pasif), MP Regen
14. Nekat        → Agresif di Area Sempit`.trim(),

      baseStat: `
POTENSI STAT DASAR (BASE STAT CAP)
Format: [Tipe] STR | INT | VIT | AGI | DEX
 1. Awam         →  40 |  40 |  40 |  40 |  40
 2. Ahli Skill   →  50 |  50 |  50 |  50 |  50
 3. Serba Bisa   →  60 |  60 |  60 |  60 |  60
 4. Genius       →  80 |  80 |  80 |  80 |  80
 5. S.Fisik      → 120 |  10 |  40 |  80 |  50
 6. S.Sihir      →  10 | 120 |  40 |  60 |  70
 7. Penghindar   →  40 |  40 |  40 | 120 |  80
 8. Akurat       →  40 |  40 |  40 |  60 | 120
 9. Tahan Fisik  →  60 |  30 | 110 |  50 |  50
10. Tahan Sihir  →  30 |  70 |  80 |  50 |  70`.trim(),

      trainMatrix: `
MATRIKS EFISIENSI PELATIHAN
Format: [Sifat] STR | INT | VIT | AGI | DEX
Antusias  →  41 |  6 | 14 | 11 | 11
Intelek   →   6 | 41 | 14 |  9 | 25
Setia     →  11 | 11 | 41 |  6 | 11
Lincah    →  14 |  6 |  7 | 41 | 14
Penakut   →  11 | 11 |  7 |  9 | 41
Mantap    →  11 | 11 | 11 |  9 | 14
Kokoh     →  21 | 21 | 21 |  6 |  6
Adil      →  14 | 14 |  9 |  9 | 11
Kalem     →  11 |  9 | 14 | 11 | 11
Nekat     →  14 |  7 | 11 | 14 | 11
Proaktif  →  14 | 14 | 11 | 11 |  7
Heroik    →  11 | 11 | 11 | 14 |  9
Licik     →   6 | 14 |  6 | 21 | 14
Lembut    →   6 | 21 | 14 |  7 | 21`.trim(),

      buildRecommend: `
REKOMENDASI BUILD & MOB
▸ DPS (Damage Dealer)
  Mob: Mochelo (Magic), Mitta Tert (Fisik), Satwal (Hybrid)
  - 2H/1H    → Antusias (STR) | Skill: Raging Blow
  - Bow/BG   → Akurat/Antusias (DEX)
  - Knuckle  → Penghindar/Antusias (AGI)
  - Staff/MD → Intelek (INT > VIT) | Skill: Lembing Sihir
  ★ Skill Wajib: Serap HP (Absorb HP)

▸ TANK
  Mob: Rem Potum, Ram Potum, Semut Api, Propibi,
       Emungil, Kalong Angker, Pemancung Bandit Gurun,
       Potum Semedi, Lanbat, Kumbang Buntal
  - Semua Senjata → Tahan Fisik / Genius / Tahan Sihir / Setia
  - Magic Device  → Tahan Fisik / Setia
  ★ Pelatihan: Full VIT

▸ SUPPORT
  - Tipe Buff  → Tahan Fisik/Genius | Full VIT | Skill Arrow Up ↑
  - Tipe Heal  → MD/Staff | Lembut/Penakut/Genius | VIT & INT
  ℹ Arrow Up: Meningkatkan efek buff
  ℹ Double Hit: 2x hit per serangan (AMPR x2)`.trim(),

      skillExp: `
SISTEM EXP & LEVELING SKIL
Kebutuhan Kill (x2 tiap level naik):
  +1 →     300  |  +6 →   9.600
  +2 →     600  |  +7 →  19.200
  +3 →   1.200  |  +8 →  38.400
  +4 →   2.400  |  +9 →  76.800
  +5 →   4.800

★ Tips: Gacha skill di awal (target Lv5) → hemat waktu
★ Start Lv5 → butuh 9.300 kill total untuk Lv10
★ Lokasi: Kanal Bawah Tanah Sofya (Blue Jelly)
          atau Gunung Nisel (Shell Mask)`.trim(),

      petLeveling: `
SISTEM LEVEL KARAKTER PET
Bonus EXP:
  - Base   → Affinity x10% (Aff 100% = 1000% EXP)
  - Food   → Dikali Affinity (Buff 50% + Aff 100% = 1500%)
  - Gem    → Dari Base EXP Boss

Lokasi Leveling:
  Lv   1–40  → Masked Warrior (Normal)
  Lv  40–46  → Masked Warrior (Hard)
  Lv  46–72  → Masked Warrior (Nightmare)
  Lv  72–95  → Masked Warrior (Ultimate)
  Lv  95–102 → Cerberus (Nightmare)
  Lv 102–160 → Cerberus (Ultimate)
  Lv 160–Cap → Venena (Ultimate)`.trim(),

      fusion: `
SISTEM FUSION (PADU PET)
Level Maks   = (Lv A + Lv B) / 2 + 1
               Contoh: (150+170)/2+1 = 161

Power Baru   = Power A + Power B
  - Staff/MD  → 100% ATK, 100% MATK
  - Knuckle   → 100% ATK,  50% MATK
  - Bow/BG/1H/2H → 100% ATK, 0% MATK

Biaya Spina  = ((Lv A × Lv B) / 10) × (Fusion A + Fusion B)
               Contoh: Lv100×Lv10 / 10 × (10+100) = 11.000 Spina

Potensi Bonus = (Potensi A + Potensi B) / 10 (bulatkan bawah)`.trim(),

      food: `
MANAJEMEN MAKANAN (FOOD)
Jenis Makanan:
  Mini Pet Food     →   10s | Aff 10% | Sta  10 | -
  Normal Pet Food   →  100s | Aff 20% | Sta  60 | Bonus EXP 10–30%
  Stamina Pet Food  → 1000s | Aff 10% | Sta 100 | Rare Bonus 10–50%
  Delicious Food    → 1000s | Aff 40% | Sta  30 | Rare Bonus 10–50%
  High Grade Food   → 3000s | Aff 40% | Sta 100 | Rare Bonus 10–50%
  Top Quality Food  → 1–2 Orb | Aff 100% | Sta 100 | Bonus 50%

Jenis Buff: Exp (10/30/50%) | Sukses Latih (10/30/50%) | Sifat (10/30%)`.trim(),

      penalty: `
SISTEM PENALTI
Penalti Party (AMPR, ASPD, CSPD, DMG, MP Charge):
  1 Member → 0%   |  3 Member → -34%
  2 Member → -17% |  4 Member → -51%

Penalti Selisih Level (EXP):
  Beda  0–19 → 100%  |  Beda 39 → 70%
  Beda    29 →  90%  |  Beda 49 → 40%
  Beda   57+ →  10%`.trim(),

      taming: `
TEKNIK TAMING (MENANGKAP PET)
Alokasi SP Tamer:
  - Hemat SP : 10-0-0 | 10-10 | 0-0
  - Maksimal : 10-10-10 | 10-10 | 0-0

Strategi:
  1. Level karakter ≥ level mob
  2. Kurangi HP mob sampai kritis (< 20% disarankan)
  3. Semakin rendah HP → bar penangkapan makin cepat
  4. Jangan bunuh mob saat proses taming berjalan`.trim(),

      source: `
 REFERENSI & SUMBER DATA
  Basis Data : Toram Online Forum ID
  Sumber     : https://toram-id.com/forum/all-about-pet-on-tor-4f8ea981`.trim(),
    };

    const msgs = Object.values(sections).join("\n\n").trim();

    sock.sendMessage(chatId, { text: msgs }, { quoted: msg });
  } catch (err) {
    console.error("[pet] Error:", err);
  }
};
