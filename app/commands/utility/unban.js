/**
 * /commands/utility/unban.js
 * This file contains the command implementation for unbanning a user.
 * Made by ルン1 ©2026
 *  */
const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user (paste their user ID in the user field)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unban (paste their ID)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the unban")
        .setRequired(false)
        .setMaxLength(400),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";

    // Make sure the user is actually banned
    const ban = await interaction.guild.bans
      .fetch(targetUser.id)
      .catch(() => null);
    if (!ban) {
      return interaction.editReply(
        `**${targetUser.tag}** is not banned in this server.`,
      );
    }

    try {
      await interaction.guild.members.unban(
        targetUser,
        `${reason} (by ${interaction.user.tag})`,
      );
    } catch (error) {
      console.error("Failed to unban user:", error);
      return interaction.editReply(
        `Failed to unban **${targetUser.tag}**. Check my **Ban Members** permission.`,
      );
    }

    return interaction.editReply(
      `✅ **${targetUser.tag}** has been unbanned.\n**Reason:** ${reason}`,
    );
  },
};
