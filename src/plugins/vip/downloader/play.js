import axios from "axios";
import ffmpeg from "fluent-ffmpeg";
import { sendFancyText } from "../../../lib/message.js";
import { execSync } from "child_process";
import { writeFileSync, readFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import crypto from "crypto";

try {
  const path = execSync("which ffmpeg").toString().trim();
  ffmpeg.setFfmpegPath(path);
} catch {}

const convertToOpus = (inputBuffer) => {
  return new Promise((resolve, reject) => {
    const id = crypto.randomBytes(6).toString("hex");
    const tmpIn = join(tmpdir(), `neura_${id}.mp3`);
    const tmpOut = join(tmpdir(), `neura_${id}.ogg`);

    const cleanup = () => {
      if (existsSync(tmpIn)) unlinkSync(tmpIn);
      if (existsSync(tmpOut)) unlinkSync(tmpOut);
    };

    try {
      writeFileSync(tmpIn, inputBuffer);

      ffmpeg(tmpIn)
        .audioFrequency(48000)
        .audioChannels(1)
        .audioCodec("libopus")
        .outputOptions(["-application voip", "-y"])
        .format("ogg")
        .on("end", () => {
          try {
            const buffer = readFileSync(tmpOut);
            cleanup();
            if (!buffer || buffer.length === 0) {
              return reject(new Error("Output kosong"));
            }
            resolve(buffer);
          } catch (e) {
            cleanup();
            reject(e);
          }
        })
        .on("error", (err) => {
          cleanup();
          reject(err);
        })
        .save(tmpOut);
    } catch (err) {
      cleanup();
      reject(err);
    }
  });
};

export const play = async (sock, chatId, msg, text) => {
  try {
    const query = text.replace(/^\.play\s*/i, "").trim();

    if (!query) {
      return await sock.sendMessage(
        chatId,
        { text: "Masukkan judul lagu yang ingin dicari." },
        { quoted: msg },
      );
    }

    await sock.sendMessage(
      chatId,
      { text: "⏳ Mencari lagu, mohon tunggu..." },
      { quoted: msg },
    );

    const res = await axios.get(
      `https://api.neoxr.eu/api/play?q=${encodeURIComponent(query)}&apikey=${process.env.NOXER}`,
    );

    const data = res.data;

    if (!data || !data.data || !data.data.url) {
      return await sendFancyText(sock, chatId, {
        title: "Neura Play",
        body: "Musik yang kamu cari tidak ditemukan",
        text: "",
        thumbnail:
          "https://i.pinimg.com/1200x/58/64/04/58640492bafe2aa0d98c00c2b326448b.jpg",
        quoted: msg,
      });
    }

    const audioRes = await axios.get(data.data.url, {
      responseType: "arraybuffer",
      headers: { "User-Agent": "Mozilla/5.0" },
      timeout: 60000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    const mp3Buffer = Buffer.from(audioRes.data);

    let audioBuffer;
    let mimetype;
    let fileName;

    try {
      audioBuffer = await convertToOpus(mp3Buffer);
      mimetype = "audio/ogg; codecs=opus";
      fileName = `${data.title}.ogg`;
    } catch {
      audioBuffer = mp3Buffer;
      mimetype = "audio/mpeg";
      fileName = `${data.title}.mp3`;
    }

    await sendFancyText(sock, chatId, {
      title: "Neura Play ",
      body: `${data.title}`,
      text: `Channel: ${data.channel}\nDurasi: ${data.fduration}\nViews: ${data.views}\nSize: ${data.data.size}`,
      thumbnail: data.thumbnail,
      quoted: msg,
    });

    await sock.sendMessage(
      chatId,
      {
        audio: audioBuffer,
        mimetype: mimetype,
        fileName: fileName,
        ptt: false,
      },
      { quoted: msg },
    );
  } catch (err) {
    console.error("Error di play:", err);
    await sock.sendMessage(
      chatId,
      { text: `Terjadi error: ${err.message}` },
      { quoted: msg },
    );
  }
};
