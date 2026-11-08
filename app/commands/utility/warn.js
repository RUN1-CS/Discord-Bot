const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const MAX_STRIKES = 3;

// Stored at app/data/warnings.json - mount ./app/data as a Docker volume to persist it
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "warnings.json");

/** Shape: { [guildId]: { [userId]: { strikes: number, history: [{ reason, moderatorId, timestamp }] } } } */
function loadWarnings() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveWarnings(data) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE); // atomic-ish write, avoids corrupt files
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user (3 strikes = ban recommendation)")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to warn")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the warning")
        .setRequired(true)
        .setMaxLength(400),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason", true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (targetUser.bot) {
      return interaction.editReply("You can't warn a bot.");
    }
    if (targetUser.id === interaction.user.id) {
      return interaction.editReply("You can't warn yourself.");
    }

    // Hierarchy check if the user is still in the server
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
          "You cannot warn someone with an equal or higher role than yours.",
        );
      }
    }

    // Increment strike
    const warnings = loadWarnings();
    const guildData = (warnings[interaction.guildId] ??= {});
    const userData = (guildData[targetUser.id] ??= { strikes: 0, history: [] });

    userData.strikes += 1;
    userData.history.push({
      reason,
      moderatorId: interaction.user.id,
      timestamp: new Date().toISOString(),
    });
    saveWarnings(warnings);

    const strikes = userData.strikes;

    // DM the warned user
    let dmSent = true;
    try {
      await targetUser.send(
        `⚠️ You have received a **warning** in **${interaction.guild.name}**.\n` +
          `**Reason:** ${reason}\n` +
          `**Strikes:** ${strikes}/${MAX_STRIKES}`,
      );
    } catch {
      dmSent = false; // DMs closed or blocked
    }

    let reply =
      `⚠️ **${targetUser.tag}** has been warned. (${strikes}/${MAX_STRIKES} strikes)\n` +
      `**Reason:** ${reason}` +
      (dmSent ? "" : "\n*(Could not DM the user.)*");

    // Strike limit reached -> notify the admin who issued the warning
    if (strikes >= MAX_STRIKES) {
      reply +=
        `\n\n🚨 **${targetUser.tag}** has reached ${MAX_STRIKES} strikes. ` +
        `A ban is recommended - use \`/ban\`.`;

      try {
        await interaction.user.send(
          `🚨 **Ban recommended** in **${interaction.guild.name}**\n` +
            `**${targetUser.tag}** (${targetUser.id}) has reached ${strikes}/${MAX_STRIKES} strikes.\n` +
            `Latest reason: ${reason}\n` +
            `Use \`/ban user:${targetUser.tag} reason:...\` to ban them.`,
        );
      } catch {
        reply += "\n*(I couldn't DM you this notice, so please note it here.)*";
      }
    }

    return interaction.editReply(reply);
  },
};
