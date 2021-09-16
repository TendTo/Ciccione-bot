import { Command, CommandContext } from "../../deps.ts";
import { VoiceConnection } from "../voice/connection.ts";
import { PCMStream } from "../voice/ffmpeg.ts";
import ytsr from "https://deno.land/x/youtube_sr@v4.0.1-deno/mod.ts";
import { getInfo } from "https://deno.land/x/ytdl_core@0.0.1/mod.ts";

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
  name = "playold";
  async execute(ctx: CommandContext) {
    if (!ctx.guild) return;
    if (!VoiceConnection.isJoined(ctx.guild.id)) {
      return ctx.message.reply(
        "I have not even joined a Voice Channel here.",
      );
    }

    const conn = VoiceConnection.get(ctx.guild.id)!;
    if (!conn.ready) return ctx.message.reply("Connection not ready.");

    const search = await ytsr.searchOne(ctx.argString);
    if (!search || !search.id) return ctx.message.reply("Nothing found.");

    const info = await getInfo(search.id);
    const url = info.formats.find((e) => e.hasAudio && !e.hasVideo)!.url;

    const stream = new PCMStream(url);
    stream.pipeTo(conn.player.writable);

    ctx.message.reply("Playing now - !");
  }
}

export class PlayTestCommand extends Command {
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

    let path = "./data/sounds/See1.mp3";
    if (!ctx.argString.length) {
      path = "./data/sounds/See1.mp3";
    } else {
      const search = await ytsr.searchOne(ctx.argString);
      if (!search || !search.id) return ctx.message.reply("Nothing found.");

      const info = await getInfo(search.id);
      path = info.formats.find((e) => e.hasAudio && !e.hasVideo)!.url;
    }

    ctx.message.reply("Playing now!");
    conn.player.play(path);
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
