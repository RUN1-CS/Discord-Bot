/**
 * /commands/utility/echo.js
 * This file contains the command implementation for echoing a message.
 * Made by ルン1 ©2025
 *  */

const { MessageFlags, SlashCommandBuilder } = require("discord.js");

const handledInteractions = new Set();

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
    if (handledInteractions.has(interaction.id)) return;
    handledInteractions.add(interaction.id);

    const message = interaction.options.getString("message");
    const channel = interaction.options.getChannel("channel");

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (channel) {
      await channel.send({ content: message });
      await interaction.editReply({
        content: `Message echoed in ${channel}.`,
      });
    } else {
      await interaction.editReply({
        content: "Please specify a channel to send the echoed message.",
      });
    }
  },
};
