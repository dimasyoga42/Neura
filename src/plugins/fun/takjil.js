import axios from "axios";
import { Resapi } from "../../../setting.js";

export const takjilRandom = async (sock, chatId, msg) => {
  try {
    const response = await axios.get(Resapi.takjil);
    const data = response.data;

    if (!Array.isArray(data) || data.length === 0) return;

    const randomIndex = Math.floor(Math.random() * data.length);
    const randomImage = data[randomIndex];

    await sock.sendMessage(
      chatId,
      { image: { url: randomImage } },
      { quoted: msg },
    );
  } catch (err) {
    console.error("takjilRandom error:", err);
  }
};
