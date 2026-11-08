const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
  MessageFlags,
} = require("discord.js");

module.exports = {
  ephemeral: true,
  data: new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock a previously locked channel")
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("Channel to unlock (default: this channel)")
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("Reason for the unlock")
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


    if (
      ![ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(
        channel.type,
      )
    ) {
      return interaction.editReply("I can only unlock text channels.");
    }

    const botPerms = channel.permissionsFor(botMember);
    if (
      !botPerms?.has([
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ManageRoles,
      ])
    ) {
      return interaction.editReply(
        `I need **Manage Channels** and **Manage Roles** in ${channel} to unlock it.`,
      );
    }

    const everyone = guild.roles.everyone;
    const existing = channel.permissionOverwrites.cache.get(everyone.id);
    if (!existing?.deny.has(PermissionFlagsBits.SendMessages)) {
      return interaction.editReply(`${channel} is not locked.`);
    }

    try {
      // null = reset to the channel's/category's default instead of forcing "allow"
      await channel.permissionOverwrites.edit(
        everyone,
        {
          SendMessages: null,
          SendMessagesInThreads: null,
          AddReactions: null,
        },
        { reason: `${reason} (unlocked by ${interaction.user.tag})` },
      );

      // Remove the bot's own helper overwrite that /lock added
      await channel.permissionOverwrites.edit(
        botMember.id,
        { SendMessages: null },
        { reason: `Unlock: bot access cleanup (by ${interaction.user.tag})` },
      );
    } catch (error) {
      console.error("Failed to unlock channel:", error);
      return interaction.editReply(
        `Failed to unlock ${channel}. Check my permissions and role position.`,
      );
    }

    await channel
      .send(`🔓 This channel has been **unlocked**.\n**Reason:** ${reason}`)
      .catch(() => {});

    return interaction.editReply(`🔓 ${channel} has been unlocked.`);
  },
};
