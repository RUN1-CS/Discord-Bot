/**
 * /commands/utility/Linus_quote.js
 * This file contains the command implementation for sending a Linus Torvalds quote.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");
const { Linus_quotes } = require("/commands/assets/lines.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("linus quote")
    .setDescription("Sends a random Linus Torvalds quote."),
  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * Linus_quotes.length);
    const randomQuote = Linus_quotes[randomIndex];
    await interaction.reply(randomQuote);
  },
};
