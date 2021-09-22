import {
  ApplicationCommandInteraction,
  GuildTextChannel,
  slash,
  SlashModule,
} from "../../deps.ts";
import { rulesJester } from "../constants/constants.ts";
import { CodeManager } from "../util/util.ts";

/**
 * Module containing all the generic Ciccione bot's slash command handlers.
 * It contains the following commands:
 * - /tendifame
 * - /roll
 * - /flip
 * - /rules_jester
 * - /ciccione
 */
class GeneralSlashModule extends SlashModule {
  /**
   * /tendinfame command.
   * Say "Tend Infame".
   * @param i - The interaction object.
   */
  @slash()
  tendinfame(i: ApplicationCommandInteraction) {
    i.reply("Tend Infame", { tts: true });
  }
  /**
   * /roll command.
   * Roll the dice with diceType faces nDice times and show the result.
   * @param i - The interaction object.
   */
  @slash()
  roll(i: ApplicationCommandInteraction) {
    const nDice = i.option<number>("n_dadi");
    const diceType = i.option<number>("n_facce");

    // Check input types
    if (!Number.isInteger(nDice) || !Number.isInteger(diceType)) {
      return i.reply("I valori devono essere numeri interi");
    }

    const rolls = Array(nDice).fill(0).map((_) =>
      Math.floor(Math.random() * diceType) + 1
    );

    i.reply(
      `:game_die: ${nDice}d${diceType}  =>  [${rolls.join(", ")}]  =>  ${
        rolls.reduce((a, b) => a + b, 0)
      }`,
    );
  }
  /**
   * /flip command.
   * Flip a coin and show the result.
   * @param i - The interaction object.
   */
  @slash()
  flip(i: ApplicationCommandInteraction) {
    i.reply(Math.random() > 0.5 ? ":coin: Testa" : ":coin: Croce");
  }

  /**
   * /jester command.
   * Starts the jester mode.
   * @param i - The interaction object.
   */
  @slash()
  jester(i: ApplicationCommandInteraction) {
    i.reply("Jester mode is not implemented yet");
  }

  /**
   * /rules_jester command.
   * Show the rules of the jester mode.
   * @param i - The interaction object.
   */
  @slash()
  rules_jester(i: ApplicationCommandInteraction) {
    i.reply(rulesJester);
  }

  /**
   * /ciccione command.
   * Remind the user that he is indeed very ciccione.
   * @param i - The interaction object.
   */
  @slash()
  ciccione(i: ApplicationCommandInteraction) {
    i.reply(`${i.user.username} è ciccione!`, { tts: true });
  }
  /**
   * /clean command.
   * Clean all the messages related to the bot.
   * @param i - The interaction object.
   */
  @slash()
  async clean(i: ApplicationCommandInteraction) {
    if (!(i.channel instanceof GuildTextChannel)) {
      i.reply("Sei sicuro di essere in un canale?");
      return;
    }

    const messages = (await i.channel.fetchMessages())
      .filter((msg) =>
        msg.author.id === i.client.user!.id &&
        msg.timestamp.getTime() > Date.now() - 1000 * 60 * 60 * 24 * 14
      ).map((msg) => msg);

    if (messages.length > 1) {
      await i.channel.bulkDelete(messages);
    } else if (messages.length === 1) {
      await messages[0].delete();
    }

    i.reply("Messaggi cancellati!", { ephemeral: true });
  }

  /**
   * /code command.
   * Store the code provided, and then show it with tts.
   * @param i - The interaction object.
   */
  // @isInGuild()
  @slash()
  code(i: ApplicationCommandInteraction) {
    const code = i.option<string>("codice");

    if (code) {
      CodeManager.storeCode(i.guild!.id, code);
      i.reply(code, { tts: true });
    } else {
      i.reply(CodeManager.getCode(i.guild!.id), { tts: true });
    }
  }
}

export default GeneralSlashModule;
