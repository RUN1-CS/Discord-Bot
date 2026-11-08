const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const UNIT_MS = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
const BULK_DELETE_LIMIT_MS = 14 * UNIT_MS.d; // Discord can't bulk delete older messages
const MAX_SCAN = 5000; // max messages inspected per run, protects against huge channels

/** "30m" -> 1800000. Returns null if the format is invalid. */
function parseDuration(input) {
  const match = /^(\d+)\s*([dhms])$/i.exec(input.trim());
  if (!match) return null;
  const ms = Number(match[1]) * UNIT_MS[match[2].toLowerCase()];
  return ms > 0 ? ms : null;
}

function formatDuration(input) {
  const match = /^(\d+)\s*([dhms])$/i.exec(input.trim());
  const names = { s: "second", m: "minute", h: "hour", d: "day" };
  const amount = Number(match[1]);
  return `${amount} ${names[match[2].toLowerCase()]}${amount === 1 ? "" : "s"}`;
}

module.exports = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Delete a user's messages in this channel")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user whose messages to delete")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("time")
        .setDescription(
          "Only delete messages from the last X, e.g. 30s, 15m, 2h, 7d (default: all)",
        )
        .setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    const targetUser = interaction.options.getUser("user", true);
    const timeInput = interaction.options.getString("time");
    const channel = interaction.channel;


    // Validate time
    let cutoff = 0; // 0 = no time limit
    if (timeInput) {
      const duration = parseDuration(timeInput);
      if (!duration) {
        return interaction.editReply(
          "Invalid time format. Use a number followed by `d`, `h`, `m` or `s`, e.g. `30m`, `2h`, `7d`.",
        );
      }
      cutoff = Date.now() - duration;
    }

    // Validate channel + bot permissions
    if (!channel?.isTextBased() || !channel.messages) {
      return interaction.editReply(
        "I can only purge messages in text channels.",
      );
    }
    const botPerms = channel.permissionsFor(interaction.guild.members.me);
    if (
      !botPerms?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
      ])
    ) {
      return interaction.editReply(
        "I need **View Channel**, **Read Message History** and **Manage Messages** in this channel.",
      );
    }

    // Collect the user's messages by paging backwards through history
    const toDelete = [];
    let before;
    let scanned = 0;
    let reachedLimit = false;

    try {
      while (scanned < MAX_SCAN) {
        const batch = await channel.messages.fetch({ limit: 100, before });
        if (batch.size === 0) break;

        scanned += batch.size;

        for (const message of batch.values()) {
          if (
            message.author.id === targetUser.id &&
            message.createdTimestamp >= cutoff
          ) {
            toDelete.push(message);
          }
        }

        const oldest = batch.last();
        before = oldest.id;

        // Everything further back is outside the requested time range
        if (cutoff && oldest.createdTimestamp < cutoff) break;
        if (batch.size < 100) break;
      }
      reachedLimit = scanned >= MAX_SCAN;
    } catch (error) {
      console.error("Failed to fetch messages for purge:", error);
      return interaction.editReply("Failed to read the channel history.");
    }

    if (toDelete.length === 0) {
      return interaction.editReply(
        `No messages from **${targetUser.tag}** found` +
          (timeInput ? ` in the last ${formatDuration(timeInput)}` : "") +
          " in this channel.",
      );
    }

    // Split: recent messages can be bulk deleted, older ones one by one
    const now = Date.now();
    const recent = toDelete.filter(
      (m) => now - m.createdTimestamp < BULK_DELETE_LIMIT_MS - 60_000,
    );
    const old = toDelete.filter((m) => !recent.includes(m));

    let deleted = 0;

    try {
      for (let i = 0; i < recent.length; i += 100) {
        const chunk = recent.slice(i, i + 100);
        if (chunk.length === 1) {
          await chunk[0].delete();
          deleted += 1;
        } else {
          const result = await channel.bulkDelete(chunk, true);
          deleted += result.size;
        }
      }

      if (old.length > 0) {
        await interaction.editReply(
          `Deleting ${old.length} older message(s) one by one - this can take a while...`,
        );
        for (const message of old) {
          await message.delete().then(
            () => {
              deleted += 1;
            },
            () => {}, // already deleted or not deletable, skip
          );
        }
      }
    } catch (error) {
      console.error("Failed to purge messages:", error);
      return interaction.editReply(
        `Purge stopped early after deleting ${deleted} message(s). Check my permissions.`,
      );
    }

    return interaction.editReply(
      `🧹 Deleted **${deleted}** message(s) from **${targetUser.tag}** in ${channel}` +
        (timeInput ? ` (last ${formatDuration(timeInput)})` : "") +
        "." +
        (reachedLimit
          ? `\n*Scan limit of ${MAX_SCAN} messages reached - run it again to go further back.*`
          : ""),
    );
  },
};
