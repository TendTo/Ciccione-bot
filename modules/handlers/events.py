from discord import Message
from discord.ext import commands

def add_events(bot: commands.Bot):

    @bot.event
    async def on_ready():
        print('Logged in as')
        print(bot.user.name)
        print(bot.user.id)
        print('------')

    @bot.event
    async def on_message(message: Message):
        if message.content.startswith("❌") and message.author.id == 235088799074484224:
            channel = message.channel
            await message.delete()
            await channel.send("❌ **You have to be _ciccione_ to use this command!**")
        await bot.process_commands(message)
