import discord
import youtube_dl
from discord.ext import commands
import asyncio
import functools
import os

class YTDLError(Exception):
    pass

class LocalSourceError(Exception):
    pass

class LocalSource(discord.PCMVolumeTransformer):
    FFMPEG_OPTIONS = {
        'options': '-vn',
    }
    SOUNDS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "sounds")

    def __init__(self, source: discord.FFmpegPCMAudio, volume: float = 0.5):
        super().__init__(source, volume)
    
    @property
    def embed(self) -> discord.Embed:
        return (discord.Embed(title='Now playing',
                               description=f'```css\nSoundboard\n```',
                               color=discord.Color.blurple())
                )
    

    @classmethod
    async def create_source(cls, ctx: commands.Context, name: str) -> "LocalSource":
        if not name.endswith(".mp3"):
            name += ".mp3"
        file = os.path.join(cls.SOUNDS_PATH, name)
        if not os.path.exists(file) or not os.path.isfile(file):
            raise LocalSourceError(f"File {file} not found")
        try:
            cls = cls(discord.FFmpegPCMAudio(file, **cls.FFMPEG_OPTIONS))
        except discord.ClientException:
            raise LocalSourceError("FFmpegPCMAudio Subprocess failed to be created. Is one already running?")
        return cls

class YTDLSource(discord.PCMVolumeTransformer):
    YTDL_OPTIONS = {
        'format': 'bestaudio/best',
        'extractaudio': True,
        'audioformat': 'mp3',
        'outtmpl': '%(extractor)s-%(id)s-%(title)s.%(ext)s',
        'restrictfilenames': True,
        'noplaylist': True,
        'nocheckcertificate': True,
        'ignoreerrors': False,
        'logtostderr': False,
        'quiet': True,
        'no_warnings': True,
        'default_search': 'auto',
        'source_address': '0.0.0.0',
    }

    FFMPEG_OPTIONS = {
        'before_options': '-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5',
        'options': '-vn',
    }

    ytdl = youtube_dl.YoutubeDL(YTDL_OPTIONS)
    
    def __init__(self, ctx: commands.Context, source: discord.FFmpegPCMAudio, *, data: dict, volume: float = 0.5):
        super().__init__(source, volume)
	
        self._requester = ctx.author
        self._channel = ctx.channel
        self._data = data

        date = data.get('upload_date')
        self._uploader = data.get('uploader')
        self._uploader_url = data.get('uploader_url')
        self._upload_date = date[6:8] + '.' + date[4:6] + '.' + date[0:4]
        self._title = data.get('title')
        self._thumbnail = data.get('thumbnail')
        self._description = data.get('description')
        self._duration = self.parse_duration(int(data.get('duration')))
        self._tags = data.get('tags')
        self._url = data.get('webpage_url')
        self._views = data.get('view_count')
        self._likes = data.get('like_count')
        self._dislikes = data.get('dislike_count')
        self._stream_url = data.get('url')

    @property
    def title(self) -> str:
        return self._title

    @property
    def duration(self) -> str:
        return self._duration

    @property
    def uploader(self) -> str:
        return self._uploader

    @property
    def uploader_url(self) -> str:
        return self._uploader_url

    @property
    def url(self) -> str:
        return self._url

    @property
    def thumbnail(self) -> str:
        return self._thumbnail

    @property
    def embed(self):
        return (discord.Embed(title='Now playing',
                               description=f'```css\n{self._title}\n```',
                               color=discord.Color.blurple())
                 .add_field(name='Duration', value=self._duration)
                 .add_field(name='Uploader', value=f'[{self._uploader}]({self._uploader_url})')
                 .add_field(name='URL', value=f'[Click]({self._url})')
                 .set_thumbnail(url=self._thumbnail))

    def __str__(self):
        return f'**{self._title}** by **{self._uploader}**'

    @classmethod
    async def create_source(cls, ctx: commands.Context, search: str):
        loop = asyncio.get_event_loop()

        partial = functools.partial(cls.ytdl.extract_info, search, download=False, process=False)
        data = await loop.run_in_executor(None, partial)

        if data is None:
            raise YTDLError(f"Couldn't find anything that matches `{search}`")

        if 'entries' not in data:
            process_info = data
        else:
            process_info = None
            for entry in data['entries']:
                if entry:
                    process_info = entry
                    break

            if process_info is None:
                raise YTDLError(f"Couldn't find anything that matches `{search}`")

        webpage_url = process_info['webpage_url']
        partial = functools.partial(cls.ytdl.extract_info, webpage_url, download=False)
        processed_info = await loop.run_in_executor(None, partial)

        if processed_info is None:
            raise YTDLError(f"Couldn't fetch `{webpage_url}`")

        if 'entries' not in processed_info:
            info = processed_info
        else:
            info = None
            while info is None:
                try:
                    info = processed_info['entries'].pop(0)
                except IndexError:
                    raise YTDLError(f"Couldn't retrieve any matches for `{webpage_url}`")

        try:
            cls = cls(ctx, discord.FFmpegPCMAudio(info['url'], **cls.FFMPEG_OPTIONS), data=info)
        except discord.ClientException:
            raise YTDLError("FFmpegPCMAudio Subprocess failed to be created. Is one already running?")
        return cls

    @staticmethod
    def parse_duration(duration: int):
        minutes, seconds = divmod(duration, 60)
        hours, minutes = divmod(minutes, 60)
        return f"{hours}:{minutes:02}:{seconds:02}"
