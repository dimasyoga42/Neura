import { supabase } from "./../../model/supabase.js";

export const bosTesting = async (sock, chatId, msg) => {
  try {
    // Dataset Lokal: Daftar referensi lengkap nama boss
    const nameBos = [
      "Astol",
      "Ancient Empress Mezzaluna",
      "Arachnidemon",
      "Aranea",
      "B.B. Goblin",
      "Bexiz",
      "Biskyva",
      "Black Knight of Delusion",
      "Black Shadow",
      "Boss Colon",
      "Boss Goblin",
      "Boss Roga",
      "Brass Dragon Reguita",
      "Brutal Dragon Decel",
      "Burning Dragon Igneus",
      "Cerberus",
      "Crystal Titan",
      "Deformis",
      "Dominaredor",
      "Demonic Quasar",
      "Demon's Gate",
      "Don Profundo",
      "Eerie Crystal",
      "Eroded Pilz",
      "Evil Crystal Beast",
      "Excavated Golem",
      "Ferzen the Rock Dragon",
      "Filrocas",
      "Finstern the Dark Dragon",
      "Flare Volg",
      "Forest Wolf",
      "Forestia",
      "Ganglef",
      "Gemma",
      "Gespenst",
      "Goovua",
      "Gordel",
      "Grass Dragon Yelb",
      "Gravicep",
      "Guard Golem",
      "Guignol",
      "Gwaimol",
      "Hexter",
      "Humida",
      "Iconos",
      "Ifrid",
      "Imitacia",
      "Imitator",
      "Inzanio the Dark Knight",
      "Irestida",
      "Jade Raptor",
      "Junior Dragon Zyvio",
      "King Piton",
      "Kuzto",
      "Lalvada",
      "Mardula",
      "Masked Warrior",
      "Maton Sword",
      "Mauez",
      "Memecoleolus",
      "Menti",
      "Minotaur",
      "Mochelo",
      "Mom Fluck",
      "Mozto Machina",
      "Mulgoon",
      "Nurethoth",
      "Ooze",
      "Ornlarf",
      "Oculasignio",
      "Pillar Golem",
      "Pisteus",
      "Proto Leon",
      "Pyxtica",
      "Raging Dragon Bovinari",
      "Red Ash Dragon Rudis",
      "Reliza",
      "Repthon",
      "Ruin Golem",
      "Sapphire Roga",
      "Scrader",
      "Seele Zauga",
      "Shampy",
      "Trickster Dragon Mimyugon",
      "Tuscog",
      "Twilight Dragon",
      "Tyrant Machina",
      "Ultimate Machina",
      "Vatudo",
      "Velum",
      "Venena Coenubia",
      "Venena Metacoenubia",
      "Vlam the Flame Dragon",
      "Vulture",
      "Walican",
      "War Dragon Turba",
      "Warmonger",
      "Wicked Dragon Fazzino",
      "York",
      "Zahhak Machina",
      "Zapo",
      "Zelbuse",
      "Zolban"
    ];

    // Tahap 1: Mengambil data dari database
    const { data: dbData, error } = await supabase
      .from("bosdef")
      .select("name");

    if (error) {
      throw new Error(`Kegagalan pengambilan data: ${error.message}`);
    }

    if (!dbData || !Array.isArray(dbData)) {
      throw new Error("Data dari database tidak valid");
    }

    // Tahap 2: Normalisasi dan buat Set
    // Konversi ke lowercase dan trim untuk perbandingan case-insensitive
    const registeredNames = new Set(
      dbData
        .map(entry => entry?.name)
        .filter(Boolean)
        .map(name => name.toLowerCase().trim())
    );

    // Tahap 3: Filter boss yang belum terdaftar dengan normalisasi
    const unregisteredBosses = nameBos.filter(
      boss => !registeredNames.has(boss.toLowerCase().trim())
    );

    // Tahap 4: Kirim response
    if (unregisteredBosses.length > 0) {
      const resultList = unregisteredBosses.join("\n");

      await sock.sendMessage(
        chatId,
        {
          text: `📋 *Data Boss Belum Terdaftar*\n\n${resultList}\n\n_Total: ${unregisteredBosses.length} boss_`
        },
        { quoted: msg }
      );

      console.log(`[INFO] ${unregisteredBosses.length} boss belum terdaftar`);
    } else {
      await sock.sendMessage(
        chatId,
        { text: "✅ Semua boss sudah terdaftar di database" },
        { quoted: msg }
      );

      console.log("[INFO] Semua boss sudah terdaftar");
    }

  } catch (error) {
    console.error("[ERROR] bosTesting:", error.message);

    await sock.sendMessage(
      chatId,
      { text: `❌ Terjadi kesalahan: ${error.message}` },
      { quoted: msg }
    ).catch(err => console.error("[ERROR] Gagal mengirim pesan error:", err));
  }
};

