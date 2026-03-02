export default {
  name: "ping",
  aliases: ["p"],
  description: "checking response bot",
  category: "utility",

  ownerOnly: false,
  groupOnly: false,
  cooldown: 2,

  async execute(ctx, chatId, msg) {
    await ctx.sendMessage(chatId, { text: "pong" }, { quoted: msg });
  },
};
