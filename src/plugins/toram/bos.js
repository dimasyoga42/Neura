import axios from 'axios'

const Bossdef = async (sock, chatId, msg, text) => {
  try {
    const name = text.replace("!bos", "").trim()

    if (!name) {
      return sock.sendMessage(
        chatId,
        { text: "Mohon masukkan nama boss setelah perintah !bos" },
        { quoted: msg }
      )
    }

    // Melakukan request ke API
    const res = await axios.get(
      `https://monster-toram.vercel.app/api/monsters/search/${encodeURIComponent(name)}`
    )

    const { count, data } = res.data

    // Validasi jika data tidak ditemukan
    if (!data || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: `Boss dengan nama "${name}" tidak ditemukan dalam basis data.` },
        { quoted: msg }
      )
    }

    // 1. Mengambil data boss pertama (index 0) dari hasil pencarian
    const boss = data[0]

    // 2. Mengambil data statistik pertama dari array 'statdef'
    // Kita menggunakan optional chaining (?.) untuk keamanan jika statdef kosong
    const stats = boss.statdef && boss.statdef.length > 0 ? boss.statdef[0] : {}

    // Kunci yang tidak ingin ditampilkan
    const blacklistKey = ["difficulty"]

    // 3. Memproses detail statistik
    const statsDetails = Object.entries(stats)
      .filter(([key, value]) => {
        if (blacklistKey.includes(key)) return false
        return value !== null && value !== "" && value !== "-"
      })
      .map(([key, value]) => {
        // Mengubah format key (misal: res_phys -> Res Phys)
        const cleanKey = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())

        // Membersihkan value string dari newline berlebih jika ada
        const cleanValue = typeof value === "string"
          ? value.replace(/\n/g, " / ")
          : value

        return `> *${cleanKey}* : ${cleanValue}`
      })
      .join("\n")

    // Menyusun pesan akhir
    const message = `
*Analisis Data Boss Toram*
Nama: *${boss.name}*
ID Basis Data: ${boss.id}

${statsDetails}

_Menampilkan hasil paling relevan dari ${count} data yang ditemukan._
`.trim()

    await sock.sendMessage(
      chatId,
      { text: message },
      { quoted: msg }
    )

  } catch (err) {
    console.error("Kesalahan Sistem:", err)
    await sock.sendMessage(
      chatId,
      { text: "Terjadi kesalahan internal saat memproses data boss." },
      { quoted: msg }
    )
  }
}

export default Bossdef
