import {
  ApplicationCommandInteraction,
  getInfo,
  slash,
  SlashModule,
  VoiceState,
  YouTube,
} from "../../deps.ts";
import { VoiceConnection } from "../voice/connection.ts";
import {
  isBotInVoiceChannel,
  isInGuild,
  isSubCommand,
  isUserInVoiceChannel,
} from "./slashModifiers.ts";

type cdsSound = "seee" | "ame" | "cht" | "demo" | "ess" | "spranga" | "war";

/**
 * Module containing all the Ciccione bot's slash command handlers related to audio.
 * It contains the following commands:
 * - /join
 * - /leave
 * - /play
 * - /pause
 * - /resume
 * - /skip
 * - /queue
 * - /nowplaying
 * - /cds audio
 */
class AudioSlashModule extends SlashModule {
  /**
   * Generate the complete url to the video.
   * @param id id of the youtube video
   * @returns complete url of the video
   */
  private getYoutubeLink(id: string) {
    return `https://www.youtube.com/watch?v=${id}`;
  }
  /**
   * Make sure all the preconditions are met before joining a voice channel.
   * @param i command interaction caused by the slash command
   * @param voiceState voice state used to join the channel. By default uses the bot's
   * @returns whether the channel was joined
   */
  private async joinChannel(
    i: ApplicationCommandInteraction,
    voiceState?: VoiceState,
  ): Promise<boolean> {
    if (!i.guild) {
      i.reply("Sei sicuro di essere in un server?");
      return false;
    }
    if (VoiceConnection.isJoined(i.guild.id)) {
      i.reply("Sono già nel canale");
      return false;
    }

    const vs = voiceState ?? await i.guild!.voiceStates.get(i.user.id);
    if (vs === undefined || vs === null || vs.channel === null) {
      i.reply("Non sei in un canale vocale");
      return false;
    }
    const joinData = await vs.channel.join({ deaf: true });
    const conn = new VoiceConnection(
      i.client.user!.id,
      joinData.guild.id,
      vs.channel.id,
      joinData.sessionID,
      {
        mode: "xsalsa20_poly1305",
      },
    );
    await conn.connect(joinData);
    return true;
  }
  /**
   * Convert the cds sound command into a file name and the maximum number of tracks.
   * @param command command to get the file name for
   * @returns name of the file and the number of tracks
   */
  private getCdsFile(command: cdsSound, track?: number): string {
    const trackToUse = (maxTrack: number) =>
      track
        ? Math.min(track, maxTrack)
        : Math.floor(Math.random() * maxTrack) + 1;
    switch (command) {
      case "ame":
        return `NonInteressa${trackToUse(2)}.mp3`;
      case "cht":
        return `cht${trackToUse(3)}.mp3`;
      case "demo":
        return `Demo${trackToUse(4)}.mp3`;
      case "ess":
        return `Estinguermi${trackToUse(1)}.mp3`;
      case "seee":
        return `See${trackToUse(10)}.mp3`;
      case "spranga":
        return `spranga${trackToUse(3)}.mp3`;
      case "war":
        return `warzonata${trackToUse(1)}.mp3`;
      default:
        throw new Error(`Unknown cds sound: ${command}`);
    }
  }
  /**
   * /join command.
   * Join the same voice channel as the user who called the command.
   * @param i - The interaction object.
   */
  @slash()
  @isUserInVoiceChannel("Devi essere in un canale vocale")
  async join(i: ApplicationCommandInteraction) {
    await i.defer();

    if (!await this.joinChannel(i)) {
      return;
    }
    i.reply("Ciao, sono qui!");
  }
  /**
   * /skip command.
   * Skip the current audio and goes to the next.
   * @param i - The interaction object.
   */
  @slash()
  @isInGuild("Sei sicuro di essere in un server?")
  @isBotInVoiceChannel("Non sono in nessun canale")
  async skip(i: ApplicationCommandInteraction) {
    await i.defer();

    const conn = VoiceConnection.get(i.guild!.id);
    const nextSong = await conn.skip();

    let reply = `:fast_forward: Andiamo alla prossima!\n`;
    if (nextSong) reply += `:notes: In riproduzione: \`${nextSong}\``;
    i.reply(reply);
  }
  /**
   * /pause command.
   * Payse the audio player.
   * @param i - The interaction object.
   */
  @slash()
  @isInGuild("Sei sicuro di essere in un server?")
  @isBotInVoiceChannel("Non sono in nessun canale")
  pause(i: ApplicationCommandInteraction) {
    const conn = VoiceConnection.get(i.guild!.id);
    conn.pause();
    i.reply(":pause_button: Pausa!");
  }
  /**
   * /pause command.
   * Payse the audio player.
   * @param i - The interaction object.
   */
  @slash()
  @isInGuild("Sei sicuro di essere in un server?")
  @isBotInVoiceChannel("Non sono in nessun canale")
  resume(i: ApplicationCommandInteraction) {
    const conn = VoiceConnection.get(i.guild!.id);
    conn.resume();
    i.reply(":arrow_forward: Riprendo!");
  }
  /**
   * /leave command.
   * Leave the voice channel.
   * @param i - The interaction object.
   */
  @slash()
  @isInGuild("Sei sicuro di essere in un server?")
  @isBotInVoiceChannel("Non sono in nessun canale")
  async leave(i: ApplicationCommandInteraction): Promise<void> {
    await i.defer();

    const conn = VoiceConnection.get(i.guild!.id);
    conn.disconnect();

    const vs = await i.guild!.voiceStates.get(i.client.user!.id);
    if (vs) {
      await vs.channel?.leave();
    }
    i.reply("Adios!");
  }
  /**
   * /play command.
   * Start a song in the same voice channel as the user who called the command.
   * @param i - The interaction object.
   */
  @slash()
  @isInGuild("Sei sicuro di essere in un server?")
  async play(i: ApplicationCommandInteraction) {
    const search = i.option<string>("ricerca");

    await i.defer();

    if (!VoiceConnection.isJoined(i.guild!.id)) {
      if (!await this.joinChannel(i)) {
        return;
      }
    }

    const searchResult = await YouTube.searchOne(search);
    if (!searchResult || !searchResult.id) {
      i.reply("Non ho trovato nulla");
      return;
    }
    const conn = VoiceConnection.get(i.guild!.id);
    const info = await getInfo(searchResult.id);
    const songPath = info.formats.find((e) => e.hasAudio && !e.hasVideo)!.url;
    const audio = {
      path: songPath,
      duration: searchResult.duration,
      title: searchResult.title ?? "Sconosciuto",
      link: `https://www.youtube.com/watch?v=${searchResult.id}`,
    };
    const isPlayng = conn.addToQueue(audio);
    i.reply(
      `:mag_right: **Ricerca:** \`${search}\`\n` +
        `":notes: **${
          isPlayng ? "In riproduzione" : "Aggiunto alla coda"
        }:** \`${audio.title}\` ${audio.link} - ${searchResult.durationFormatted}`,
    );
  }

  /**
   * /cds command group.
   * Listen to the best CDS has to offer.
   * @param i - The interaction object.
   */
  @slash()
  @isInGuild("Sei sicuro di essere in un server?")
  @isSubCommand("audio", "Devi aggiungere il sottocomando audio")
  async cds(i: ApplicationCommandInteraction) {
    const track = i.option<number>("traccia");

    await i.defer();

    if (!VoiceConnection.isJoined(i.guild!.id)) {
      if (!await this.joinChannel(i)) {
        return;
      }
    }

    const conn = VoiceConnection.get(i.guild!.id);

    const fileName = this.getCdsFile(i.subCommand as cdsSound, track);
    const audio = {
      path: `./data/sounds/${fileName}`,
      duration: 5,
      title: fileName.slice(0, -4),
    };
    const isPlayng = conn.addToQueue(audio);
    i.reply(
      `:microphone: **Comando:** \`${i.subCommand}\`\n` +
        `":notes: **${
          isPlayng ? "In riproduzione" : "Aggiunto alla coda"
        }:** \`${audio.title}\``,
    );
  }
}

export default AudioSlashModule;
