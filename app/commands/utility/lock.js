const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock a channel so only admins can send messages")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to lock (default: this channel)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the lock")
        .setRequired(false)
        .setMaxLength(300),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    const channel =
      interaction.options.getChannel("channel") ?? interaction.channel;
    const reason =
      interaction.options.getString("reason") ?? "No reason provided";
    const { guild } = interaction;
    const botMember = guild.members.me;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    if (
      ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
        channel.type,
      )
    ) {
      return interaction.editReply("I can only lock text channels.");
    }

    // Editing permission overwrites needs Manage Roles ("Manage Permissions") + Manage Channels
    const botPerms = channel.permissionsFor(botMember);
    if (
      !botPerms?.has([
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
      ])
    ) {
      return interaction.editReply(
        `I need **Manage Channels** and **Manage Roles** in ${channel} to lock it.`,
      );
    }

    const everyone = guild.roles.everyone;
    const existing = channel.permissionOverwrites.cache.get(everyone.id);
    if (existing?.deny.has(PermissionFlagsBits.SendMessages)) {
      return interaction.editReply(`${channel} is already locked.`);
    }

    try {
      // Keep the bot able to talk in the channel, otherwise the @everyone deny would mute it too
      await channel.permissionOverwrites.edit(
        botMember.id,
        { SendMessages: true },
        { reason: `Lock: bot access (by ${interaction.user.tag})` },
      );

      // Admins bypass channel overwrites, so only they can still send messages
      await channel.permissionOverwrites.edit(
        everyone,
        {
          SendMessages: false,
          SendMessagesInThreads: false,
          AddReactions: false,
        },
        { reason: `${reason} (locked by ${interaction.user.tag})` },
      );
    } catch (error) {
      console.error("Failed to lock channel:", error);
      return interaction.editReply(
        `Failed to lock ${channel}. Check my permissions and role position.`,
      );
    }

    await channel
      .send(
        `🔒 This channel has been **locked** by a moderator.\n**Reason:** ${reason}`,
      )
      .catch(() => {});

    return interaction.editReply(`🔒 ${channel} has been locked.`);
  },
};
