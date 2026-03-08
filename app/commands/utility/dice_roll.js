/**
 * /commands/utility/dice_roll.js
 * This file contains the command implementation for rolling a dice.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("diceroll")
    .setDescription("Rolls a dice with the specified number of sides.")
    .addIntegerOption((option) =>
      option
        .setName("sides")
        .setDescription("The number of sides on the dice")
        .setRequired(true),
    ),
  async execute(interaction) {
    const sides = interaction.options.getInteger("sides");

    if (sides < 1) {
      await interaction.reply({
        content: "Please enter a valid number of sides (at least 1).",
      });
      return;
    }

    const result = Math.floor(Math.random() * sides) + 1;
    await interaction.reply({
      content: `You rolled a ${result} on a ${sides}-sided dice!`,
    });
  },
};
