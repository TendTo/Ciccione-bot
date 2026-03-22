#!/bin/env python3
import asyncio
import math
import os
import discord
from discord.ext import commands
import sys
import yt_dlp as youtube_dl
from dotenv import load_dotenv
import re
from typing import Literal
from sources import YTDLSource
from song import SongManager

# Silence useless bug reports messages
youtube_dl.utils.bug_reports_message = lambda: ""


class SongManagers:
    def __init__(self):
        self._song_managers: dict[int, SongManager] = {}

    def get(self, ctx: "commands.Context | int") -> SongManager:
        i = ctx if isinstance(ctx, int) else ctx.guild.id
        self._song_managers.setdefault(i, SongManager(ctx.bot))
        return self._song_managers.get(i)


class PlayFlags(commands.FlagConverter):
    searh: str = commands.flag(description="Search term or url of the YouTube video")


class Music(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self._bot = bot
        self._song_managers = SongManagers()

    def cog_check(self, ctx: commands.Context):
        if not ctx.guild:
            raise commands.NoPrivateMessage("This command can't be used in DM channels.")
        return True

    async def cog_command_error(self, ctx: commands.Context, error: commands.CommandError):
        print("An error occurred: {}".format(str(error)))

    @commands.hybrid_command()
    async def join(self, ctx: commands.Context):
        """Joins a voice channel."""
        author_voice = ctx.author.voice
        if author_voice is None or author_voice.channel is None:
            return await ctx.reply("You must be in a voice channel before asking the bot to join.", ephemeral=True)

        channel = author_voice.channel
        if ctx.voice_client is not None:
            await ctx.voice_client.move_to(channel)
            return await ctx.reply("Switched channel", ephemeral=True)

        await channel.connect()
        await self._song_managers.get(ctx).join(ctx.voice_client)
        await ctx.reply("Joined channel", ephemeral=True)

    @commands.hybrid_command(alias=["leave"])
    async def disconnect(self, ctx: commands.Context):
        """Clears the queue and leaves the voice channel."""
        await self._song_managers.get(ctx).disconnect()
        await ctx.reply("Left channel", ephemeral=True)

    @commands.hybrid_command()
    async def volume(self, ctx: commands.Context, *, volume: int):
        """Sets the volume of the player."""

        if ctx.voice_client is None or not ctx.voice_client.is_playing():
            return await ctx.reply("Nothing being played at the moment.", ephemeral=True)

        if 0 > volume > 100:
            return await ctx.reply("Volume must be between 0 and 100", ephemeral=True)

        self._song_managers.get(ctx).volume = volume
        await ctx.reply(f"Volume of the player set to {volume}%")

    @commands.hybrid_command()
    async def restart(self, ctx: commands.Context):
        # bandaid fix a long time ago for the player, its not necessary now but its still here.
        await ctx.reply("Restarting bot...", ephemeral=True)
        os.execv(sys.executable, ["python3"] + sys.argv)

    @commands.hybrid_command()
    async def play(self, ctx: commands.Context, *, search: str):
        """Plays a file from the local filesystem"""
        if ctx.voice_client is None:
            return await ctx.reply("Not connected to any channel", ephemeral=True)
        async with ctx.typing():
            success = await self._song_managers.get(ctx).play(ctx, search)
        if success:
            await ctx.reply(f"Now playing: {search}")
        else:
            await ctx.reply(f"An error has occurred")

    @commands.hybrid_command()
    async def soundboard(self, ctx: commands.Context, *, name: str):
        """Plays a file from the local filesystem"""
        if ctx.voice_client is None:
            return await ctx.reply("Not connected to any channel", ephemeral=True)
        async with ctx.typing():
            success = await self._song_managers.get(ctx).soundboard(ctx, name)
        if success:
            await ctx.reply(f"Now playing: {name}")
        else:
            await ctx.reply(f"An error has occurred")

    @commands.hybrid_command(aliases=["current", "playing"])
    async def now(self, ctx: commands.Context):
        """Displays the currently playing song."""
        song_manager = self._song_managers.get(ctx)
        if song_manager.is_playing:
            await ctx.reply(embed=song_manager.embed)
        else:
            await ctx.reply("Not playng anything right now")

    @commands.hybrid_command()
    async def pause(self, ctx: commands.Context):
        """Pauses the currently playing song."""
        if await self._song_managers.get(ctx).pause():
            await ctx.reply("Paused", ephemeral=True)
        else:
            await ctx.reply("Not playng anything right now", ephemeral=True)

    @commands.hybrid_command()
    async def resume(self, ctx: commands.Context):
        """Resumes a currently paused song."""
        if await self._song_managers.get(ctx).resume():
            await ctx.reply("Resumed", ephemeral=True)
        else:
            await ctx.reply("No song paused to resume", ephemeral=True)

    @commands.hybrid_command()
    async def stop(self, ctx: commands.Context):
        """Stops playing song and clears the queue."""
        if await self._song_managers.get(ctx).stop():
            await ctx.reply("Stopped", ephemeral=True)
        else:
            await ctx.reply("No song paused to resume", ephemeral=True)

    # @commands.hybrid_command(name='skip')
    # async def _skip(self, ctx: commands.Context):
    #     """Vote to skip a song. The requester can automatically skip.
    #     3 skip votes are needed for the song to be skipped.
    #     """

    #     if not ctx.voice_state.is_playing:
    #         return await ctx.respond('Not playing any music right now...',ephemeral=True)

    #     voter = ctx.author
    #     if voter == ctx.voice_state.current.requester:
    #         await ctx.respond('Author requested to Skip Song')
    #         ctx.voice_state.skip()

    #     elif voter.id not in ctx.voice_state.skip_votes:
    #         ctx.voice_state.skip_votes.add(voter.id)
    #         total_votes = len(ctx.voice_state.skip_votes)

    #         if total_votes >= 3:
    #             await ctx.respond('Skipping song,currently at **{}/3**'.format(total_votes))
    #             ctx.voice_state.skip()
    #         else:
    #             await ctx.respond('Skip vote added, currently at **{}/3**'.format(total_votes))

    #     else:
    #         await ctx.respond('You have already voted to skip this song.',ephemeral=True)

    # @commands.hybrid_command(name='queue')
    # async def _queue(self, ctx: commands.Context, *, page: int = 1):
    #     """Shows the player's queue.
    #     You can optionally specify the page to show. Each page contains 10 elements.
    #     """

    #     if len(ctx.voice_state.songs) == 0:
    #         return await ctx.respond('Empty queue.')

    #     items_per_page = 10
    #     pages = math.ceil(len(ctx.voice_state.songs) / items_per_page)

    #     start = (page - 1) * items_per_page
    #     end = start + items_per_page

    #     queue = ''
    #     for i, song in enumerate(ctx.voice_state.songs[start:end], start=start):
    #         queue += '`{0}.` [**{1.source.title}**]({1.source.url})\n'.format(i + 1, song)

    #     embed = (discord.Embed(description='**{} tracks:**\n\n{}'.format(len(ctx.voice_state.songs), queue))
    #              .set_footer(text='Viewing page {}/{}'.format(page, pages)))
    #     await ctx.respond(embed=embed)

    # @commands.hybrid_command(name='shuffle')
    # async def _shuffle(self, ctx: commands.Context):
    #     """Shuffles the queue."""

    #     if len(ctx.voice_state.songs) == 0:
    #         return await ctx.respond('Empty queue.')

    #     ctx.voice_state.songs.shuffle()
    #     await ctx.respond('Shuffled Playlist')

    # @commands.hybrid_command(name='download',description= 'Download a song')
    # async def download(self, ctx:commands.Context, url: str, format: Literal['wav','mp3']):
    # # Check the format

    #     # Download options for youtube-dl
    #     ydl_opts = {
    #         'format': 'bestaudio/best',
    #         'outtmpl': 'downloads/%(title)s.%(ext)s',
    #         'noplaylist': True,
    #         'postprocessors': [{
    #             'key': 'FFmpegExtractAudio',
    #             'preferredcodec': format,
    #             'preferredquality': '192',
    #         }],
    #         'quiet': True
    #     }
    #     await ctx.response.defer()
    #     print("Recived Download command")
    #     # Download the song
    #     print("About to start youtube_dl.YoutubeDL")
    #     with youtube_dl.YoutubeDL(ydl_opts) as ydl:
    #         print("Inside youtube_dl.YoutubeDL block")
    #         info = ydl.extract_info(url, download=True)
    #         print("Extracted info")
    #         filename = ydl.prepare_filename(info)
    #         print("Prepared filename")
    #         filename = filename.rsplit(".", 1)[0] + f'.{format}'
    #     print("downloading",filename)

    #     # Extract and sanitize the song title
    #     song_title = info.get('title', 'Unknown')
    #     song_title = re.sub(r'[^\w\s-]', '', song_title).strip()  # remove non-alphanumeric, non-space, non-hyphen characters
    #     song_title = re.sub(r'\s+', '_', song_title)  # replace spaces with underscores
    #     song_title = song_title[:255-len(format)-1]  # ensure the filename does not exceed 255 characters

    #     # Upload the song
    #     with open(filename, 'rb') as fp:
    #         await ctx.followup.send(file=discord.File(fp, f'{song_title}.{format}'))
    #         # Delete the song
    #     os.remove(filename)

    # @commands.hybrid_command(name='remove')
    # async def _remove(self, ctx: commands.Context, index: int):
    #     """Removes a song from the queue at a given index."""

    #     if len(ctx.voice_state.songs) == 0:
    #         return await ctx.respond('Empty queue.')

    #     ctx.voice_state.songs.remove(index - 1)
    #     await ctx.respond("removing song at index %d" %(index))

    # @commands.hybrid_command(name='loop')
    # async def _loop(self, ctx: commands.Context):
    #     """Loops the currently playing song.
    #     Invoke this command again to unloop the song.
    #     """

    #     if not ctx.voice_state.is_playing:
    #         return await ctx.respond('Nothing being played at the moment.')

    #     # Inverse boolean value to loop and unloop.
    #     ctx.voice_state.loop = not ctx.voice_state.loop
    #     if(ctx.voice_state.loop == True):
    #         await ctx.respond("looping playlist")
    #     if(ctx.voice_state.loop == False):
    #         await ctx.respond("unlooping playlist")


def main():
    intents = discord.Intents.default()
    intents.message_content = True
    bot = commands.Bot(
        command_prefix=commands.when_mentioned_or("!"),
        description="You have to be ciccione to use this bot",
        intents=intents,
    )

    @bot.event
    async def on_ready():
        guild = discord.Object(id=int(os.getenv("DISCORD_GUILD_ID")))
        bot.tree.copy_global_to(guild=guild)
        synced = await bot.tree.sync(guild=guild)
        print(f"Sync result: {synced}")
        print(f"Logged in as {bot.user} (ID: {bot.user.id})")
        print("------")

    async def async_main():
        load_dotenv(".env")
        TOKEN = os.getenv("DISCORD_TOKEN")
        async with bot:
            await bot.add_cog(Music(bot))
            await bot.start(TOKEN)

    asyncio.run(async_main())


if __name__ == "__main__":
    main()
