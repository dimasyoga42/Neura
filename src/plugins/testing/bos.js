import { supabase } from "./../../model/supabase.js";

export const bosTesting = async (sock, chatId, msg) => {
  try {
    // Dataset Lokal: Daftar referensi lengkap nama boss
    const nameBos = [
      "Astol", "Ancient Empress Mezzaluna", "Arachnidemon", "Aranea", "B.B. Goblin",
      "Bexiz", "Biskyva", "Black Knight of Delusion", "Black Shadow", "Boss Colon",
      "Boss Goblin", "Boss Roga", "Brass Dragon Reguita", "Brutal Dragon Decel",
      "Burning Dragon Igneus", "Cerberus", "Crystal Titan", "Deformis", "Dominaredor",
      "Demonic Quasar", "Demon's Gate", "Don Profundo", "Eerie Crystal", "Eroded Pilz",
      "Evil Crystal Beast", "Excavated Golem", "Ferzen the Rock Dragon", "Filrocas",
      "Finstern the Dark Dragon", "Flare Volg", "Forest Wolf", "Forestia", "Ganglef",
      "Gemma", "Gespenst", "Goovua", "Gordel", "Grass Dragon Yelb", "Gravicep",
      "Guard Golem", "Guignol", "Gwaimol", "Hexter", "Humida", "Iconos", "Ifrid",
      "Imitacia", "Imitator", "Inzanio the Dark Knight", "Irestida", "Jade Raptor",
      "Junior Dragon Zyvio", "King Piton", "Kuzto", "Lalvada", "Mardula",
      "Masked Warrior", "Maton Sword", "Mauez", "Memecoleolus", "Menti", "Minotaur",
      "Mochelo", "Mom Fluck", "Mozto Machina", "Mulgoon", "Nurethoth", "Ooze",
      "Ornlarf", "Oculasignio", "Pillar Golem", "Pisteus", "Proto Leon", "Pyxtica",
      "Raging Dragon Bovinari", "Red Ash Dragon Rudis", "Reliza", "Repthon",
      "Ruin Golem", "Sapphire Roga", "Scrader", "Seele Zauga", "Shampy",
      "Trickster Dragon Mimyugon", "Tuscog", "Twilight Dragon", "Tyrant Machina",
      "Ultimate Machina", "Vatudo", "Velum", "Venena Coenubia", "Venena Metacoenubia",
      "Vlam the Flame Dragon", "Vulture", "Walican", "War Dragon Turba", "Warmonger",
      "Wicked Dragon Fazzino", "York", "Zahhak Machina", "Zapo", "Zelbuse", "Zolban"
    ];

    // Tahap 1: Mengakuisisi data eksisting dari tabel 'bosdef' di Supabase
    const { data: dbData, error } = await supabase
      .from("bosdef")
      .select("name");

    if (error) {
      throw new Error(`Kegagalan pengambilan data database: ${error.message}`);
    }

    // Tahap 2: Transformasi data database menjadi Himpunan (Set) untuk efisiensi komparasi
    // Penggunaan Set mengubah kompleksitas pencarian dari O(n) menjadi O(1)
    const registeredNames = new Set(dbData.map(entry => entry.name));

    // Tahap 3: Operasi Selisih Himpunan (Set Difference)
    // Memfilter 'nameBos' untuk mengambil elemen yang TIDAK ADA di 'registeredNames'
    const unregisteredBosses = nameBos.filter(boss => !registeredNames.has(boss));

    // Tahap 4: Eksekusi Respons
    if (unregisteredBosses.length > 0) {
      // Mengonversi array hasil filter menjadi string yang dipisahkan baris baru
      const resultList = unregisteredBosses.join("\n");

      // Mengirimkan HANYA daftar nama yang belum ada
      await sock.sendMessage(chatId, { text: resultList }, { quoted: msg });

      console.log(`[LOG] Ditemukan ${unregisteredBosses.length} data yang belum terdaftar.`);
    } else {
      // Opsional: Memberi tahu jika semua data sudah lengkap
      await sock.sendMessage(chatId, { text: "Nihil. Seluruh data boss pada daftar lokal sudah tercatat di database." }, { quoted: msg });
    }

  } catch (error) {
    console.error("Kesalahan Sistem pada bosTesting:", error);
    await sock.sendMessage(chatId, { text: "Terjadi kesalahan sistem saat memvalidasi data." });
  }
}
