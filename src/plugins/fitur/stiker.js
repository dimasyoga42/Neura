import { existsSync, mkdirSync } from "fs";
import { promises as fs } from "fs";
import sharp from "sharp";
import { downloadMediaMessage, getContentType } from "@whiskeysockets/baileys";
import path from "path";
import crypto from "crypto";

const IMAGE_DIR = "./image";
const STICKER_SIZE = 512;
const WEBP_QUALITY = 80;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Pastikan folder ./image ada
if (!existsSync(IMAGE_DIR)) {
  mkdirSync(IMAGE_DIR, { recursive: true });
}

// Fungsi utama stiker
export const sticker = async (sock, chatId, msg) => {
  const uniqueId = crypto.randomBytes(8).toString("hex");
  const outputPath = path.join(IMAGE_DIR, `sticker-${uniqueId}.webp`);

  try {
    const mediaType = getContentType(msg);
    let mediaMsg = null;

    // Ambil media langsung
    if (mediaType === "imageMessage" || mediaType === "videoMessage") {
      mediaMsg = msg;
    }

    // Ambil media dari reply
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!mediaMsg && quoted) {
      if (quoted.imageMessage) {
        mediaMsg = { message: { imageMessage: quoted.imageMessage } };
      } else if (quoted.videoMessage && quoted.videoMessage.seconds <= 10) {
        mediaMsg = { message: { videoMessage: quoted.videoMessage } };
      }
    }

    // if (!mediaMsg) {
    // 	return sock.sendMessage(
    // 		chatId,
    // 		{ text: "❌ Kirim gambar/video (maks 10 detik) atau reply media untuk dijadikan stiker." },
    // 		{ quoted: msg }
    // 	);
    // }

    console.log("[Sticker] Mengunduh media...");

    const buffer = await downloadMediaMessage(
      mediaMsg,
      "buffer",
      {},
      { reuploadRequest: sock.updateMediaMessage }
    );

    if (buffer.length > MAX_FILE_SIZE) {
      return sock.sendMessage(
        chatId,
        { text: "❌ Ukuran file terlalu besar (maksimal 10MB)." },
        { quoted: msg }
      );
    }

    console.log("[Sticker] Mengonversi ke WebP...");

    const webpBuffer = await sharp(buffer)
      .resize(STICKER_SIZE, STICKER_SIZE, {
        fit: "contain",
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    await fs.writeFile(outputPath, webpBuffer);

    console.log("[Sticker] Mengirim stiker...");
    await sock.sendMessage(chatId, { sticker: webpBuffer, mimetype: "image/webp" }, { quoted: msg });

    console.log("[Sticker] ✅ Sukses!");

  } catch (err) {
    console.error("[Sticker] ❌ Error:", err);
    await sock.sendMessage(
      chatId,
      { text: "❌ Gagal membuat stiker. Coba kirim ulang gambar." },
      { quoted: msg }
    );
  }
};

export default sticker;
