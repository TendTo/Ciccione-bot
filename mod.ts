#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --unstable --allow-run
// Importing Client and Intents class from Harmony
import { Intents } from "./deps.ts";
import CiccioneBot from "./modules/bot/bot.ts";

// Creating client (or bot!)
const client = new CiccioneBot({ prefix: "?" });
const token = Deno.env.get("BOT_TOKEN") ||
  Deno.readTextFileSync("config/token.conf");

// Proceed with connecting to Discord (login)
client.connect(token, Intents.None);
