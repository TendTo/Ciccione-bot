import {
  ApplicationCommandInteraction,
  InteractionResponse,
  InteractionResponseType,
  slash,
  SlashModule,
} from "../../deps.ts";
import { rulesJester } from "../constants/constants.ts";
import { VoiceConnection } from "../voice/connection.ts";

class ExtSlashModule extends SlashModule {
  /**
   * Utility function to send the response to a slash command.
   * @param i command interaction spawnd by a slash command
   * @param content text content of the reply to the slash command
   * @param tts enable text-to-speech
   * @param type type of response
   */
  sendResponse(
    i: ApplicationCommandInteraction,
    content?: string,
    tts?: boolean,
    type: InteractionResponseType =
      InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
  ) {
    const res: InteractionResponse = {
      type,
      content,
      tts,
    };
    i.respond(res);
  }
}

/**
 * Module containing all the Ciccione bot's slash command handlers.
 */
class CiccioneSlashModule extends ExtSlashModule {
  /**
   * /tendinfame command.
   * Say "Tend Infame".
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  tendinfame(i: ApplicationCommandInteraction) {
    this.sendResponse(i, "Tend Infame", true);
  }

  /**
   * /roll command.
   * Roll the dice with diceType faces nDice times and show the result.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  roll(i: ApplicationCommandInteraction) {
    const nDice = i.option<number>("n_dadi");
    const diceType = i.option<number>("n_facce");

    // Check input types
    if (!Number.isInteger(nDice) || !Number.isInteger(diceType)) {
      return this.sendResponse(i, "I valori devono essere numeri interi");
    }

    const rolls = Array(nDice).fill(0).map((_) =>
      Math.floor(Math.random() * diceType) + 1
    );

    this.sendResponse(
      i,
      `${nDice}d${diceType}  =>  [${rolls.join(", ")}]  =>  ${
        rolls.reduce((a, b) => a + b, 0)
      }`,
    );
  }

  /**
   * /flip command.
   * Flip a coin and show the result.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  flip(i: ApplicationCommandInteraction) {
    this.sendResponse(i, Math.random() > 0.5 ? ":coin: Testa" : ":coin: Croce");
  }

  /**
   * /jester command.
   * Starts the jester mode.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  jester(i: ApplicationCommandInteraction) {
    this.sendResponse(i, "Jester mode is not implemented yet");
  }

  /**
   * /rules_jester command.
   * Show the rules of the jester mode.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  rules_jester(i: ApplicationCommandInteraction) {
    this.sendResponse(i, rulesJester);
  }

  /**
   * /ciccione command.
   * Remind the user that he is indeed very ciccione.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  ciccione(i: ApplicationCommandInteraction) {
    this.sendResponse(i, `${i.user.username} è ciccione!`);
  }

  /**
   * /join command.
   * Join the same voice channel as the user who called the command.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  async join(i: ApplicationCommandInteraction) {
    if (!i.guild) {
      return this.sendResponse(i, "Sei sicuro di essere in un server?");
    }
    if (VoiceConnection.isJoined(i.client.user!.id)) {
      return this.sendResponse(i, "Sono già nel canale");
    }

    const voiceState = await i.guild!.voiceStates.get(i.user.id);
    if (voiceState === undefined || voiceState === null || voiceState.channel === null) {
      return this.sendResponse(i, "Joina un canale prim");
    }

    const data = await voiceState.channel.join({ deaf: true });
    const conn = new VoiceConnection(
      i.client.user!.id,
      data.guild.id,
      voiceState.channel.id,
      data.sessionID,
      {
        mode: "xsalsa20_poly1305",
        // receive: "opus",
      },
    );
    conn.connect(data);
  
    this.sendResponse(i, "Ciao, sono qui!");
  }
}

export default CiccioneSlashModule;
