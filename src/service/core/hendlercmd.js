import { commands } from "../core/commandhendler.js";

const prefix = ".";

export const handleMessage = async (ctx, chatId, msg) => {
  const body =
    msg.message?.conversation || msg.message?.extendedTextMessage?.text || "";

  if (!body.startsWith(prefix)) return;

  const args = body.slice(prefix.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(ctx, chatId, msg, args);
  } catch (err) {
    console.error(err);
  }
};
