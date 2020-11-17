""" This example requires the 'members' privileged intents """
import discord
from discord.ext import commands
from modules.handlers.commands import add_commands
from modules.handlers.events import add_events

def main():
    """Main"""
    intents = discord.Intents.default()
    intents.members = True
    with open("config/token.conf") as token_f:
        token = token_f.readline()
    bot = commands.Bot(command_prefix='?')

    add_events(bot)
    add_commands(bot)

    bot.run(token)


if __name__ == "__main__":
    main()
