/**
 * /commands/utility/Linus_quote.js
 * This file contains the command implementation for sending a Linus Torvalds quote.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");
const lines = require("../assets/lines.json");

const Linus_quotes = lines.quotes;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("linusquote")
    .setDescription("Sends a random Linus Torvalds quote."),
  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * Linus_quotes.length);
    const randomQuote = Linus_quotes[randomIndex];
    await interaction.reply(randomQuote);
  },
};
