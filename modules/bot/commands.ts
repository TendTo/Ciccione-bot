import { Command, CommandContext } from "../../deps.ts";

export class CleanCommand extends Command {
  name = "clean";
  async execute(ctx: CommandContext) {
    const messages = await ctx.channel.fetchMessages();
    messages
      .filter((msg) =>
        msg.content.startsWith("?") || msg.author.id === "767524102537216001"
      )
      .forEach((msg) => msg.delete());
  }
}

export class SeeeCommand extends Command {
  name = "seee";
  async execute(ctx: CommandContext) {
    let voiceChannel;
    try {
      voiceChannel = (await ctx.guild?.voiceStates.get(ctx.author.id))
        ?.channel;
    } catch (e) {
      console.error(e);
      ctx.message.reply("Mistakes");
      return;
    }

    if (voiceChannel === undefined || voiceChannel === null) {
      ctx.message.reply("You are not in a voice channel.");
      return;
    }
    await voiceChannel.join();
  }
}
