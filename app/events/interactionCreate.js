/**
 * /events/interactionCreate.js
 * This file contains the event handler for when an interaction is created.
 * Made by ルン1 ©2025
 *  */
const { Events, MessageFlags } = require("discord.js");

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    // Access client via interaction
    const command = interaction.client.commands.get(interaction.commandName);
    if (!command) {
      console.error(`No command matching ${interaction.commandName} found.`);
      await interaction
        .reply({
          content: "This command is no longer available. Please try again.",
          flags: MessageFlags.Ephemeral,
        })
        .catch(() => {});
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
