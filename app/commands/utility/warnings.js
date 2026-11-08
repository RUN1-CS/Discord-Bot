const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  MessageFlags,
} = require("discord.js");
const fs = require("node:fs");
const path = require("node:path");

const MAX_STRIKES = 3;
const MAX_ENTRIES_SHOWN = 10;

// Same file that warn.js writes to
const DATA_FILE = path.join(__dirname, "..", "..", "data", "warnings.json");

function loadWarnings() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

module.exports = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Show the warnings of a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to look up")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);


    const userData = loadWarnings()?.[interaction.guildId]?.[targetUser.id];

    if (!userData || userData.history.length === 0) {
      return interaction.editReply(`**${targetUser.tag}** has no warnings.`);
    }

    const { strikes, history } = userData;

    // Newest first, capped so the embed never exceeds Discord's limits
    const shown = history.slice(-MAX_ENTRIES_SHOWN).reverse();
    const offset = history.length;

    const lines = shown.map((entry, i) => {
      const number = offset - i;
      const unix = Math.floor(new Date(entry.timestamp).getTime() / 1000);
      return (
        `**#${number}** - <t:${unix}:f> (<t:${unix}:R>)\n` +
        `Reason: ${entry.reason}\n` +
        `By: <@${entry.moderatorId}>`
      );
    });

    const embed = new EmbedBuilder()
      .setTitle(`Warnings for ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL())
      .setColor(strikes >= MAX_STRIKES ? 0xe74c3c : 0xf1c40f)
      .setDescription(lines.join("\n\n").slice(0, 4000))
      .setFooter({
        text:
          `Strikes: ${strikes}/${MAX_STRIKES}` +
          (history.length > MAX_ENTRIES_SHOWN
            ? ` - showing latest ${MAX_ENTRIES_SHOWN} of ${history.length}`
            : ""),
      });

    return interaction.editReply({ embeds: [embed] });
  },
};
