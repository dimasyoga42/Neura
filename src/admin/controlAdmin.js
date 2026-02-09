import { registerCommand } from "../../setting.js";
import { isBan } from "../plugins/fitur/ban.js";
import { getUndangan } from "../plugins/owner/join.js";
import { setNews } from "../plugins/sosial/news.js";
import { setrules } from "../plugins/sosial/rules.js";
import { clearRaid, createRaid } from "../plugins/toram/raidControl.js";
import { hidetag } from "./hidetag.js";
import { SetWelcome } from "./wellcome.js";



export const Admincontrols = async (sock, chatId, msg, text) => {
  try {
    console.log(msg.key.participant)

    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const botId = "179573169848377@lid"
    console.log(botId)
    const isAdmin = admin.some(a => a.jid === msg.key.participant)
    const isBotadmin = admin.some(a => a.jid === botId)
    //cmd


  } catch (err) {
    console.log(err)
  }
}



export const adminValid = async (sock, chatId, msg,) => {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const isAdmin = admin.some(a => a.jid !== msg.key.participant)
    if (isAdmin) {
      sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg })
      return false
    }
    return true
  } catch (err) {
    console.log(err)
  }
}
export const botValid = async (sock, chatId, msg, text) => {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const botId = "179573169848377@lid"
    const isBotadmin = admin.some(a => a.jid !== botId)
    if (isBotadmin) {
      sock.sendMessage(chatId, { text: "bot tidak menjadi admin" }, { quoted: msg })
      return false
    }
    return true
  } catch (err) {
    sock.sendMessage(chatId, { text: "ada kesalahan dalam proses" }, { quoted: msg })
  }
}

registerCommand({
  name: "clear",
  alias: ["bubar"],
  category: "Menu admin",
  desc: "Untuk membubarkan party raid",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    clearRaid(sock, chatId, msg)
  }
})
registerCommand({
  name: "createraid",
  alias: ["createraid"],
  category: "Menu admin",
  desc: "membuat party raid",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    const element = args[1];
    const hadiah = args[2];
    if (!element || !hadiah) {
      return sock.sendMessage(
        chatId,
        { text: "Susunan cmd tidak sesuai\n> use !creatRaid <element> <hadiah>" },
        { quoted: msg }
      );
    }

    createRaid(sock, chatId, msg, text, element, hadiah);
  }
})

registerCommand({
  name: "setwc",
  alias: ["setwc"],
  category: "Menu admin",
  desc: "mengatur sambutan / wellcome grub",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    SetWelcome(sock, chatId, msg, text)
  }
})
registerCommand({
  name: "setwc",
  alias: ["setrules"],
  category: "Menu admin",
  desc: "mengatur rules",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    setrules(sock, chatId, msg, text)
  }
})
registerCommand({
  name: "close",
  alias: ["tutup"],
  category: "Menu admin",
  desc: "menutup grub",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    if (botValid(sock, chatId, msg, text)) return;
    await sock.groupSettingUpdate(chatId, 'announcement');
  }
})
registerCommand({
  name: "kick",
  alias: ["kick"],
  category: "Menu admin",
  desc: "kick member",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    if (botValid(sock, chatId, msg, text)) return;
    const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!mentions.length) return sock.sendMessage(chatId, { text: "tag target yang akan di kick" }, { quoted: msg });
    await sock.groupParticipantsUpdate(chatId, mentions, 'remove')
  }
})

registerCommand({
  name: "open",
  alias: ["buka"],
  category: "Menu admin",
  desc: "membuka  grub",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    if (botValid(sock, chatId, msg, text))
      await sock.groupSettingUpdate(chatId, 'not_announcement')
  }
})
registerCommand({
  name: "hidetag",
  alias: ["hidetag"],
  category: "Menu admin",
  desc: "Tag all Member",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    hidetag(sock, chatId, msg)
  }
})
registerCommand({
  name: "setnews",
  alias: ["setnews"],
  category: "Menu admin",
  desc: "menambahkan news",
  run: async (sock, chatId, msg, args, text) => {
    if (isBan(sock, chatId, msg)) return;
    if (adminValid(sock, chatId, msg)) return;
    setNews(sock, chatId, msg)
  }
})
