import makeWASocket, {
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
  DisconnectReason,
} from "@whiskeysockets/baileys";
import qrcode from "qrcode-terminal";
import { Admincontrols } from "./src/admin/controlAdmin.js";
import dotenv from "dotenv";
import { ownerControls } from "./src/admin/owner.js";
import { cmdMenucontrol } from "./src/modul/cmdControls.js";
import { checkMentionAfk, checkUnAfk } from "./src/plugins/sosial/afk.js";
import { CekColdown } from "./src/admin/coldownChat.js";
import { HandleWelcome, outGC } from "./src/admin/wellcome.js";
import { messageHandler } from "./src/plugins/ai/message.js";
import { subMenu } from "./src/modul/subMenu.js";
import { jawab } from "./src/plugins/fun/caklontong.js";
import { commands } from "./setting.js";
import smsg from "./proto.js";
import { decodeJid } from "./src/config/dcode.js";
dotenv.config();
const start = async () => {
  const { state, saveCreds } = await useMultiFileAuthState("./auth_save");
  const { version } = await fetchLatestBaileysVersion();
  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false
  });
  sock.decodeJid = decodeJid
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", ({ connection, lastDisconnect, qr }) => {
    try {
      if (qr) {
        qrcode.generate(qr, { small: true });
        console.log("Scan QR untuk login WhatsApp");
      }

      if (connection === "close") {
        const reason = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;

        console.log("Koneksi terputus.");
        console.log("Reconnect?", shouldReconnect);

        if (shouldReconnect) {
          console.log("Reconnect dalam 5 detik...");
          setTimeout(start, 5000);
        } else {
          console.log(" Logout permanen. Hapus folder auth_save untuk login ulang.");
        }
      }

      if (connection === "open") {
        console.log(" Bot WhatsApp berhasil terhubung!");
      }
    } catch (err) {
      console.error("Error:", err);
      setTimeout(start, 5000);
    }
  });
  sock.ev.on('group-participants.update', async (update) => {
    await HandleWelcome(sock, update)
    await outGC(sock, update)
  })
  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = smsg(sock, messages[0])

    try {
      const chatId = msg.key.remoteJid;
      const text = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      //if (!chatId?.endsWith("@g.us")) return;
      messageHandler(sock, chatId, msg);
      checkMentionAfk(sock, chatId, msg)
      checkUnAfk(sock, chatId, msg);
      Admincontrols(sock, chatId, msg, text);
      ownerControls(sock, chatId, msg, text);
      cmdMenucontrol(sock, chatId, msg, text);
      jawab(sock, chatId, msg)
      subMenu(sock, chatId, msg, text);

      const body = msg.message.conversation || msg.message.extendedTextMessage?.text || "";
      const prefix = ".";

      if (body.startsWith(prefix)) {
        const args = body.slice(prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Mencari command di Map
        const command = commands.get(commandName);
        if (command) {
          try {
            // pastikan args & text aman
            const safeArgs = Array.isArray(args) ? args : [];
            const safeText = typeof text === "string"
              ? text
              : safeArgs.join(" "); // fallback dari args

            await command.run(
              sock,
              msg.key.remoteJid,
              msg,
              safeArgs,
              safeText
            );

          } catch (error) {
            console.error(`Error eksekusi [${commandName}]:`, error);
            await sock.sendMessage(msg.key.remoteJid, {
              text: "Gagal menjalankan perintah."
            });
          }
        }

      }

    } catch (err) {
      console.log(err)
    }
  })
};

start();
