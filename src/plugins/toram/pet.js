import { petGuide } from "../../config/variabel.js";

export const pet = (sock, chatId, msg, text) => {
  try {
    const msgs = `

      KLASIFIKASI SIFAT (PERSONALITY) & BONUS STATISTIK
      1. Antusias: ATK +30% (Fokus Fisik)
      2. Intelek: MATK +30% (Fokus Sihir)
      3. Kokoh: ATK & MATK +15%, Physical & Magic Resistance +15%
      4. Heroik: Critical Damage +30
      5. Mantap²: Critical Rate -100%, HIT +30
      6. Proaktif: ASPD +1000, CSPD +500
      7. Lincah: Motion Speed Up (Kecepatan Gerak)
      8. Adil: AMPR x2 (Attack MP Recovery)
      9. Licik: Aggro -30% (Low Aggro)
      10. Setia: Physical & Magic Resistance +30%, Aggro +400% (High Aggro)
      11. Kalem: Max HP +30%
      12. Penakut: Range Attack Only (Hanya Serang Jauh), MP Regen
      13. Lembut: Can't Attack (Pasif), MP Regen
      14. Nekat: Bergerak Di Area Kecil (Agresif Area Sempit)

      POTENSI PERTUMBUHAN STATISTIK DASAR (BASE STAT CAP)
      Format: [Tipe] STR, INT, VIT, AGI, DEX
      1. Awam: 40, 40, 40, 40, 40
      2. Ahli Skill: 50, 50, 50, 50, 50
      3. Serba Bisa: 60, 60, 60, 60, 60
      4. Genius: 80, 80, 80, 80, 80
      5. S.Fisik: 120, 10, 40, 80, 50
      6. S.Sihir: 10, 120, 40, 60, 70
      7. Penghindar: 40, 40, 40, 120, 80
      8. Akurat: 40, 40, 40, 60, 120
      9. Tahan Fisik: 60, 30, 110, 50, 50
      10. Tahan Sihir: 30, 70, 80, 50, 70

      MATRIKS EFISIENSI PELATIHAN (TRAIN STAMINA)
      (Poin status yang didapat per sesi latihan berdasarkan Sifat)
      Format: [Sifat] STR | INT | VIT | AGI | DEX
      Antusias: 41 | 6  | 14 | 11 | 11
      Intelek : 6  | 41 | 14 | 9  | 25
      Setia   : 11 | 11 | 41 | 6  | 11
      Lincah  : 14 | 6  | 7  | 41 | 14
      Penakut : 11 | 11 | 7  | 9  | 41
      Mantap  : 11 | 11 | 11 | 9  | 14
      Kokoh   : 21 | 21 | 21 | 6  | 6
      Adil    : 14 | 14 | 9  | 9  | 11
      Kalem   : 11 | 9  | 14 | 11 | 11
      Nekat   : 14 | 7  | 11 | 14 | 11
      Proaktif: 14 | 14 | 11 | 11 | 7
      Heroik  : 11 | 11 | 11 | 14 | 9
      Licik   : 6  | 14 | 6  | 21 | 14
      Lembut  : 6  | 21 | 14 | 7  | 21

      [4] REKOMENDASI BUILD & MOB (BEST PRACTICE)
      -- Kategori: DPS (Damage Dealer) --
      Rekomendasi Mob:
      1. Mochelo (DPS Magic)
      2. Mitta Tert (DPS Fisik)
      3. Satwal (Hybrid Magic & Fisik)

      Konfigurasi Senjata & Sifat:
      - 2H/1H (Fisik): Sifat Antusias (Fokus STR) -> Skill: Raging Blow
      - Bowgun/Bow (Akurasi): Sifat Akurat/Antusias (Fokus DEX)
      - Knuckle (Hindaran): Sifat Penghindar/Antusias (Fokus AGI)
      - Staff/MD (Sihir): Sifat Intelek (Fokus INT > VIT) -> Skill: Lembing Sihir
      - Skill Pasif Wajib: Serap HP (Absorb HP)

      -- Kategori: TANK --
      Rekomendasi Mob:
      1. Rem Potum (Arrow Up)
      2. Ram Potum
      3. Semut Api
      4. Propibi (Arrow Up)
      5. Emungil
      6. Kalong Angker (Double Hit)
      7. Pemancung Bandit Gurun
      8. Potum Semedi (Arrow Up, Double Hit)
      9. Lanbat (Double Hit)
      10. Kumbang Buntal

      Konfigurasi Senjata & Sifat:
      - Umum: All Weapon | Sifat: Tahan Fisik/Genius/Tahan Sihir/Setia
      - Spesifik: Magic Device (MD) | Sifat: Tahan Fisik/Setia
      - Pelatihan: Full VIT

      -- Kategori: SUPPORT --
      1. Tipe Buff: Sifat Tahan Fisik/Genius | Latih Full VIT | Skill dengan indikator "Arrow Up" (Red Arrow).
      2. Tipe Heal: Senjata MD/Staff | Sifat Lembut/Penakut/Genius | Latih VIT & INT.
      Catatan Teknis:
      - Arrow Up: Indikator pada skill support mob tertentu yang meningkatkan efek buff.
      - Double Hit: Pet melakukan 2x hit per serangan normal (menggandakan AMPR).

      SISTEM EXP & LEVELING SKILL
      Mekanisme: Kenaikan kebutuhan kill bersifat geometris (x2) setiap level.
      Tabel Kebutuhan Kill:
      Level +1: 300 Kill
      Level +2: 600 Kill
      Level +3: 1.200 Kill
      Level +4: 2.400 Kill
      Level +5: 4.800 Kill
      Level +6: 9.600 Kill
      Level +7: 19.200 Kill
      Level +8: 38.400 Kill
      Level +9: 76.800 Kill

      Catatan Leveling:
      - Gacha skill disarankan di awal (target Lv 5) untuk menghemat waktu leveling skill.
      - Jika start skill Lv 5, mencapai Lv 10 hanya butuh 9.300 Kill total.
      - Lokasi Leveling Skill: Kanal Bawah Tanah Sofya (Mob: Blue Jelly) atau Gunung Nisel (Mob: Shell Mask).

      SISTEM EXP LEVEL KARAKTER PET
      Mekanisme Bonus:
      - Base EXP: Affinity x 10% (Affinity 100% = 1000% EXP).
      - Food Bonus: Dikalikan dengan Affinity. (Contoh: Buff 50% + Affinity 100% = 1500% Total EXP).
      - Gem Bonus: Dihitung dari Base EXP Boss.

      Lokasi Leveling Pet (Rekomendasi):
      Lv 1-40: Masked Warrior (Normal)
      Lv 40-46: Masked Warrior (Hard)
      Lv 46-72: Masked Warrior (Nightmare)
      Lv 72-95: Masked Warrior (Ultimate)
      Lv 95-102: Cerberus (Nightmare)
      Lv 102-160: Cerberus (Ultimate)
      Lv 160-Cap: Venena (Ultimate)

      SISTEM FUSION (PADU PET)
      Rumus Level Maksimal:
      (Level Pet A + Level Pet B) / 2 + 1
      Contoh: (150 + 170) / 2 + 1 = 161.

      Rumus Power Pet:
      Power A + Power B = Total Power Baru.
      Efisiensi Power berdasarkan Senjata:
      - Staff/MD: 100% ATK, 100% MATK
      - Knuckle: 100% ATK, 50% MATK
      - Bow/BG/1H/2H: 100% ATK, 0% MATK

      Rumus Biaya Spina (Fusion Cost):
      ((Level A x Level B) / 10) x (Jumlah Fusion A + Jumlah Fusion B)
      Contoh: Pet A (Lv100, Fusion 10) + Pet B (Lv10, Fusion 100) = 11.000 Spina.

      Rumus Potensi Bonus (Stat):
      (Potensi Latih A + Potensi Latih B) / 10 (Pembulatan ke bawah).

      MANAJEMEN MAKANAN (FOOD SYSTEM)
      Jenis Makanan:
      1. Mini Pet Food: 10s | Aff 10% | Stamina 10 | No Bonus
      2. Normal Pet Food: 100s | Aff 20% | Stamina 60 | Bonus Exp 10-30%
      3. Stamina Pet Food: 1000s | Aff 10% | Stamina 100 | Rare Bonus 10-50%
      4. Delicious Pet Food: 1000s | Aff 40% | Stamina 30 | Rare Bonus 10-50%
      5. High Grade Food: 3000s | Aff 40% | Stamina 100 | Rare Bonus 10-50%
      6. Top Quality Food: 1-2 Orb | Aff 100% | Stamina 100 | Random Bonus 50%

      Jenis Buff:
      - Buff Exp (10/30/50%)
      - Buff Sukses Melatih (10/30/50%)
      - Buff Sifat (10/30%)

      SISTEM PENALTI
      Penalti Party (Mengurangi AMPR, ASPD, CSPD, DMG, MP Charge):
      - 1 Member: 0%
      - 2 Member: -17%
      - 3 Member: -34%
      - 4 Member: -51%

      Penalti Selisih Level (EXP Gain):
      - Beda 0-19 Level: 100% EXP
      - Beda 29 Level: 90% EXP
      - Beda 39 Level: 70% EXP
      - Beda 49 Level: 40% EXP
      - Beda 57+ Level: 10% EXP

      TEKNIK TAMING (MENANGKAP PET)
      Alokasi Skill Tamer (Skill Tree):
      - Opsi Hemat SP: 10-0-0 | 10-10 | 0-0
      - Opsi Maksimal (SP Berlebih): 10-10-10 | 10-10 | 0-0

      Strategi Penangkapan:
      1. Pastikan Level Karakter >= Level Mob.
      2. Kurangi HP Mob hingga sekarat (HP < 20% sangat disarankan).
      3. Semakin rendah HP Mob, semakin cepat bar penangkapan penuh.
      4. Hindari membunuh mob saat proses penangkapan berjalan.

      REFERENSI & SUMBER DATA
      Basis Data: Toram Online Forum ID
      Tautan Asli: https://toram-id.com/forum/all-about-pet-on-tor-4f8ea981
      `.trim();
    sock.sendMessage(chatId, { text: msgs }, { quoted: msg });
  } catch (err) {}
};
