import {
  ApplicationCommandInteraction,
  InteractionResponse,
  InteractionResponseType,
  slash,
  SlashModule,
} from "../../deps.ts";
import { rulesJester } from "../constants/constants.ts";

/**
 * Module containing all the slash command handlers.
 */
class CiccioneSlashModule extends SlashModule {

  /**
   * /tendinfame command.
   * Say "Tend Infame".
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  tendinfame(i: ApplicationCommandInteraction) {
    const res: InteractionResponse = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      content: "Tend Infame",
      tts: true,
    };
    i.respond(res);
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
      i.respond({
        content: "I valori devono essere numeri interi",
      });
      return;
    }

    const rolls = Array(nDice).fill(0).map((_) =>
      Math.floor(Math.random() * diceType) + 1
    );

    const res: InteractionResponse = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      content: `${nDice}d${diceType}  =>  [${rolls.join(", ")}]  =>  ${
        rolls.reduce((a, b) => a + b, 0)
      }`,
    };
    i.respond(res);
  }

  /**
   * /flip command.
   * Flip a coin and show the result.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  flip(i: ApplicationCommandInteraction) {
    const res: InteractionResponse = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      content: Math.random() > 0.5 ? ":coin: Testa" : ":coin: Croce",
    };
    i.respond(res);
  }

  /**
   * /jester command.
   * Starts the jester mode.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  jester(i: ApplicationCommandInteraction) {
    const res: InteractionResponse = {
      type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE,
      content: "TODO",
    };
    i.respond(res);
  }

  /**
   * /rules_jester command.
   * Show the rules of the jester mode.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  rules_jester(i: ApplicationCommandInteraction) {
    const res: InteractionResponse = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      content: rulesJester,
    };
    i.respond(res);
  }

  /**
   * /ciccione command.
   * Remind the user that he is indeed very ciccione.
   * @param {ApplicationCommandInteraction} i - The interaction object.
   */
  @slash()
  ciccione(i: ApplicationCommandInteraction) {
    const res: InteractionResponse = {
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      content: `${i.user.username} è ciccione!`,
      tts: true,
    };
    i.respond(res);
  }
}

export default CiccioneSlashModule;