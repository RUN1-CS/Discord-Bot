/**
 * /commands/utility/fun_fact.js
 * This file contains the command implementation for sending a fun fact.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder } = require("discord.js");
const lines = require("../assets/lines.json");

const fun_facts = lines.fun_facts;

module.exports = {
  data: new SlashCommandBuilder()
    .setName("funfact")
    .setDescription("Sends a random fun fact."),
  async execute(interaction) {
    const randomIndex = Math.floor(Math.random() * fun_facts.length);
    const randomFact = fun_facts[randomIndex];
    await interaction.reply({ content: randomFact });
  },
};
