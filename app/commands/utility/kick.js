const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

module.exports = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a member from this server")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member to kick")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the kick")
        .setRequired(true)
        .setMaxLength(400),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);


    if (targetUser.id === interaction.user.id) {
      return interaction.editReply("You can't kick yourself.");
    }
    if (targetUser.id === interaction.client.user.id) {
      return interaction.editReply("I'm not going to kick myself.");
    }
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.editReply("You can't kick the server owner.");
    }

    const targetMember = await interaction.guild.members
      .fetch(targetUser.id)
      .catch(() => null);

    if (!targetMember) {
      return interaction.editReply("That user is not a member of this server.");
    }

    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const moderatorHigher =
      interaction.member.roles.highest.position >
      targetMember.roles.highest.position;

    if (!isOwner && !moderatorHigher) {
      return interaction.editReply(
        "You cannot kick someone with an equal or higher role than yours.",
      );
    }
    if (!targetMember.kickable) {
      return interaction.editReply(
        "I can't kick that user. Their role is higher than (or equal to) mine, or I lack permission.",
      );
    }

    // DM first - once kicked we may no longer share a server with them
    let dmSent = true;
    try {
      await targetUser.send(
        `You have been **kicked** from **${interaction.guild.name}**.\n**Reason:** ${reason}`,
      );
    } catch {
      dmSent = false; // DMs closed or blocked
    }

    try {
      await targetMember.kick(`${reason} (by ${interaction.user.tag})`);
    } catch (error) {
      console.error("Failed to kick user:", error);
      return interaction.editReply(
        `Failed to kick **${targetUser.tag}**. Check my permissions and role position.`,
      );
    }

    return interaction.editReply(
      `👢 **${targetUser.tag}** has been kicked.\n**Reason:** ${reason}` +
        (dmSent ? "" : "\n*(Could not DM the user.)*"),
    );
  },
};
