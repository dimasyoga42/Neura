import path from "path";
import { getUserData, saveUserData } from "../../config/func.js";

const db = path.resolve("db", "code.json");

const codeLive = (sock, chatId, msg) => {
  try {
    const data = getUserData(db);
    if (!Array.isArray(data) || data.length === 0) {
      return sock.sendMessage(
        chatId,
        { text: "belum ada data code live tersedia" },
        { quoted: msg },
      );
    }

    let resultText = "Informasi:\n\n";
    data.forEach((item, index) => {
      resultText += `${item.name}\n${item.isi}`;
    });

    sock.sendMessage(chatId, { text: resultText }, { quoted: msg });
  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat mengambil data" },
      { quoted: msg },
    );
  }
};

const setCode = (sock, chatId, msg, text) => {
  try {
    const parts = text.split("-");
    const name = parts[1]?.trim();
    const value = parts[2]?.trim();

    if (!name || !value) {
      return sock.sendMessage(
        chatId,
        { text: "format salah\ncontoh: .setcode-nama-isi" },
        { quoted: msg },
      );
    }

    const data = getUserData(db);
    const newId =
      data.length > 0 ? Math.max(...data.map((item) => item.id)) + 1 : 1;

    const newData = {
      id: newId,
      name: name,
      isi: value,
      created_at: Date.now(),
    };

    data.push(newData);
    saveUserData(db, data);

    sock.sendMessage(
      chatId,
      { text: "data berhasil disimpan" },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat menyimpan data" },
      { quoted: msg },
    );
  }
};

const deletCode = (sock, chatId, msg, text) => {
  try {
    const id = parseInt(text.split(" ")[1]);

    if (!id || isNaN(id)) {
      return sock.sendMessage(
        chatId,
        { text: "masukkan id yang valid\ncontoh: .delcode 1" },
        { quoted: msg },
      );
    }

    const data = getUserData(db);
    const filtered = data.filter((item) => item.id !== id);

    if (filtered.length === data.length) {
      return sock.sendMessage(
        chatId,
        { text: "id tidak ditemukan" },
        { quoted: msg },
      );
    }

    saveUserData(db, filtered);

    sock.sendMessage(
      chatId,
      { text: "data berhasil dihapus" },
      { quoted: msg },
    );
  } catch (err) {
    sock.sendMessage(
      chatId,
      { text: "terjadi kesalahan saat menghapus data" },
      { quoted: msg },
    );
  }
};

export { codeLive, setCode, deletCode };
