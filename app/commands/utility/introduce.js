/**
 * /commands/utility/introduce.js
 * This file contains the command implementation for introducing yourself.
 * Made by ルン1 ©2025
 *  */
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

const FALLBACK_COLOR = 0x5865f2;

// Setup options, in display order: [option name, emoji, label]
const SETUP_OPTIONS = [
  ["distribution", "🐧", "Distro"],
  ["programming_language", "💻", "Language"],
  ["window_manager", "🪟", "Window Manager"],
  ["ide", "🛠️", "IDE"],
  ["shell", "🐚", "Shell"],
];

/** Keeps user input safely inside Discord's embed field limits. */
const clip = (text, max = 200) =>
  text.length > max ? `${text.slice(0, max - 1)}…` : text;

/** Turns a Date into a Discord timestamp: full date + relative time. */
const stamp = (date) => {
  const unix = Math.floor(date.getTime() / 1000);
  return `<t:${unix}:D> (<t:${unix}:R>)`;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName("introduce")
    .setDescription("Introduces the user.")
    .addStringOption((option) => {
      return option
        .setName("nickname")
        .setDescription("Your preferred nickname.");
    })
    .addStringOption((option) => {
      return option.setName("hobby").setDescription("Your favorite hobby.");
    })
    .addStringOption((option) => {
      return option.setName("fun_fact").setDescription("A fun fact about you.");
    })
    .addStringOption((option) => {
      return option
        .setName("distribution")
        .setDescription("Your favorite Linux distribution.");
    })
    .addStringOption((option) => {
      return option
        .setName("programming_language")
        .setDescription("Your favorite programming language.");
    })
    .addStringOption((option) => {
      return option
        .setName("window_manager")
        .setDescription("Your favorite window manager.");
    })
    .addStringOption((option) => {
      return option.setName("ide").setDescription("Your favorite IDE.");
    })
    .addStringOption((option) => {
      return option.setName("shell").setDescription("Your favorite shell.");
    }),
  async execute(interaction) {
    // Force-fetch the user so we can get their banner and accent color.
    let user = interaction.user;
    try {
      user = await interaction.user.fetch(true);
    } catch {
      // Fall back to the cached user if the fetch fails.
    }

    const member = interaction.member;
    const displayName = member?.displayName ?? user.globalName ?? user.username;

    const nickname = interaction.options.getString("nickname");
    const hobby = interaction.options.getString("hobby");
    const funFact = interaction.options.getString("fun_fact");

    // ── Description ──────────────────────────────────────────────
    const name = nickname ? `**${clip(nickname, 64)}**` : `**${displayName}**`;
    const description = [
      `👋 Hey everyone, I'm ${name}!`,
      nickname ? `-# aka ${user.username}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const embed = new EmbedBuilder()
      .setColor(user.accentColor ?? member?.displayColor ?? FALLBACK_COLOR)
      .setAuthor({
        name: `${displayName} • Introduction`,
        iconURL: user.displayAvatarURL(),
      })
      .setTitle("✨ Nice to meet you!")
      .setDescription(description)
      .setThumbnail(user.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: `ID: ${user.id}`,
        iconURL: interaction.client.user.displayAvatarURL(),
      })
      .setTimestamp();

    // ── About me ─────────────────────────────────────────────────
    const about = [];
    if (hobby) about.push(`🎯 **Hobby:** ${clip(hobby)}`);
    if (funFact) about.push(`💡 **Fun fact:** ${clip(funFact, 300)}`);
    if (about.length) {
      embed.addFields({
        name: "📖 About Me",
        value: about.join("\n"),
      });
    }

    // ── Tech setup ───────────────────────────────────────────────
    const setup = SETUP_OPTIONS.map(([option, emoji, label]) => {
      const value = interaction.options.getString(option);
      return value ? `${emoji} **${label}:** ${clip(value)}` : null;
    }).filter(Boolean);

    if (setup.length) {
      embed.addFields({
        name: "🖥️ My Setup",
        value: setup.join("\n"),
      });
    }

    // ── Discord info ─────────────────────────────────────────────
    const discordInfo = [
      `🏷️ **Username:** ${user.username}`,
      `🎂 **Joined Discord:** ${stamp(user.createdAt)}`,
    ];
    if (member?.joinedAt) {
      discordInfo.push(`📥 **Joined this server:** ${stamp(member.joinedAt)}`);
    }
    embed.addFields({
      name: "🪪 Discord",
      value: discordInfo.join("\n"),
    });

    // Show the user's profile banner if they have one.
    const banner = user.bannerURL({ size: 1024 });
    if (banner) embed.setImage(banner);

    await interaction.editReply({
      embeds: [embed],
    });
  },
};
