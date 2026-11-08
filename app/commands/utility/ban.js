const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from this server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to ban")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the ban")
        .setRequired(true)
        .setMaxLength(400),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Basic sanity checks
    if (targetUser.id === interaction.user.id) {
      return interaction.editReply("You can't ban yourself.");
    }
    if (targetUser.id === interaction.client.user.id) {
      return interaction.editReply("I'm not going to ban myself.");
    }
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.editReply("You can't ban the server owner.");
    }

    // Hierarchy checks (only possible if the user is still in the server)
    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    if (targetMember) {
      const isOwner = interaction.user.id === interaction.guild.ownerId;
      const moderatorHigher =
        interaction.member.roles.highest.position >
        targetMember.roles.highest.position;

      if (!isOwner && !moderatorHigher) {
        return interaction.editReply(
          "You cannot ban someone with an equal or higher role than yours.",
        );
      }
      if (!targetMember.bannable) {
        return interaction.editReply(
          "I can't ban that user. Their role is higher than (or equal to) mine, or I lack permission.",
        );
      }
    }

    // DM first - after the ban we can no longer reach them via the shared server
    let dmSent = true;
    try {
      await targetUser.send(
        `You have been **banned** from **${interaction.guild.name}**.\n**Reason:** ${reason}`,
      );
    } catch {
      dmSent = false; // DMs closed or blocked
    }

    try {
      await interaction.guild.members.ban(targetUser, {
        reason: `${reason} (by ${interaction.user.tag})`,
      });
    } catch (error) {
      console.error("Failed to ban user:", error);
      return interaction.editReply(
        `Failed to ban **${targetUser.tag}**. Check my permissions and role position.`,
      );
    }

    return interaction.editReply(
      `🔨 **${targetUser.tag}** has been banned.\n**Reason:** ${reason}` +
        (dmSent ? "" : "\n*(Could not DM the user.)*"),
    );
  },
};
