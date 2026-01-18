import fetch from "node-fetch";
import * as cheerio from "cheerio";
const dataLevel = {
  "1-40": `
Mob: Pova
Lokasi: Lonogo Canyon
  `.trim(),
  "40-55": `
Mob: Bone Dragonewt
Lokasi: Ancient Empress Tomb: Area 1
  
  `.trim(),
  "55-70": `
Bos:
- Flare Volg (Hard) | Level 55-62
- Flare Volg (Nightmare) | Level 62-70
Lokasi: Fiery Volcano: Lava Trail
  `.trim(),
  "70-95": `
Bos:
- Masked Warrior (Hard) | Level 70-79
- Masked Warrior (Nightmare) | Level 79-95
Lokasi: Land Under Cultivation: Hill
  `.trim(),
  "95-112": `
 Bos: Masked Warrior (Ultimate)
 Lokasi: Land Under Cultivation: Hill
 Pilihan lain:
 - Mini Bos: Don Yeti
 - Lokasi: Polde Ice Valley (Lembah Es Polde)

  `.trim(),
  "112-125": `
Bos: Cerberus (Nightmare)
Lokasi: Spring of Rebirth: Top
  `.trim(),
  "125-129": `
Mini Bos: Lapin The Necromancer (Dukun Lapin)
Lokasi: Trace of Dark River
  `.trim(),
  "129-146": `
Bos: Carberus (Ultimate)
Lokasi: Spring of Rebirth: Top
Pilihan lain:
Mini Bos: Builder Golem (Builder Golem)
- Level 132-143
- Huge Crysta Factory: 3rd Floor (Pabrik Crysta Raksasa)
  `.trim(),
  "146-162": `
Bos: Venena Coenubia (Hard)
Lokasi: Ultimea Palace: Throne
Pilihan lain:
Mini Bos: Super Death Mushroom
- Level 143-158
- Monster's Forest: Animal Trail
Mini Bos: Commander Golem (Komandan Golem)
- Level 146-162
- Lufenas Mansion: Entrance (Mansion Lufenas)
  `.trim(),
  "162-179": `
Bos: Venena Coenubia (Nightmare)
Lokasi: Ultimea Palace: Throne
Pilihan lain:
Mini Bos: Altoblepas
- Level 166-182
- Rokoko Plains
  `.trim()
    "179-182": `
Mini Bos: Altoblepas
Lokasi: Rokoko Plains
  `.trim(),

  "182-199": `
Bos: Venena Coenubia (Ultimate)
Lokasi: Ultimea Palace: Throne
  `.trim(),

  "199-215": `
Bos: Finstern the Dark Dragon (Ultimate)
Lokasi: Dark Dragon Shrine: Near the Top
  `.trim(),

  "215-227": `
Bos: Kuzto (Ultimate)
Lokasi: Labilans Sector: Square (Distrik Labilan: Alun-Alun)

Pilihan lain:
Mini Bos: Espectro
- Level 213-229
- Arche Valley: Area 1 (Lembah Arche: Area 1)
  `.trim(),

  "227-244": `
Bos: Arachnidemon (Ultimate)
Lokasi: Arche Valley: Depths (Lembah Arche: Area Terdalam)

Pilihan lain:
Mini Bos: Rhinosaur
- Level 227-234
- Fugitive Lake Swamp: Area 3

Mini Bos: Bullamius
- Level 234-246
- Storage Yard: Area 2
  `.trim(),

  "244-253": `
Bos: Ferzen the Rock Dragon (Ultimate)
Lokasi: Guardian Forest: Giant Tree

Pilihan lain:
Bos: Gemma (Ultimate)
- Level 244-253
- Fugitive Lake Swamp: Depths

Mini Bos: Ignitrus
- Level 246-254
- Vulcani Crater Base
  `.trim(),

  "253-266": `
Bos: Trickster Dragon Mimyugon (Nightmare)
Lokasi: Operation Zone: Cockpit Area

Pilihan lain:
Mini Bos: Brassozard
- Level 256-262
- Operation Zone: Climate Control Area

Mini Bos: Trus
- Level 262-277
- Propulsion System Zone: Power Tank
  `.trim(),

  "266-272": `
Bos: Red Ash Dragon Rudis (Hard)
Lokasi: Espuma Dome: Entrance

Pilihan lain:
Bos: Walican (Nightmare)
- Level 266-272
- Jabali Kubwa: Summit

Mini Bos: Trus
- Level 262-277
- Propulsion System Zone: Power Tank
  `.trim(),

  "272-287": `
Bos: Trickster Dragon Mimyugon (Ultimate)
Lokasi: Operation Zone: Cockpit Area

Pilihan lain:
Bos: Red Ash Dragon Rudis (Nightmare)
- Level 272-285
- Espuma Dome: Entrance

Bos: Walican (Ultimate)
- Level 278-296
- Jabali Kubwa: Summit

Mini Bos: Capo Profundo
- Level 278-296
- Abandoned District: Area 3
  `.trim(),

  "285-303": `
Bos: Mulgoon (Nightmare)
Lokasi: Menabra Plains

Pilihan lain:
Bos: Red Ash Dragon Rudis (Ultimate)
- Level 290-308
- Espuma Dome: Entrance
  `.trim(),

  "303-310": `
Bos: Bakuzan (Hard)
Lokasi: Afval Uplands

Pilihan lain:
Bos: Biskyva (Nightmare)
- Level 294-312
- Aquastida Central

Mini Bos: Meteora
- Level 293-311
- Menabra Plains

Mini Bos: Wiltileaf
- Level 296-314
- Eumano Village Ruins: Area 2
  `.trim()
}




export const leveling = async (sock, chatid, msg, text) => {
  const arg = text.split(" ");
  const lvl = Number(arg[1]);

  if (!lvl || isNaN(lvl)) {
    return sock.sendMessage(
      chatid,
      { text: "Format salah\n> gunakan !lv <level kamu>" },
      { quoted: msg }
    );
  }

  const range = getLevelRange(lvl, dataLevel);

  if (!range) {
    return sock.sendMessage(
      chatid,
      { text: `Level ${lvl} belum tersedia di database leveling.` },
      { quoted: msg }
    );
  }

  const caption = `
*Level ${lvl}*
${dataLevel[range]}

> By Neura Sama
  `.trim();

  await sock.sendMessage(
    chatid,
    { text: caption },
    { quoted: msg }
  );
};

