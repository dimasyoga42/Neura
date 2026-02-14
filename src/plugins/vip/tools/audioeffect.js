import fs from "fs/promises"; // Menggunakan versi promise untuk efisiensi
import fs Sync from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const execPromise = promisify(exec);
const TMP_DIR = path.resolve("tmp");

if (!fsSync.existsSync(TMP_DIR)) {
  fsSync.mkdirSync(TMP_DIR, { recursive: true });
}

export const AudioEffect = async (sock, m, command) => {
  let inputFile = "";
  let outputFile = "";

  try {
    const q = m.quoted ? m.quoted : m;
    const mime = (q.msg || q).mimetype || q.mediaType || "";

    if (!/audio/.test(mime)) {
      return sock.sendMessage(m.chat, { text: "Silakan reply pesan audio terlebih dahulu." }, { quoted: m });
    }

    // Pemetaan filter FFmpeg yang lebih terstruktur
    const effects = {
      bass: '-af "equalizer=f=94:width_type=o:width=2:g=30"',
      blown: '-af "acrusher=.1:1:64:0:log"',
      deep: '-af "atempo=1,asetrate=44500*2/3"',
      earrape: '-af "volume=12"',
      fast: '-filter:a "atempo=1.63,asetrate=44100"',
      fat: '-filter:a "atempo=1.6,asetrate=22100"',
      nightcore: '-filter:a "atempo=1.06,asetrate=44100*1.25"',
      reverse: '-filter_complex "areverse"',
      robot: '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"',
      slow: '-filter:a "atempo=0.7,asetrate=44100"',
      tupai: '-filter:a "atempo=0.5,asetrate=65100"',
      squirrel: '-filter:a "atempo=0.5,asetrate=65100"',
      chipmunk: '-filter:a "atempo=0.5,asetrate=65100"',
      smooth: '-af "aresample=48000,asetrate=48000*1.02"'
    };

    // Mencari filter berdasarkan command menggunakan regex
    const effectKey = Object.keys(effects).find(key => new RegExp(key).test(command.toLowerCase()));
    const filter = effects[effectKey] || '-af "anull"';

    // Penamaan file yang lebih unik dengan timestamp untuk menghindari tabrakan data
    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    inputFile = path.join(TMP_DIR, `${filename}_in.mp3`);
    outputFile = path.join(TMP_DIR, `${filename}_out.mp3`);

    // Download dan simpan buffer
    const buffer = await downloadMediaMessage(q, "buffer", {}, { logger: sock.logger });
    await fs.writeFile(inputFile, buffer);

    // Eksekusi FFmpeg dengan Promise
    await execPromise(`ffmpeg -y -i "${inputFile}" ${filter} "${outputFile}"`);

    const audioBuffer = await fs.readFile(outputFile);

    await sock.sendMessage(
      m.chat,
      {
        audio: audioBuffer,
        mimetype: "audio/mp4", // OGG/MP4 lebih kompatibel untuk fitur PTT/Audio di WA
        ptt: false
      },
      { quoted: m }
    );

  } catch (e) {
    console.error("AudioEffect Error:", e);
    await sock.sendMessage(m.chat, { text: `Gagal memproses audio: ${e.message}` }, { quoted: m });
  } finally {
    // Blok finally memastikan file sementara dihapus terlepas dari sukses atau gagalnya proses
    try {
      if (fsSync.existsSync(inputFile)) await fs.unlink(inputFile);
      if (fsSync.existsSync(outputFile)) await fs.unlink(outputFile);
    } catch (cleanupError) {
      console.error("Cleanup Error:", cleanupError);
    }
  }
};
