import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const execPromise = promisify(exec);
const TMP_DIR = path.resolve("tmp");

if (!fsSync.existsSync(TMP_DIR)) {
  fsSync.mkdirSync(TMP_DIR, { recursive: true });
}

/* ================= MENU ================= */

export const EfekMenu = async (sock, chatId, msg) => {
  const teks = `
🎧 *DAFTAR AUDIO EFEK*

Reply audio lalu ketik:

bass
blown
deep
earrape
fast
fat
nightcore
reverse
robot
slow
tupai
squirrel
chipmunk
smooth

Contoh:
.efek bass
.efek nightcore
.efek robot
.efek bass fast robot
`;

  await sock.sendMessage(chatId, { text: teks }, { quoted: msg });
};

export const AudioEffect = async (sock, chatId, msg, text) => {
  let inputFile = "";
  let outputFile = "";

  try {
    const q = msg.quoted ? msg.quoted : msg;
    const mime = (q.msg || q).mimetype || q.mediaType || "";

    if (!/audio/.test(mime)) {
      return sock.sendMessage(
        chatId,
        { text: "Reply audio dulu." },
        { quoted: msg }
      );
    }

    const effects = {
      bass: 'equalizer=f=94:width_type=o:width=2:g=30',
      blown: "acrusher=.1:1:64:0:log",
      deep: "atempo=1,asetrate=44500*2/3",
      earrape: "volume=12",
      fast: "atempo=1.63,asetrate=44100",
      fat: "atempo=1.6,asetrate=22100",
      nightcore: "atempo=1.06,asetrate=44100*1.25",
      reverse: "areverse",
      robot:
        "afftfilt=real='hypot(re,im)*sin(0)':imag='hypot(re,im)*cos(0)':win_size=512:overlap=0.75",
      slow: "atempo=0.7,asetrate=44100",
      tupai: "atempo=0.5,asetrate=65100",
      squirrel: "atempo=0.5,asetrate=65100",
      chipmunk: "atempo=0.5,asetrate=65100",
      smooth: "aresample=48000,asetrate=48000*1.02"
    };

    /* ===== MULTI EFFECT PARSER ===== */

    const args = (text || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((v) => effects[v]);

    const filterChain =
      args.length > 0
        ? args.map((e) => effects[e]).join(",")
        : "anull";

    const filename = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    inputFile = path.join(TMP_DIR, `${filename}_in.mp3`);
    outputFile = path.join(TMP_DIR, `${filename}_out.mp3`);

    const buffer = await downloadMediaMessage(
      q,
      "buffer",
      {},
      { logger: sock.logger }
    );

    await fs.writeFile(inputFile, buffer);

    const ffmpegCmd = `ffmpeg -y -vn -i "${inputFile}" -af "${filterChain}" "${outputFile}"`;

    try {
      const { stderr } = await execPromise(ffmpegCmd);
      if (stderr) console.log("FFmpeg:", stderr);
    } catch (ffErr) {
      console.error("FFmpeg Error:", ffErr.stderr || ffErr);
      throw new Error("FFmpeg gagal.");
    }

    const audioBuffer = await fs.readFile(outputFile);

    await sock.sendMessage(
      chatId,
      {
        audio: audioBuffer,
        mimetype: "audio/mpeg",
        ptt: false
      },
      { quoted: msg }
    );
  } catch (e) {
    console.error("AudioEffect Error:", e);
    await sock.sendMessage(
      chatId,
      { text: `Gagal:\n${e.message}` },
      { quoted: msg }
    );
  } finally {
    try {
      if (inputFile && fsSync.existsSync(inputFile)) {
        await fs.unlink(inputFile);
      }
      if (outputFile && fsSync.existsSync(outputFile)) {
        await fs.unlink(outputFile);
      }
    } catch (cleanupError) {
      console.error("Cleanup Error:", cleanupError);
    }
  }
};



export const EfekCommand = async (sock, chatId, msg, text) => {
  if (!text) {
    return EfekMenu(sock, chatId, msg);
  }
  return AudioEffect(sock, chatId, msg, text);
};
