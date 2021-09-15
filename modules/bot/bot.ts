import { CommandClient, CommandClientOptions, event } from "../../deps.ts";
import commands from "./slashCommandDefinition.ts";
import CiccioneSlashModule from "./slashCommand.ts";
import { CleanCommand, SeeeCommand } from "./commands.ts";

/**
 * Ciccione bot
 */
export default class CiccioneBot extends CommandClient {
  constructor(options: CommandClientOptions) {
    super(options);
    this.interactions.commands.slash.loadModule(new CiccioneSlashModule());
    this.commands.add(CleanCommand);
    this.commands.add(SeeeCommand);
  }

  /**
   *  Starting function called when the bot has successfully connected to Discord.
   *  Initialize the command slash suggestions.
   */
  @event()
  ready() {
    console.log("CiccioneBot is ready!");
    commands.forEach(async (command) => {
      try {
        await this.interactions.commands.create(command);
        console.log(`Created CMD ${command.name}!`);
      } catch (e) {
        console.error(e);
        console.error(`Error creating CMD ${command.name}!`);
      }
    });
  }
}
