# TuxBot (Linux Discord Bot)

A Discord slash-command bot focused on Linux-themed utility/fun commands.

## What this project contains

- Bot entrypoint and runtime setup: [app/index.js](app/index.js)
- Event handlers:
  - [app/events/ready.js](app/events/ready.js)
  - [app/events/interactionCreate.js](app/events/interactionCreate.js)
- Command folders (loaded dynamically): [app/commands/](app/commands/)
- Command text assets: [app/commands/assets/lines.jsonc](app/commands/assets/lines.jsonc)
- Container files:
  - [app/Dockerfile](app/Dockerfile)
  - [compose.yaml](compose.yaml)

## How it works (high level)

- On startup, the bot:
  1. Creates a Discord client in [app/index.js](app/index.js)
  2. Loads command modules into [`client.commands`](app/index.js)
  3. Loads event modules from [app/events/](app/events/)
  4. Registers slash commands to a guild using `CLIENT_ID` + `GUILD_ID`
  5. Logs in using `TOKEN`

## Prerequisites

- Node.js 20+ (recommended)
- A Discord bot token + application/client ID + test guild ID

## Setup

1. Copy config template:
   - `app/config.json.example` → `app/config.json`
2. Fill values in [app/config.json](app/config.json):
   - `TOKEN`
   - `CLIENT_ID`
   - `GUILD_ID`

## Run locally

From project root:

1. Install dependencies:
   - `cd app && npm install`
2. Start bot:
   - `node index.js`

## Notes

- The bot currently has no npm scripts in [app/package.json](app/package.json), so use `node index.js` directly.
- [compose.yaml](compose.yaml) currently builds from root, while Dockerfile is in [app/Dockerfile](app/Dockerfile). If using Docker Compose, adjust build context/dockerfile path accordingly.
- Keep `config.json` private and never commit real secrets.

## Project layout

- [readme.md](readme.md)
- [config.json.example](app/config.json.example)
- [compose.yaml](compose.yaml)
- [app/index.js](app/index.js)
- [app/package.json](app/package.json)
- [app/events/ready.js](app/events/ready.js)
- [app/events/interactionCreate.js](app/events/interactionCreate.js)
- [app/commands/assets/lines.jsonc](app/commands/assets/lines.jsonc)
- [app/commands/utility/](app/commands/utility/)
