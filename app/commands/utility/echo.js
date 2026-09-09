/**
 * /commands/utility/echo.js
 * This file contains the command implementation for echoing a message.
 * Made by ルン1 ©2025
 *  */

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("echo")
    .setDescription("Echoes the provided message.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to echo")
        .setRequired(true),
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to send the echoed message to")
        .setRequired(false),
    )
    .setDefaultMemberPermissions(0), // This command is restricted to users with administrator permissions
  async execute(interaction) {
    const message = interaction.options.getString("message");
    const channel = interaction.options.getChannel("channel");
    if (channel) {
      await channel.send({ content: message });
    } else {
      await interaction.reply({ content: message });
    }
  },
};
