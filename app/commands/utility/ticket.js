/**
 * /commands/utility/ticket.js
 * This file contains the command implementation for creating a ticket.
 * Made by ルン1 ©2026
 *  */
const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

// Optional settings in app/config.json:
//   "ticketCategoryId":  "<category channel ID>"  -> tickets are created inside this category
//   "ticketStaffRoleId": "<role ID>"              -> this role can see/handle tickets too
// Members with the Administrator permission can always see every channel, no setup needed.
let config = {};
try {
  config = require("../../config.json");
} catch {
  // config.json missing - run with defaults
}

const TOPIC_PREFIX = "ticket:"; // channel topic = "ticket:<ownerUserId>", used to identify tickets
const CLOSE_DELAY_MS = 5000;

const ticketOwnerId = (channel) =>
  channel?.topic?.startsWith(TOPIC_PREFIX)
    ? channel.topic.slice(TOPIC_PREFIX.length)
    : null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function openTicket(interaction) {
  const reason =
    interaction.options.getString("reason") ?? "No reason provided";
  const { guild, user } = interaction;

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const botMember = guild.members.me;
  if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.editReply(
      "I need the **Manage Channels** permission to create tickets.",
    );
  }

  // One open ticket per user
  const channels = await guild.channels.fetch();
  const existing = channels.find(
    (c) => c && c.topic === `${TOPIC_PREFIX}${user.id}`,
  );
  if (existing) {
    return interaction.editReply(
      `You already have an open ticket: ${existing}`,
    );
  }

  // Permissions: hidden from everyone, visible to the user, the bot and the staff role
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
    {
      id: botMember.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];

  const staffRole = config.ticketStaffRoleId
    ? guild.roles.cache.get(config.ticketStaffRoleId)
    : null;
  if (staffRole) {
    overwrites.push({
      id: staffRole.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  const safeName =
    user.username.toLowerCase().replace(/[^a-z0-9]/g, "") || "user";

  let channel;
  try {
    channel = await guild.channels.create({
      name: `ticket-${safeName}`.slice(0, 90),
      type: ChannelType.GuildText,
      parent: config.ticketCategoryId || null,
      topic: `${TOPIC_PREFIX}${user.id}`,
      permissionOverwrites: overwrites,
      reason: `Ticket opened by ${user.tag}`,
    });
  } catch (error) {
    console.error("Failed to create ticket channel:", error);
    return interaction.editReply(
      "Failed to create the ticket channel. Check my permissions and the configured category.",
    );
  }

  await channel.send({
    content: `${user}${staffRole ? ` ${staffRole}` : ""}`,
    embeds: [
      {
        title: "🎫 New ticket",
        description:
          `**Opened by:** ${user}\n**Reason:** ${reason}\n\n` +
          "Describe your issue and a staff member will be with you shortly.\n" +
          "Use `/ticket close` when the issue is resolved.",
        color: 0x5865f2,
        timestamp: new Date().toISOString(),
      },
    ],
    allowedMentions: {
      users: [user.id],
      roles: staffRole ? [staffRole.id] : [],
    },
  });

  return interaction.editReply(`Your ticket has been created: ${channel}`);
}

async function closeTicket(interaction) {
  const reason =
    interaction.options.getString("reason") ?? "No reason provided";
  const { channel, user, member } = interaction;

  const ownerId = ticketOwnerId(channel);
  if (!ownerId) {
    return interaction.reply({
      content: "This command only works inside a ticket channel.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const isOwner = ownerId === user.id;
  const isStaff =
    member.permissions.has(PermissionFlagsBits.ManageChannels) ||
    (config.ticketStaffRoleId &&
      member.roles.cache.has(config.ticketStaffRoleId));

  if (!isOwner && !isStaff) {
    return interaction.reply({
      content: "Only the ticket owner or staff can close this ticket.",
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.reply(
    `🔒 Ticket closed by ${user}.\n**Reason:** ${reason}\nThis channel will be deleted in ${CLOSE_DELAY_MS / 1000} seconds.`,
  );

  await sleep(CLOSE_DELAY_MS);

  try {
    await channel.delete(`Ticket closed by ${user.tag}: ${reason}`);
  } catch (error) {
    console.error("Failed to delete ticket channel:", error);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Support tickets")
    .addSubcommand((sub) =>
      sub
        .setName("open")
        .setDescription("Open a private ticket with the staff")
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("What do you need help with?")
            .setRequired(false)
            .setMaxLength(300),
        ),
    )
    .addSubcommand((sub) =>
      sub
        .setName("close")
        .setDescription("Close the current ticket")
        .addStringOption((option) =>
          option
            .setName("reason")
            .setDescription("Reason for closing")
            .setRequired(false)
            .setMaxLength(300),
        ),
    )
    .setDMPermission(false),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === "open") return openTicket(interaction);
    if (subcommand === "close") return closeTicket(interaction);
  },
};
