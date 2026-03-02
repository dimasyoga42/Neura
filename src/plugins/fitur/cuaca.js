import axios from "axios";

const CSV_URL =
  "https://raw.githubusercontent.com/kodewilayah/permendagri-72-2019/main/dist/base.csv";
const BMKG_URL = "https://api.bmkg.go.id/publik/prakiraan-cuaca";

const cuaca = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(".cuaca", "").trim().toLowerCase();

    if (!query) {
      return sock.sendMessage(
        chatId,
        { text: "masukan nama desa atau kecamatan" },
        { quoted: msg },
      );
    }

    const { data: csv } = await axios.get(CSV_URL, { timeout: 15000 });
    const rows = csv.split("\n").slice(1);

    const found = rows.find((row) => {
      const cols = row.split(",");
      return cols[1]?.toLowerCase().includes(query);
    });

    if (!found) {
      return sock.sendMessage(
        chatId,
        { text: "wilayah tidak ditemukan" },
        { quoted: msg },
      );
    }

    const cols = found.split(",");
    const adm4 = cols[0];
    const wilayah = cols[1];

    const { data: weather } = await axios.get(`${BMKG_URL}?adm4=${adm4}`, {
      timeout: 15000,
    });

    const now = weather?.data?.[0]?.cuaca?.[0]?.[0];

    if (!now) {
      return sock.sendMessage(
        chatId,
        { text: "data cuaca tidak tersedia" },
        { quoted: msg },
      );
    }

    const resultText = `${wilayah}
${now.weather_desc}
suhu ${now.t}°C
kelembapan ${now.hu}%
angin ${now.wd} ${now.ws} km/jam
jarak pandang ${now.vs_text}
${now.local_datetime}`;

    await sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
  } catch (err) {
    return sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan" },
      { quoted: msg },
    );
  }
};

export default cuaca;
