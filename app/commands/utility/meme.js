/**
 * /commands/utility/meme.js
 * This file contains the command implementation for sending a meme.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");
const lines = require("../assets/lines.json");

const memes = lines.memes;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("meme")
    .setDescription("Sends a random meme."),
  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * memes.length);
    const randomMeme = memes[randomIndex];
    await interaction.reply({ content: randomMeme });
  },
};
