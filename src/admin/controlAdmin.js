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
    if (text.startsWith("!addnews")) {
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      sock.sendMessage(chatId, { text: "fitur addnews" }, { quoted: msg })
    }
    if (text === "!close") {
      if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak diberikan akses admin\njadikan bot sebagai admin grub untuk menggunakan cmd ini" }, { quoted: msg })
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      await sock.groupSettingUpdate(chatId, 'announcement');
    }
    if (text === "!open") {
      if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak diberikan akses admin\njadikan bot sebagai admin grub untuk menggunakan cmd ini" }, { quoted: msg })
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      await sock.groupSettingUpdate(chatId, 'not_announcement')
    }
    if (text.startsWith("!kick")) {
      if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak diberikan akses admin\njadikan bot sebagai admin grub untuk menggunakan cmd ini" }, { quoted: msg })
      if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg });
      const mentions = msg.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (!mentions.length) return sock.sendMessage(chatId, { text: "tag target yang akan di kick" }, { quoted: msg });
      await sock.groupParticipantsUpdate(chatId, mentions, 'remove')
    }
  } catch (err) {
    console.log(err)
  }
}

export const adminValid = async (sock, chatId, msg, text) => {
  try {
    const metadata = await sock.groupMetadata(chatId);
    const admin = metadata.participants
      .filter(p => p.admin)
      .map(p => ({
        jid: p.id,
        pn: p.pn,
        role: p.admin
      }));
    const isAdmin = admin.some(a => a.jid === msg.key.participant)
    if (!isAdmin) return sock.sendMessage(chatId, { text: "admin only" }, { quoted: msg })
    return
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
    const isBotadmin = admin.some(a => a.jid === botId)
    if (!isBotadmin) return sock.sendMessage(chatId, { text: "bot tidak menjadi admin" }, { quoted: msg })
    return
  } catch (err) {

  }
}
