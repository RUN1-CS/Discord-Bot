/**
 * /events/interactionCreate.js
 * This file contains the event handler for when an interaction is created.
 * Made by ルン1 ©2025
 *  */
const { Events, InteractionType, MessageFlags } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Only handle slash commands
    if (interaction.type !== InteractionType.ApplicationCommand) return;

    // Access client via interaction
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} found.`);
      return;
    }

    try {
      await interaction.deferReply(
        command.ephemeral ? { flags: MessageFlags.Ephemeral } : undefined,
      );
      await command.execute(interaction);
    } catch (error) {
      console.error(`Error executing ${interaction.commandName}:`, error);
      if (error.code === 10062) return;

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
          content: "There was an error executing this command!",
        });
      } else {
        await interaction.reply({
          content: "There was an error executing this command!",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
};
