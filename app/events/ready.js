/**
 * /events/ready.js
 * This file contains the event handler for when the bot is ready.
 * Made by ルン1 ©2025
 *  */
const { Events } = require("discord.js");

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
