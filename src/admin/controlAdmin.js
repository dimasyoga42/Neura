import { registerCommand } from "../../setting.js";
import { isBan } from "../plugins/fitur/ban.js";
import { getUndangan } from "../plugins/owner/join.js";
import { setNews } from "../plugins/sosial/news.js";
import { setrules } from "../plugins/sosial/rules.js";
import { clearRaid, createRaid } from "../plugins/toram/raidControl.js";
import { hidetag } from "./hidetag.js";
import { SetWelcome } from "./wellcome.js";

const BOT_ID = "179573169848377@lid";

// ================= VALID ADMIN =================
export const adminValid = async (sock, chatId, msg) => {
  try {
    if (!chatId.endsWith("@g.us")) {
      await sock.sendMessage(chatId, { text: "khusus grup" }, { quoted: msg });
      return false;
    }

    const metadata = await sock.groupMetadata(chatId);
    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id);

    const sender = msg.key.participant || msg.key.remoteJid;

    if (!admins.includes(sender)) {
      await sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      return false;
    }

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

// ================= VALID BOT ADMIN =================
export const botValid = async (sock, chatId, msg) => {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const admins = metadata.participants
      .filter(p => p.admin)
      .map(p => p.id);

    if (!admins.includes(BOT_ID)) {
      await sock.sendMessage(chatId, { text: "bot tidak menjadi admin" }, { quoted: msg });
      return false;
    }

    return true;
  } catch (err) {
    console.log(err);
    return false;
  }
};

// ================= CLEAR RAID =================
registerCommand({
  name: "clear",
  alias: ["bubar"],
  category: "Menu admin",
  desc: "Untuk membubarkan party raid",
  run: async (sock, chatId, msg) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    clearRaid(sock, chatId, msg);
  }
});

// ================= CREATE RAID =================
registerCommand({
  name: "createraid",
  alias: ["createraid"],
  category: "Menu admin",
  desc: "membuat party raid",
  run: async (sock, chatId, msg, args, text) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    const arg = text.split(" ")
    const element = arg[1];
    const hadiah = arg[2];

    if (!element || !hadiah) {
      return sock.sendMessage(
        chatId,
        { text: "Susunan cmd tidak sesuai\n> use !creatRaid <element> <hadiah>" },
        { quoted: msg }
      );
    }

    createRaid(sock, chatId, msg, text, element, hadiah);
  }
});

// ================= SET WELCOME =================
registerCommand({
  name: "setwc",
  alias: ["setwc"],
  category: "Menu admin",
  desc: "mengatur sambutan grub",
  run: async (sock, chatId, msg, args, text) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    SetWelcome(sock, chatId, msg, text);
  }
});

// ================= SET RULES =================
registerCommand({
  name: "setrules",
  alias: ["setrules"],
  category: "Menu admin",
  desc: "mengatur rules",
  run: async (sock, chatId, msg, args, text) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    setrules(sock, chatId, msg, text);
  }
});

// ================= CLOSE GROUP =================
registerCommand({
  name: "close",
  alias: ["tutup"],
  category: "Menu admin",
  desc: "menutup grub",
  run: async (sock, chatId, msg) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    if (!(await botValid(sock, chatId, msg))) return;

    await sock.groupSettingUpdate(chatId, "announcement");
  }
});

// ================= OPEN GROUP =================
registerCommand({
  name: "open",
  alias: ["buka"],
  category: "Menu admin",
  desc: "membuka grub",
  run: async (sock, chatId, msg) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    if (!(await botValid(sock, chatId, msg))) return;

    await sock.groupSettingUpdate(chatId, "not_announcement");
  }
});

// ================= KICK =================
registerCommand({
  name: "kick",
  alias: ["kick"],
  category: "Menu admin",
  desc: "kick member",
  run: async (sock, chatId, msg) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    if (!(await botValid(sock, chatId, msg))) return;

    const mentions = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];

    if (!mentions.length) {
      return sock.sendMessage(chatId, { text: "tag target yang akan di kick" }, { quoted: msg });
    }

    await sock.groupParticipantsUpdate(chatId, mentions, "remove");
  }
});

// ================= HIDETAG =================
registerCommand({
  name: "hidetag",
  alias: ["hidetag"],
  category: "Menu admin",
  desc: "Tag all Member",
  run: async (sock, chatId, msg, args, text) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    hidetag(sock, chatId, msg, text);
  }
});

// ================= SET NEWS =================
registerCommand({
  name: "setnews",
  alias: ["setnews"],
  category: "Menu admin",
  desc: "menambahkan news",
  run: async (sock, chatId, msg, args, text) => {
    if (await isBan(sock, chatId, msg)) return;
    if (!(await adminValid(sock, chatId, msg))) return;
    setNews(sock, chatId, msg, text);
  }
});
