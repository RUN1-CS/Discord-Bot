/**
 * /commands/utility/introduce.js
 * This file contains the command implementation for introducing yourself.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("introduce")
    .setDescription("Introduces the user.")
    .addStringOption((option) => {
      option.setName("nickname").setDescription("Your preferred nickname.");
    })
    .addStringOption((option) => {
      option.setName("hobby").setDescription("Your favorite hobby.");
    })
    .addStringOption((option) => {
      option.setName("fun_fact").setDescription("A fun fact about you.");
    })
    .addStringOption((option) => {
      option
        .setName("distribution")
        .setDescription("Your favorite Linux distribution.");
    })
    .addStringOption((option) => {
      option
        .setName("programming_language")
        .setDescription("Your favorite programming language.");
    })
    .addStringOption((option) => {
      option
        .setName("window_manager")
        .setDescription("Your favorite window manager.");
    })
    .addStringOption((option) => {
      option.setName("ide").setDescription("Your favorite IDE.");
    })
    .addStringOption((option) => {
      option.setName("shell").setDescription("Your favorite shell.");
    }),
  async execute(interaction) {
    const user = interaction.user;
    const fields = [
      { name: "Username", value: user.username, inline: true },
      { name: "User ID", value: user.id, inline: true },
    ];

    const nickname = interaction.options.getString("nickname");
    const hobby = interaction.options.getString("hobby");
    const funFact = interaction.options.getString("fun_fact");
    const distribution = interaction.options.getString("distribution");
    const programmingLanguage = interaction.options.getString(
      "programming_language",
    );
    const windowManager = interaction.options.getString("window_manager");
    const ide = interaction.options.getString("ide");
    const shell = interaction.options.getString("shell");

    if (nickname)
      fields.push({ name: "Nickname", value: nickname, inline: true });
    if (hobby) fields.push({ name: "Hobby", value: hobby, inline: true });
    if (funFact)
      fields.push({ name: "Fun Fact", value: funFact, inline: true });
    if (distribution)
      fields.push({
        name: "Linux Distribution",
        value: distribution,
        inline: true,
      });
    if (programmingLanguage)
      fields.push({
        name: "Programming Language",
        value: programmingLanguage,
        inline: true,
      });
    if (windowManager)
      fields.push({
        name: "Window Manager",
        value: windowManager,
        inline: true,
      });
    if (ide) fields.push({ name: "IDE", value: ide, inline: true });
    if (shell) fields.push({ name: "Shell", value: shell, inline: true });

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(`${user.username}'s Introduction`)
      .setDescription(`Hello! I'm ${user.username}.`)
      .setThumbnail(user.displayAvatarURL())
      .addFields(...fields)
      .setTimestamp();

    await interaction.reply({
      embeds: [embed],
    });
  },
};
