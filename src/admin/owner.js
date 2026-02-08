import { ban, isOwner, unBan } from "../plugins/fitur/ban.js"
import { editperpus, hapusperpus, setperpus } from "../plugins/fitur/perpus.js";
import { join } from "../plugins/owner/join.js";
import { setBos } from "../plugins/toram/bos.js";
import { handleBroadcast } from "./bc.js";
import { setNocoldown } from "./coldownChat.js";

export const ownerControls = async (sock, chatId, msg, text) => {
  if (text.startsWith(".ban")) {
    if (!isOwner(sock, msg, chatId)) return;
    ban(sock, chatId, msg);

  }
  if (text.startsWith(".unban")) {
    if (!isOwner(sock, msg, chatId)) return;
    unBan(sock, chatId, msg);
  }
  if (text === ".nocdgroup") {
    if (!isOwner(sock, msg, chatId)) return;
    await setNocoldown(sock, chatId, msg)
  }
  if (text.startsWith(".bc") || msg.message.imageMessage?.caption === "!bc") {
    if (!isOwner(sock, msg, chatId)) return;
    handleBroadcast(sock, msg);
  }
  if (text.startsWith(".setbos")) {
    if (!isOwner(sock, msg, chatId)) return;
    setBos(sock, chatId, msg, text);
  }
  if (text.startsWith(".setxtall")) {
    if (!isOwner(sock, msg, chatId)) return;
    setBos(sock, chatId, msg, text);
  }
  if (text.startsWith(".setbuku")) {
    if (!isOwner(sock, msg, chatId)) return;
    setperpus(sock, chatId, msg, text);
  }
  if (text.startsWith(".editbuku")) {
    if (!isOwner(sock, msg, chatId)) return;
    editperpus(sock, chatId, msg, text);
  }
  if (text.startsWith(".hapusbuku")) {
    if (!isOwner(sock, msg, chatId)) return;
    hapusperpus(sock, chatId, msg, text);
  }
  registerCommand({
    name: "join",
    alias: ["join"],
    category: "owner",
    desc: "untuk masuk grub",
    run: async (sock, chatId, msg) => {
      if (!isOwner(sock, msg, chatId)) return;
      join(sock, chatId, msg)
    }
  });
}
