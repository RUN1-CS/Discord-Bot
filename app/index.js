// Require basics
const fs = require("fs");
const path = require("path");
const {
  Client,
  Events,
  GatewayIntentBits,
  SlashCommandBuilder,
  Collection,
  MessageEmbed,
  MessageFlags,
} = require("discord.js");

const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

// Client setup
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// Command and event handling
client.commands = new Collection();

// Load commands
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
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`,
      );
    }
  }
}

// Load events
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

// Register slash commands with Discord
const rest = new REST().setToken(token);
(async () => {
  try {
    console.log(
      `Started refreshing ${client.commands.size} application (/) commands.`,
    );
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: client.commands.map((command) => command.data.toJSON()) },
    );
    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`,
    );
  } catch (error) {
    console.error("Error refreshing application (/) commands:", error);
  }
})();

// Login to Discord with your client's token
client.login(token);
