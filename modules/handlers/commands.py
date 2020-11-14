"""Contains all the commands the bot will react to"""
import random
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
    bot.add_command(commands.Command(ciccione))
    bot.add_command(commands.Command(clean))
    bot.add_command(commands.Command(jester))
    bot.add_command(commands.Command(rules_jester))
    bot.add_command(commands.Command(code))
    bot.add_command(commands.Command(seee))
    bot.add_command(commands.Command(ame))
    bot.add_command(commands.Command(cht))


async def roll(ctx: commands.Context, dice: str = None):
    """Lancia un dado"""
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


async def ciccione(ctx: commands.Context):
    """È ciccione"""
    await ctx.send(content=f"{ctx.author.display_name} è ciccione", tts=True)


async def clean(ctx: commands.Context):
    """Togli un po' di schifo"""
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
    """Avvia la modalità jester"""
    await ctx.send(rules_jester_text)


async def code(ctx: commands.Context, n_code: str = None):
    """Avvia il codice"""
    if n_code is not None:
        letters = []
        for letter in n_code:
            letters.append(letter)
        text = ", ".join(letters)
        globals()['text_code'] = []
        globals()['text_code'].append(n_code)
        globals()['text_code'].append(text)

    if globals()['text_code']:
        _code = globals()['text_code'][0]
        _comma_code = globals()['text_code'][1]
        await ctx.send(content=f"Il codice è {_comma_code}", tts=True)
        await ctx.send(content=f"{_code}")


async def seee(ctx: commands.Context, track: str = None):
    """Seeeeeeee"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/See{}.mp3", track=track, max_track=4)


async def ame(ctx: commands.Context, track: str = None):
    """A me non m'interessa"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/NonInteressa{}.mp3", track=track, max_track=2)


async def cht(ctx: commands.Context, track: str = None):
    """Hollywood"""
    await play_sound_effect(ctx=ctx, sound_path="data/sounds/cht{}.mp3", track=track, max_track=3)


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