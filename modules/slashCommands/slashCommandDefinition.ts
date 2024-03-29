import {
  ApplicationCommandChoice,
  SlashCommandOptionType,
  SlashCommandPartial,
} from "../../deps.ts";

const tracksChoices = (maxTrack: number): ApplicationCommandChoice[] => {
  const choices = [];
  for (let i = 1; i <= maxTrack; i++) {
    choices.push({ name: `Traccia ${i}`, value: i });
  }
  return choices;
};

const commands: SlashCommandPartial[] = [
  {
    name: "roll",
    description: "Lancia un dado",
    options: [{
      name: "n_dadi",
      description: "Numero di dadi",
      required: true,
      type: SlashCommandOptionType.NUMBER,
    }, {
      name: "n_facce",
      description: "Numero di facce del dado",
      required: true,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  { name: "flip", description: "Lancia una moneta" },
  {
    name: "rules_jester",
    description: "Mostra le regole della modalità jester",
  },
  { name: "ciccione", description: "Sei ciccione, very ciccione" },
  { name: "tendinfame", description: "Tend Infame" },
  {
    name: "code",
    description: "Salva e detta il codice della partita",
    options: [{
      name: "codice",
      description: "Codice della stanza di Among SUS",
      required: false,
      type: SlashCommandOptionType.STRING,
    }],
  },
  {
    name: "gartic_phone_sondaggio",
    description:
      "Determina la modalità preferita da usare su Gartic Phone tramite un sondaggio",
    options: [{
      name: "canale",
      description: "Nome del canale",
      required: false,
      type: SlashCommandOptionType.STRING,
    }],
  },
  {
    name: "sondaggio",
    description: "Crea un sondaggio",
    options: [{
      name: "titolo",
      description: "Nome del sondaggio",
      required: true,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op1",
      description: "Opzione 1",
      required: true,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op2",
      description: "Opzione 2",
      required: true,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op3",
      description: "Opzione 3",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op4",
      description: "Opzione 4",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op5",
      description: "Opzione 5",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op6",
      description: "Opzione 6",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op7",
      description: "Opzione 7",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op8",
      description: "Opzione 8",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "op9",
      description: "Opzione 9",
      required: false,
      type: SlashCommandOptionType.STRING,
    }, {
      name: "canale",
      description: "Id del canale",
      required: false,
      type: SlashCommandOptionType.STRING,
    }],
  },
  { name: "clean", description: "Toglie il vostro schifo" },
  { name: "mistakes", description: "You made mistakes" },
  { name: "join", description: "Unisciti ad un canale vocale" },
  { name: "leave", description: "Lascia il canale vocale" },
  { name: "skip", description: "Salta questa canzone e vai alla prossima" },
  { name: "pause", description: "Mette in pausa la canzone corrente" },
  { name: "resume", description: "Riprende la canzone corrente" },
  { name: "clear", description: "Elimina tutte le altre canzoni in coda" },
  {
    name: "play",
    description: "Avvia una canzone",
    options: [
      {
        name: "ricerca",
        description: "Ricerca la canzone su Youtube",
        required: true,
        type: SlashCommandOptionType.STRING,
      },
    ],
  },
  {
    name: "cds",
    description: "La mucraggine è potente qui",
    options: [{
      name: "audio",
      description: "I grandi classici",
      options: [{
        name: "seee",
        description: "Seeeee? Seeeeeeee!",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(10),
          type: SlashCommandOptionType.NUMBER,
        }],
      }, {
        name: "ame",
        description: "A me n'minteress",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(2),
          type: SlashCommandOptionType.NUMBER,
        }],
      }, {
        name: "cht",
        description: "Holliwood?!",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(3),
          type: SlashCommandOptionType.NUMBER,
        }],
      }, {
        name: "demo",
        description: "Democrazia per tutti",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(5),
          type: SlashCommandOptionType.NUMBER,
        }],
      }, {
        name: "ess",
        description: "Ded",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(1),
          type: SlashCommandOptionType.NUMBER,
        }],
      }, {
        name: "spranga",
        description: "Save the children",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(3),
          type: SlashCommandOptionType.NUMBER,
        }],
      }, {
        name: "war",
        description: "Warzonata?!",
        type: SlashCommandOptionType.SUB_COMMAND,
        options: [{
          name: "traccia",
          description: "Numero che identifica la traccia",
          required: false,
          choices: tracksChoices(1),
          type: SlashCommandOptionType.NUMBER,
        }],
      }],
      type: SlashCommandOptionType.SUB_COMMAND_GROUP,
    }],
  },
];

export default commands;
