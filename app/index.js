// index.js
/**
 * Discord.js v14 bot index
 * Fully v14-ready, slash commands and events loader
 * Made by ルン1 ©2026
 */

const fs = require("fs");
const path = require("path");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");
const { token, guildId } = require("./config.json");

// Create the client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Prepare command collection
client.commands = new Collection();

// -------- Load commands --------
const commandsPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(commandsPath);

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  const commandFiles = fs
    .readdirSync(folderPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(
        `[WARNING] The command at ${filePath} is missing "data" or "execute"`,
      );
    }
  }
}

// -------- Load events --------
const eventsPath = path.join(__dirname, "events");
const eventFiles = fs
  .readdirSync(eventsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// -------- Register slash commands after login --------
client.once(Events.ClientReady, async (readyClient) => {
  try {
    console.log(`Started refreshing ${client.commands.size} slash commands...`);

    const rest = new REST({ version: "10" }).setToken(token);

    const data = await rest.put(
      Routes.applicationGuildCommands(readyClient.application.id, guildId),
      { body: client.commands.map((command) => command.data.toJSON()) },
    );

    console.log(`Successfully reloaded ${data.length} slash commands.`);
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
});

// -------- Login --------
client
  .login(token)
  .then(() => console.log("Bot logged in successfully!"))
  .catch(console.error);
