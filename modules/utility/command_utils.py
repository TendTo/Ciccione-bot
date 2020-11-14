from random import randint
import os
from time import sleep
from discord import VoiceChannel, VoiceClient, FFmpegPCMAudio
from discord.ext import commands


async def play_sound_effect(ctx: commands.Context, sound_path: str, track: int = None, max_track: int = 1):
    """A me non m'interessa"""
    if ctx.author.voice is None:
        return

    user_vc: VoiceChannel = ctx.author.voice.channel
    bot_vc: VoiceClient = ctx.voice_client
    sound_path = create_sound_path(sound_path=sound_path, track=track, max_track=max_track)

    if bot_vc is None:
        bot_vc = await user_vc.connect()

    if os.name == "posix":
        bot_vc.play(source=FFmpegPCMAudio(source=sound_path))
    else:
        bot_vc.play(source=FFmpegPCMAudio(executable="data\\sounds\\ffmpeg.exe", source=sound_path))

    while bot_vc.is_playing():
        sleep(1)
    await bot_vc.disconnect()


def create_sound_path(sound_path: str, track: int = None, max_track: int = 1) -> str:
    if track:
        try:
            track = int(track)
            if track > max_track or track < 1:
                track = 1
            sound_path = sound_path.format(track)
        except ValueError:
            sound_path = sound_path.format(randint(1, max_track))
    else:
        sound_path = sound_path.format(randint(1, max_track))
    return sound_path
