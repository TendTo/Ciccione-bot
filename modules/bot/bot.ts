import { CommandClient, CommandClientOptions, event } from "../../deps.ts";
import commands from "../slashCommands/slashCommandDefinition.ts";
import GeneralSlashModule from "../slashCommands/generalCommands.ts";
import AudioSlashModule from "../slashCommands/audioCommands.ts";

/**
 * Ciccione bot
 */
export default class CiccioneBot extends CommandClient {
  guildIds: string[];

  constructor(options: CommandClientOptions) {
    super(options);
    this.interactions.commands.slash.loadModule(new GeneralSlashModule());
    this.interactions.commands.slash.loadModule(new AudioSlashModule());
    this.guildIds = Deno.env.get("GUILD_IDS")?.split(",") ||
      ["686241829624086681"];
  }

  /**
   * Creates the commands globally or only for the provided guild
   * @param guildID server where to create the commands in
   */
  async createCommands(guildID?: string) {
    return await Promise.all(
      commands.map(async (command) => {
        try {
          await this.interactions.commands.create(command, guildID);
          console.log(`Created CMD ${command.name}!`);
        } catch (e) {
          console.error(`Error creating CMD ${command.name}!\n${e}`);
        }
      }),
    );
  }

  /**
   * Deletes all the commands or only the ones in the provided guild
   * @param guildID server to delete commands from
   * @returns list of commands successfully deleted
   */
  async deleteCommands(guildID?: string) {
    const commands = guildID
      ? await this.interactions.commands.guild(guildID)
      : await this.interactions.commands.all();
    return Promise.all(
      commands.map(async (command) => {
        try {
          await this.interactions.commands.delete(command.id, guildID);
          console.log(`Deleted CMD ${command.name}!`);
        } catch (e) {
          console.error(`Error deleted CMD ${command.name}!\n${e}`);
        }
      }),
    );
  }

  /**
   *  Starting function called when the bot has successfully connected to Discord.
   *  Initialize the command slash suggestions.
   */
  @event()
  async ready() {
    console.log("CiccioneBot is ready!");
    for (const id of this.guildIds) {
      // await this.deleteCommands(id);
      await this.createCommands(id);
    }
  }
}
