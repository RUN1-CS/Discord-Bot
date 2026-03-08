/**
 * /commands/utility/Linux_quote.js
 * This file contains the command implementation for sending a Linux quote.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");
const { Linux_quotes } = require("/commands/assets/lines.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("linux quote")
    .setDescription("Sends a random Linux quote."),
  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * Linux_quotes.length);
    const randomQuote = Linux_quotes[randomIndex];
    await interaction.reply(randomQuote);
  },
};
