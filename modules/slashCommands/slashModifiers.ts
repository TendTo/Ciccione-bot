import {
  ApplicationCommandInteraction,
  GatewayIntents,
  SlashModule,
} from "../../deps.ts";
import { VoiceConnection } from "../voice/connection.ts";

type ApplicationCommandHandlerCallback = (
  i: ApplicationCommandInteraction,
  // deno-lint-ignore no-explicit-any
) => any;

type CommandValidationCondition = (
  i: ApplicationCommandInteraction,
) => boolean | Promise<boolean>;

interface CommandValidation {
  condition: CommandValidationCondition;
  action?: string | ApplicationCommandHandlerCallback;
}

/**
 * Wraps the command handler with a validation function.
 * @param desc property descriptor
 * @param validation validation function and action to show or call if validation fails
 * @returns wrapped function
 */
function wrapConditionApplicationCommandHandler(
  desc: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  validation: CommandValidation,
) {
  if (typeof desc.value !== "function") {
    throw new Error("The decorator requires a function");
  }
  const { condition, action } = validation;

  const original = desc.value;
  return async function (
    this: SlashModule,
    i: ApplicationCommandInteraction,
  ) {
    if (!(await condition(i))) {
      // condition not met
      if (typeof action === "string") {
        i.reply(action);
      } else if (typeof action === "function") {
        action(i);
      }
      return;
    } // condition met
    return original.call(this, i);
  };
}

/**
 * Make sure the command is called in a guild.
 * @param action message or function called when the condition is not met
 * @returns wrapped function
 */
export function isInGuild(action?: string | (() => void)) {
  return function (
    _target: SlashModule,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  ) {
    descriptor.value = wrapConditionApplicationCommandHandler(descriptor, {
      condition: (i) => Boolean(i.guild),
      action,
    });
  };
}

/**
 * Make sure the command is called in a text channel.
 * @param action message or function called when the condition is not met
 * @returns wrapped function
 */
export function isInTextChannel(action?: string | (() => void)) {
  return function (
    _target: SlashModule,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  ) {
    descriptor.value = wrapConditionApplicationCommandHandler(descriptor, {
      condition: (i) => Boolean(i.channel && i.channel.isText()),
      action,
    });
  };
}
/**
 * Make sure the command is called in a guild text channel.
 * @param action message or function called when the condition is not met
 * @returns wrapped function
 */
export function isInGuildTextChannel(action?: string | (() => void)) {
  return function (
    _target: SlashModule,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  ) {
    descriptor.value = wrapConditionApplicationCommandHandler(descriptor, {
      condition: (i) => Boolean(i.channel && i.channel.isGuildText()),
      action,
    });
  };
}

/**
 * The command can only be called if the bot is currently in a voice channel.
 * `GatewayIntents.GUILD_VOICE_STATES` needs to be set.
 * @param action message or function called when the condition is not met
 * @returns wrapped function
 */
export function isBotInVoiceChannel(action?: string | (() => void)) {
  return function (
    _target: SlashModule,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  ) {
    descriptor.value = wrapConditionApplicationCommandHandler(descriptor, {
      condition: async (i: ApplicationCommandInteraction) => {
        if (
          !i.client.intents ||
          !i.client.intents?.includes(GatewayIntents.GUILD_VOICE_STATES)
        ) {
          const err =
            "@isBotInVoiceChannel: GatewayIntents.GUILD_VOICE_STATES needs to be set.";
          console.error(err);
          throw new Error(err);
        }
        return Boolean(await i.guild?.voiceStates.get(i.client.user!.id));
      },
      action,
    });
  };
}

/**
 * The command can only be called if the user is currently in a voice channel.
 * `GatewayIntents.GUILD_VOICE_STATES` needs to be set.
 * @param action message or function called when the condition is not met
 * @returns wrapped function
 */
export function isUserInVoiceChannel(
  action: string | ApplicationCommandHandlerCallback,
) {
  return function (
    _client: SlashModule,
    _prop: string,
    desc: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  ) {
    const validation: CommandValidation = {
      condition: async (i: ApplicationCommandInteraction): Promise<boolean> => {
        if (!i.client.intents?.includes(GatewayIntents.GUILD_VOICE_STATES)) {
          const err =
            "@isUserInVoiceChannel: GatewayIntents.GUILD_VOICE_STATES needs to be set.";
          console.error(err);
          throw new Error(err);
        }
        return Boolean(await i.guild?.voiceStates.get(i.user.id));
      },
      action,
    };
    desc.value = wrapConditionApplicationCommandHandler(desc, validation);
  };
}

/**
 * Make sure the bot is already in a voice channel.
 * @param action message or function called when the condition is not met
 * @returns wrapped function
 */
export function isSubCommand(
  subGroup: string,
  action?: string | (() => void),
) {
  return function (
    _target: SlashModule,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<ApplicationCommandHandlerCallback>,
  ) {
    descriptor.value = wrapConditionApplicationCommandHandler(descriptor, {
      condition: (i) => Boolean(i.subCommandGroup === subGroup && i.subCommand),
      action,
    });
  };
}
