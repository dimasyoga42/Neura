import fs from "fs"
import path from "path"
import { exec } from "child_process"
import { downloadMediaMessage } from "@whiskeysockets/baileys"

const TMP_DIR = path.resolve("tmp")

if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true })
}

export const AudioEffect = async (sock, m, command) => {
  try {
    let q = m.quoted ? m.quoted : m
    let mime = (q.msg || q).mimetype || q.mediaType || ""

    if (!/audio/.test(mime)) {
      return sock.sendMessage(m.chat, { text: "Reply audio dulu" }, { quoted: m })
    }

    let filter =
      /bass/.test(command) ? '-af "equalizer=f=94:width_type=o:width=2:g=30"' :
        /blown/.test(command) ? '-af "acrusher=.1:1:64:0:log"' :
          /deep/.test(command) ? '-af "atempo=1,asetrate=44500*2/3"' :
            /earrape/.test(command) ? '-af "volume=12"' :
              /fast/.test(command) ? '-filter:a "atempo=1.63,asetrate=44100"' :
                /fat/.test(command) ? '-filter:a "atempo=1.6,asetrate=22100"' :
                  /nightcore/.test(command) ? '-filter:a "atempo=1.06,asetrate=44100*1.25"' :
                    /reverse/.test(command) ? '-filter_complex "areverse"' :
                      /robot/.test(command) ? '-filter_complex "afftfilt=real=\'hypot(re,im)*sin(0)\':imag=\'hypot(re,im)*cos(0)\':win_size=512:overlap=0.75"' :
                        /slow/.test(command) ? '-filter:a "atempo=0.7,asetrate=44100"' :
                          /tupai|squirrel|chipmunk/.test(command) ? '-filter:a "atempo=0.5,asetrate=65100"' :
                            /smooth/.test(command) ? '-af "aresample=48000,asetrate=48000*1.02"' :
                              '-af "anull"'

    let inputFile = path.join(TMP_DIR, randomName(".mp3"))
    let outputFile = path.join(TMP_DIR, randomName(".mp3"))

    let buffer = await downloadMediaMessage(q, "buffer", {}, { logger: sock.logger })
    fs.writeFileSync(inputFile, buffer)

    exec(`ffmpeg -y -i "${inputFile}" ${filter} "${outputFile}"`, async (err, stdout, stderr) => {
      try {
        if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile)

        if (err) {
          console.error(stderr)
          return sock.sendMessage(m.chat, { text: "FFmpeg gagal memproses audio" }, { quoted: m })
        }

        let audioBuffer = fs.readFileSync(outputFile)

        await sock.sendMessage(
          m.chat,
          {
            audio: audioBuffer,
            mimetype: "audio/mpeg",
            ptt: false
          },
          { quoted: m }
        )

        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile)
      } catch (e) {
        console.error(e)
        await sock.sendMessage(m.chat, { text: "Terjadi error saat kirim audio" }, { quoted: m })
      }
    })
  } catch (e) {
    console.error(e)
    await sock.sendMessage(m.chat, { text: "Error memproses audio" }, { quoted: m })
  }
}

function randomName(ext) {
  return `${Math.floor(Math.random() * 100000)}${ext}`
}
