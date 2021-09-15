import { SlashCommandOptionType, SlashCommandPartial } from "../../deps.ts";

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
  { name: "flip", description: "Lancia una moneta", options: [] },
  { name: "jester", description: "Avvia la modalità jester", options: [] },
  {
    name: "rules_jester",
    description: "Mostra le regole della modalità jester",
    options: [],
  },
  { name: "ciccione", description: "Sei ciccione, very ciccione", options: [] },
  { name: "tendinfame", description: "Tend Infame", options: [] },
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
    name: "seee",
    description: "Seeeeeeee",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "ame",
    description: "A me non m'interessa",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "cht",
    description: "Hollywood",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "war",
    description: "Warzonata",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "demo",
    description: "Inni Democratici",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "ess",
    description: "Modalità Estinzione",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "spranga",
    description: "Ecco come risolvere qualsiasi problema",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  {
    name: "cassa",
    description: "Salvini e la cassa integrazione",
    options: [{
      name: "traccia",
      description: "Numero che identifica la traccia",
      required: false,
      type: SlashCommandOptionType.NUMBER,
    }],
  },
  { name: "clean", description: "Toglie il vostro schifo", options: [] },
  { name: "clear", description: "Toglie il vostro schifo", options: [] },
  {
    name: "kgb",
    description:
      "Quanto è ciccione il ciccione bot (rivela da quanti caratteri non spazio è composto il codice)",
    options: [],
  },
  { name: "mistakes", description: "You made mistakes", options: [] },
];

export default commands;
