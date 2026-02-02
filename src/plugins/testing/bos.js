import { supabase } from "./../../model/supabase.js";

export const bosTesting = async (sock, chatId, msg) => {
  try {
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

    // Mengambil data dari Supabase dengan destructuring untuk menangkap error
    const { data: dbData, error } = await supabase.from("bosdef").select("name");

    if (error) throw error;

    // Ekstraksi nama dari database ke dalam Set untuk efisiensi pencarian O(1)
    const dbNames = new Set(dbData.map(item => item.name));

    // Identifikasi entitas yang belum terdaftar di database (Set Difference)
    const missingBosses = nameBos.filter(boss => !dbNames.has(boss));

    // Konstruksi pesan laporan
    let reportMessage = "";
    if (missingBosses.length > 0) {
      reportMessage = `*Laporan Sinkronisasi Data*\n` +
        `Terdapat *${missingBosses.length}* data baru yang belum masuk ke database:\n` +
        missingBosses.map((name, i) => `${i + 1}. ${name}`).join("\n");
    } else {
      reportMessage = `*Data Sinkron*\nSeluruh data boss (${nameBos.length} entitas) sudah terdaftar di database.`;
    }

    // Mengirimkan laporan kembali ke chat WhatsApp
    await sock.sendMessage(chatId, { text: reportMessage }, { quoted: msg });

  } catch (error) {
    console.error("Error in bosTesting execution:", error);
    await sock.sendMessage(chatId, { text: "❌ Terjadi kesalahan saat memproses validasi data." });
  }
}
