/**
 * /commands/utility/joke.js
 * This file contains the command implementation for telling a joke.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");
const { jokes } = require("/commands/assets/lines.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("joke")
    .setDescription("Tells a random joke."),
  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * jokes.length);
    const randomJoke = jokes[randomIndex];
    await interaction.reply(randomJoke);
  },
};
