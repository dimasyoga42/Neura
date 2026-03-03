// Daftar komponen untuk menghasilkan 1000+ kombinasi secara procedurally
const awalan = [
  "Pemuja",
  "Sultan",
  "Legenda",
  "Hamba",
  "Duta",
  "Pakar",
  "Ksatria",
  "Panglima",
];
const subjek = [
  "Tutup Panci",
  "Kecoak Terbang",
  "Nasi Kucing",
  "Remot TV",
  "Dispenser",
  "Gayung Pecah",
  "Kucing Oren",
  "Sapu Lidi",
];
const sifat = [
  "Sakti",
  "Turu",
  "Gacor",
  "Sigma",
  "Skibidi",
  "Wibu",
  "Ngeselin",
  "Pro Player",
  "Mental Breakdance",
];

const getKhodamLokal = (nama) => {
  const dataset = [];
  for (let a of awalan) {
    for (let s of subjek) {
      for (let sf of sifat) {
        dataset.push({
          name: `${a} ${s} ${sf}`,
          meaning: "Energi metafisika Anda sangat tidak terduga hari ini.",
        });
      }
    }
  }

  let hash = 0;
  for (let i = 0; i < nama.length; i++) {
    hash = (hash << 5) - hash + nama.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % dataset.length;
  return dataset[index];
};

export const khodam = async (sock, chatId, msg, text) => {
  try {
    const namaUser = text.split(" ").slice(1).join(" ") || "Tanpa Nama";
    if (!namaUser)
      return sock.sendMessage(
        chatId,
        { text: "masukan nama setelah .khodam" },
        { quoted: msg },
      );
    const res = getKhodamLokal(namaUser);

    const txt =
      `Nama: *${namaUser}*\nKhodam: *${res.name}*\n_Keterangan: ${res.meaning}_`.trim();

    await sock.sendMessage(chatId, { text: txt }, { quoted: msg });
  } catch (err) {
    console.error(err);
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan pada sistem pemindaian gaib." },
      { quoted: msg },
    );
  }
};
