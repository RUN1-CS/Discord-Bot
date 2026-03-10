/**
 * /events/messageCreate.js
 * Event handler for when a message is created.
 * Made by ルン1 ©2025
 */
const { Events } = require("discord.js");

module.exports = {
	name: Events.MessageCreate,

	async execute(message) {
		if (message.author.bot || message.member.permissions.has("ModerateMembers") || message.member.permissions.has("Administrator")) return; // ignore bot and Admin messages

		// Regex to detect Windows OS mentions
		const winslop = new RegExp("\\b(?:(?:boot\\s+|dual\\s+boot\\s+|install\\s+|update\\s+)?(?:win(?:dows)?\\s?(?:10|11|7|xp|vista|95|98|nt|server|pro|home)?|wsl|microsoft\\s+windows)|(?:xp|vista|7|10|11)\\s+(?:was|is|is\\s+the)\\s+best\\s+windows)\\b(?!.*\\b(win|won|window)\\s+(the|game|match|prize)\\b)", "i");

		const matches = winslop.test(message.content);

		if (matches && message.member) {
			// Timeout duration in milliseconds (here: 1 minute)
			const duration = 60_000;
			await message.member.timeout(duration, "Mentioned Windows OS");

			// Delete that slop message
			await message.delete().catch(err => console.error("Failed to delete message:", err));
		}
	}
};
