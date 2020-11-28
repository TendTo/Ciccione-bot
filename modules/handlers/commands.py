"""Contains all the commands the bot will react to"""
import random
import os
from typing import List
from discord import Member
from discord.ext import commands
from discord.ext.commands.errors import CommandInvokeError
from modules.utility.command_utils import play_sound_effect

text_code: list = []


def add_commands(bot: commands.Bot):
    """Adds the commands to the bot"""
    bot.add_command(commands.Command(roll))
    bot.add_command(commands.Command(flip))
    bot.add_command(commands.Command(jester))
    bot.add_command(commands.Command(rules_jester))
    bot.add_command(commands.Command(ciccione))
    bot.add_command(commands.Command(tendinfame))
    bot.add_command(commands.Command(code))
    bot.add_command(commands.Command(seee))
    bot.add_command(commands.Command(ame))
    bot.add_command(commands.Command(cht))
    bot.add_command(commands.Command(war))
    bot.add_command(commands.Command(demo))
    bot.add_command(commands.Command(ess))
    bot.add_command(commands.Command(spranga))
    bot.add_command(commands.Command(cassa))
    bot.add_command(commands.Command(clean))
    bot.add_command(commands.Command(clear))
    bot.add_command(commands.Command(kgb))


async def roll(ctx: commands.Context, dice: str = None):
    """Lancia un dado | [use]: ?roll <numeroDadi>d<dado>"""
    fail_text = 'Il formato del comando è **?roll <numeroDadi>d<dado>**\nes. **?roll 3d10**  => *lancia 3 dadi a 10 facce*'
    if dice is None:
        await ctx.send(fail_text)
        return

    try:
        rolls, limit = map(int, dice.split('d'))
    except ValueError:
        await ctx.send(fail_text)
        return
    results = [random.randint(1, limit) for r in range(rolls)]
    text_results = ', '.join((str(v) for v in results))
    text = f"{text_results}\nTot = {sum(results)}"
    await ctx.send(text)


async def flip(ctx: commands.Context):
    """Lancia una moneta"""
    if random.randint(1, 2) == 1:
        text = "testa"
    else:
        text = "croce"

    await ctx.send(content=f"È uscita **{text}**")


async def kgb(ctx: commands.Context):
    """Quanto è ciccione il ciccione bot (rivela da quanti caratteri non spazio è composto il codice)"""
    total_kg = 0
    path = os.path.abspath('./modules')
    for root, dirname, files in os.walk(path):
        if dirname not in ('.venv', '__pycache__'):
            for file_name in files:
                if file_name.endswith(".py"):
                    file_path = os.path.join(root, file_name)
                    with open(file=file_path, mode='r', encoding="utf-8") as f:
                        data = f.read().replace(" ", "")
                        total_kg += len(data)
    with open(file=os.path.join(path, '..', 'main.py'), mode='r', encoding="utf-8") as f:
        data = f.read().replace(" ", "")
        total_kg += len(data)
    await ctx.send(content=f"Il ciccione pesa **{total_kg}kg**")


async def ciccione(ctx: commands.Context):
    """Sei ciccione, very ciccione"""
    await ctx.send(content=f"{ctx.author.display_name} è ciccione", tts=True)


async def tendinfame(ctx: commands.Context):
    """Tend Infame"""
    await ctx.send(content="Tend Infame", tts=True)


async def clean(ctx: commands.Context):
    """Toglie il vostro schifo"""
    try:
        await ctx.channel.purge(limit=100,
                                check=lambda msg: msg.content.startswith("?") or msg.author.id == 767524102537216001)
    except CommandInvokeError:
        ctx.send(content="Questo comando non è supportato in questo canale")


async def clear(ctx: commands.Context):
    """Toglie il vostro schifo"""
    try:
        await ctx.channel.purge(limit=100,
                                check=lambda msg: msg.content.startswith("?") or msg.author.id == 767524102537216001)
    except CommandInvokeError:
        ctx.send(content="Questo comando non è supportato in questo canale")


async def jester(ctx: commands.Context):
    """Avvia la modalità jester"""
    players: List[Member] = ctx.author.voice.channel.members
    choosen = random.choice(players)
    await choosen.send("Ora sei il jester")


async def rules_jester(ctx: commands.Context):
    """Mostra le regole della modalità jester"""
    await ctx.send(rules_jester_text)


async def code(ctx: commands.Context, n_code: str = None):
    """Salva e detta il codice della partita | [use]: ?code [codice]"""
    if n_code is not None:
        letters = []
        for letter in n_code:
            letters.append(letter)
        text = ", ".join(letters)
        text_code.clear()
        text_code.append(n_code)
        text_code.append(text)

    if text_code:
        _code = text_code[0]
        _comma_code = text_code[1]
        await ctx.send(content=f"Il codice è {_comma_code}", tts=True)
        await ctx.send(content=f"{_code}")


async def seee(ctx: commands.Context, track: str = None):
    """Seeeeeeee | [use]: ?seee [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/See{}.mp3", track=track, max_track=10)


async def ame(ctx: commands.Context, track: str = None):
    """A me non m'interessa | [use]: ?ame [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/NonInteressa{}.mp3", track=track, max_track=2)


async def cht(ctx: commands.Context, track: str = None):
    """Hollywood | [use]: ?cht [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/cht{}.mp3", track=track, max_track=3)


async def war(ctx: commands.Context, track: str = None):
    """Warzonata | [use]: ?war [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/warzonata{}.mp3", track=track, max_track=1)


async def demo(ctx: commands.Context, track: str = None):
    """Inni Democratici | [use]: ?demo [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/Demo{}.mp3", track=track, max_track=5)


async def cassa(ctx: commands.Context, track: str = None):
    """Salvini e la cassa integrazione | [use]: ?cassa [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/Cassa{}.mp3", track=track, max_track=2)


async def ess(ctx: commands.Context, track: str = None):
    """Modalità Estinzione | [use]: ?ess [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/Estinguermi{}.mp3", track=track, max_track=1)


async def spranga(ctx: commands.Context, track: str = None):
    """Ecco come risolvere qualsiasi problema | [use]: ?spranga [n_traccia]"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/spranga{}.mp3", track=track, max_track=3)


rules_jester_text = """```Per giocare la modalità jester si applicano le seguenti regole:
All'inizio della partita un giocatore a caso presente nella chat vocale sarà nominato jester attraverso un messaggio in privato

Se il jester è un impostore, non accade nulla e la partita si svolge normalmente.
Se il jester è un crewman, da quel momento in poi cambia il suo ruolo e diviene un jester.

Il jester ha le stesse abilità dei crewman, ma una win condition diversa. Non ha alcun obbligo particolare e può fare quello che vuole

CONDIZIONI DI VITTORIA:
impostori: uccidere abbastanza persone o concludere un sabotaggio
crewman: buttare fuori tutti gli impostori (ma non il jester) o concludere le task eccetto l'ultima barra. Una volta raggiunta questa soglia, bisogna utilizzare un emergency meeting per determinare se tutte le task ad eccezione di quelle del jester sono state svolte. Il jester, se presente, darà la conferma
jester: venire buttato fuori da una votazione```
"""
