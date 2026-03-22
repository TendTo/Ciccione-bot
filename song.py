from sources import YTDLSource, LocalSource, LocalSourceError, YTDLError
import discord
from discord.ext import commands
from dataclasses import dataclass
import asyncio
import random

class SongError(Exception):
    pass


@dataclass(frozen=True)
class Song:
    source: YTDLSource
    requester: discord.User

    @property
    def embed(self):
        return self.source.embed.add_field(name='Requested by', value=self.requester.mention)
    
class SongQueue(asyncio.Queue):
    def clear(self):
        try:
            while not self.empty():
                self.get_nowait()
                self.task_done()
        except asyncio.QueueEmpty:
            pass
        assert self.empty()

    def __len__(self):
        return self.qsize()
    
    def shuffle(self):
        random.shuffle(self._queue)


class SongManager:
    def __init__(self, bot: commands.Bot):
        self._bot = bot

        self._current_song: "Song | None" = None
        self._voice_client: "discord.VoiceClient | None" = None
        self._next_trigger = asyncio.Event()
        self._songs = SongQueue()
        
        self._looping = False
        self._volume = 0.5
        self._skip_votes: set[int] = set()
        self._play_task: "asyncio.Task | None" = None

    def __del__(self):
        if self._play_task is not None:
            self._play_task.cancel()
        
    @property
    def looping(self):
        return self._looping

    @looping.setter
    def looping(self, value: bool):
        self._looping = value

    @property
    def volume(self):
        return self._volume

    @volume.setter
    def volume(self, value: float):
        assert 0 <= value <= 100
        self._volume = (value / 100.0) if value > 1 else value

    @property
    def is_playing(self):
        return self._voice_client is not None and self._voice_client.is_playing()

    async def _play_next(self):
        if not self._looping or self._current_song is None:
            try:
                self._current_song = await asyncio.wait_for(self._songs.get(), timeout=120)
            except asyncio.TimeoutError:
                print("Disconnected due to inactivity")
                await self.disconnect()    
                return

        if self._voice_client is None:
            self.stop()
            print("Bot got disconnected")
            return

        assert self._current_song is not None
        self._current_song.source.volume = self._volume
        try:
            self._voice_client.play(self._current_song.source, after=self.trigger_play_next)
        except Exception as e:
            print(f'Error occured when trying to play song {e}')
            await self.stop()
            return

        await self._voice_client.channel.send(embed=self._current_song.embed)

    async def audio_player_task(self):
        while True:
            await self._next_trigger.wait()
            self._next_trigger.clear()
            await self._play_next()

    def trigger_play_next(self, error: "Exception | None" = None):
        if error:
            raise SongError(str(error))
        self._next_trigger.set()

    def _start_play(self):
        if self._play_task is None or self._play_task.done():
            self._play_task = self._bot.loop.create_task(self.audio_player_task())
            self.trigger_play_next()

    async def soundboard(self, ctx: commands.Context, name: str) -> bool:
        if self._voice_client is None:
            return False
        try:
            song = Song(await LocalSource.create_source(ctx, name), ctx.author)
        except LocalSourceError as e:
            print(e)
            return False
        await self._songs.put(song)
        self._start_play()
        return True

    async def play(self, ctx: commands.Context, search: str) -> bool:
        if self._voice_client is None:
            return False
        try:
            song = Song(await YTDLSource.create_source(ctx, search), ctx.author)
        except YTDLError as e:
            print(e)
            return False
        await self._songs.put(song)
        self._start_play()
        return True

    def skip(self):
        if self._voice_client is None:
            return
        self._skip_votes.clear()
        if self.is_playing:
            self._voice_client.stop()

    async def join(self, voice_client: discord.VoiceClient):
        if voice_client is not None:
            self._voice_client = voice_client

    async def disconnect(self) -> bool:
        await self.stop()

        if self._play_task is not None:
            self._play_task.cancel()
            self._play_task = None

        if self._voice_client is None:
            return False

        await self._voice_client.disconnect()
        self._voice_client = None
        return True

    async def pause(self) -> bool:
        if self._voice_client is not None and self._voice_client.is_playing():
            self._voice_client.pause()
            return True
        return False

    async def resume(self) -> bool:
        if self._voice_client is not None and self._voice_client.is_paused():
            self._voice_client.resume()
            return True
        return False

    async def stop(self) -> bool:
        self._songs.clear()
        self._current_song = None
        if self._voice_client is None:
            return False
        self._voice_client.stop()
        return True

    @property
    def embed(self) -> discord.Embed:
        if self._current_song is None:
            return discord.Embed(title="Mistakes were made", color=discord.Color.red())
        return self._current_song.embed
    
