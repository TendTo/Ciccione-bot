import {
  ApplicationCommandInteraction,
  GuildTextChannel,
  slash,
  SlashModule,
} from "../../deps.ts";
import { garticPhone, rulesJester } from "../constants/constants.ts";
import { buildPoll, CodeManager } from "../util/util.ts";

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
  private readonly reactions = [
    "1️⃣",
    "2️⃣",
    "3️⃣",
    "4️⃣",
    "5️⃣",
    "6️⃣",
    "7️⃣",
    "8️⃣",
    "9️⃣",
  ];
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
  /**
   * /gartic_phone_sondaggio command.
   * Creates a poll to decide which mode of Gartic Phone to play.
   * @param i - The interaction object.
   */
  @slash()
  async gartic_phone_sondaggio(i: ApplicationCommandInteraction) {
    await i.defer();
    const channelId = i.option<string>("canale") || "884919191742865459";
    const garticChannel = await i.guild?.channels.get(channelId);

    if (!garticChannel || !garticChannel.isGuildText()) {
      i.reply("Non posso creare il sondaggio");
      return;
    }

    const poll = await garticChannel.send(garticPhone);
    if (!poll) {
      i.reply("Non posso creare il sondaggio");
      return;
    }

    await Promise.all(
      this.reactions.map(async (reaction) => {
        try {
          await poll.addReaction(reaction);
        } catch (e) {
          console.error(e);
        }
      }),
    );

    i.reply("Tutto fatto :white_check_mark:!", { ephemeral: true });
  }
  /**
   * /sondaggio command.
   * Creates new poll.
   * @param i - The interaction object.
   */
  @slash()
  async sondaggio(i: ApplicationCommandInteraction) {
    await i.defer();

    const options = [];
    for (let idx = 1; idx < 10; idx++) {
      const option = i.option<string>("op" + idx);
      if (option) {
        options.push(option);
      }
    }
    const channelId = i.option<string>("canale") || "446793262569619458";
    const channel = await i.guild?.channels.get(channelId);

    if (!channel || !channel.isGuildText()) {
      i.reply("Non ho trovato il canale");
      return;
    }

    const poll = await channel.send(
      buildPoll(i.option<string>("titolo"), options),
    );
    if (!poll) {
      i.reply("Non posso creare il sondaggio");
      return;
    }

    await Promise.all(
      options.map(async (_, i) => {
        try {
          await poll.addReaction(this.reactions[i]);
        } catch (e) {
          console.error(e);
        }
      }),
    );

    i.reply("Tutto fatto :white_check_mark:!", { ephemeral: true });
  }
}

export default GeneralSlashModule;
