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
  GatewayIntentBits,
  REST,
  Routes,
} = require("discord.js");
const { token, clientId, guildId } = require("./config.json");

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

// -------- Register slash commands --------
(async () => {
  try {
    console.log(`Started refreshing ${client.commands.size} slash commands...`);

    const rest = new REST({ version: "10" }).setToken(token);

    // For testing in one guild
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: client.commands.map((command) => command.data.toJSON()) },
    );

    console.log(`Successfully reloaded ${data.length} slash commands.`);
  } catch (error) {
    console.error("Error registering slash commands:", error);
  }
})();

// -------- Interaction handler --------
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`No command matching ${interaction.commandName} found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error executing this command!",
        ephemeral: true,
      });
    }
  }
});

// -------- Login --------
client
  .login(token)
  .then(() => console.log("Bot logged in successfully!"))
  .catch(console.error);
