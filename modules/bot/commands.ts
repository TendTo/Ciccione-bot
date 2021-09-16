import { Command, CommandContext } from "../../deps.ts";
import { VoiceConnection } from "../voice/connection.ts";
import { PCMStream } from "../voice/ffmpeg.ts";

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

export class JoinCommand extends Command {
  name = "join";
  async execute(ctx: CommandContext) {
    if (!ctx.guild) return;
    if (VoiceConnection.isJoined(ctx.guild.id)) {
      return ctx.message.reply("I've already joined VC.");
    }

    const vs = await ctx.guild.voiceStates.get(ctx.author.id);
    if (!vs || !vs.channel) {
      return ctx.message.reply("You're not in a Voice Channel.");
    }

    const data = await vs.channel.join({ deaf: true });

    const conn = new VoiceConnection(
      ctx.client.user!.id,
      data.guild.id,
      vs.channel.id,
      data.sessionID,
      {
        mode: "xsalsa20_poly1305",
        // receive: "opus",
      },
    );

    conn.connect(data);

    ctx.message.reply("Joined Voice Channel!");
  }
}

export class PlayCommand extends Command {
  name = "play";
  async execute(ctx: CommandContext) {
    if (!ctx.guild) return;
    if (!VoiceConnection.isJoined(ctx.guild.id)) {
      return ctx.message.reply(
        "I have not even joined a Voice Channel here.",
      );
    }

    const conn = VoiceConnection.get(ctx.guild.id)!;
    if (!conn.ready) return ctx.message.reply("Connection not ready.");

    // const search = await ytsr.searchOne(ctx.argString);
    // if (!search || !search.id) return ctx.message.reply("Nothing found.");

    // const info = await getInfo(search.id);
    // const url = info.formats.find((e) => e.hasAudio && !e.hasVideo)!.url;
    ctx.message.reply("Playing now!");

    const stream = new PCMStream("./data/sounds/See1.mp3");
    await stream.pipeTo(conn.player.writable);
  }
}

export class LeaveCommand extends Command {
  name = "leave";
  async execute(ctx: CommandContext) {
    if (!ctx.guild) return;
    if (!VoiceConnection.isJoined(ctx.guild.id)) {
      return ctx.message.reply(
        "I have not even joined a Voice Channel here.",
      );
    }

    const conn = VoiceConnection.get(ctx.guild.id);
    conn?.close();

    const vs = await ctx.guild.voiceStates.get(ctx.client.user!.id);
    if (vs) {
      await vs.channel?.leave();
    }

    ctx.message.reply("Left voice channel.");
  }
}
