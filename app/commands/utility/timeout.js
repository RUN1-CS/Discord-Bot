const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const UNIT_NAMES = { s: "second", m: "minute", h: "hour", d: "day" };
const MAX_TIMEOUT_MS = 28 * UNIT_MS.d; // Discord's hard limit

/** "30m" -> { ms: 1800000, label: "30 minutes" }. Returns null if invalid. */
function parseDuration(input) {
  const match = /^(\d+)\s*([dhms])$/i.exec(input.trim());
  if (!match) return null;
  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const ms = amount * UNIT_MS[unit];
  if (ms <= 0) return null;
  return {
    ms,
    label: `${amount} ${UNIT_NAMES[unit]}${amount === 1 ? "" : "s"}`,
  };
}

module.exports = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription(
      "Temporarily restrict a member (they cannot talk, react or join voice)",
    )
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The member to time out")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("How long, e.g. 30s, 10m, 2h, 7d (max 28d)")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the timeout")
        .setRequired(true)
        .setMaxLength(400),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const durationInput = interaction.options.getString("duration", true);
    const reason = interaction.options.getString("reason", true);


    const duration = parseDuration(durationInput);
    if (!duration) {
      return interaction.editReply(
        "Invalid duration. Use a number followed by `d`, `h`, `m` or `s`, e.g. `30m`, `2h`, `7d`.",
      );
    }
    if (duration.ms > MAX_TIMEOUT_MS) {
      return interaction.editReply(
        "The maximum timeout duration is **28 days**.",
      );
    }

    if (targetUser.id === interaction.user.id) {
      return interaction.editReply("You can't time yourself out.");
    }
    if (targetUser.id === interaction.client.user.id) {
      return interaction.editReply("I'm not going to time myself out.");
    }
    if (targetUser.id === interaction.guild.ownerId) {
      return interaction.editReply("You can't time out the server owner.");
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
        "You cannot time out someone with an equal or higher role than yours.",
      );
    }
    // Also false for members with the Administrator permission
    if (!targetMember.moderatable) {
      return interaction.editReply(
        "I can't time out that user. They may be an administrator, or their role is higher than (or equal to) mine.",
      );
    }

    try {
      await targetMember.timeout(
        duration.ms,
        `${reason} (by ${interaction.user.tag})`,
      );
    } catch (error) {
      console.error("Failed to timeout user:", error);
      return interaction.editReply(
        `Failed to time out **${targetUser.tag}**. Check my permissions and role position.`,
      );
    }

    // They stay in the server, so DM after the timeout succeeded
    let dmSent = true;
    try {
      const until = Math.floor((Date.now() + duration.ms) / 1000);
      await targetUser.send(
        `🔇 You have been **timed out** in **${interaction.guild.name}** for ${duration.label}.\n` +
          `**Reason:** ${reason}\n**Ends:** <t:${until}:F> (<t:${until}:R>)`,
      );
    } catch {
      dmSent = false; // DMs closed or blocked
    }

    return interaction.editReply(
      `🔇 **${targetUser.tag}** has been timed out for **${duration.label}**.\n**Reason:** ${reason}` +
        (dmSent ? "" : "\n*(Could not DM the user.)*"),
    );
  },
};
