const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const MAX_STRIKES = 3;

// Same file that warn.js writes to
const DATA_DIR = path.join(__dirname, "..", "..", "data");
const DATA_FILE = path.join(DATA_DIR, "warnings.json");

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
  fs.renameSync(tmp, DATA_FILE);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unwarn")
    .setDescription("Remove strike points from a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove strikes from")
        .setRequired(true),
    )
    .addIntegerOption((option) =>
      option
        .setName("strike_points")
        .setDescription("How many strike points to remove (most recent first)")
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const points = interaction.options.getInteger("strike_points", true);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const warnings = loadWarnings();
    const userData = warnings?.[interaction.guildId]?.[targetUser.id];

    if (!userData || userData.strikes <= 0 || userData.history.length === 0) {
      return interaction.editReply(
        `**${targetUser.tag}** has no strikes to remove.`,
      );
    }

    // Remove the most recent entries; never go below zero
    const removed = Math.min(points, userData.history.length);
    userData.history.splice(userData.history.length - removed, removed);
    userData.strikes = Math.max(0, userData.strikes - removed);
    saveWarnings(warnings);

    return interaction.editReply(
      `✅ Removed **${removed}** strike point${removed === 1 ? "" : "s"} from **${targetUser.tag}**.\n` +
        `They now have **${userData.strikes}/${MAX_STRIKES}** strikes.` +
        (removed < points
          ? `\n*(You asked for ${points}, but they only had ${removed}.)*`
          : ""),
    );
  },
};
