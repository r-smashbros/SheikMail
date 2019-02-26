const Command = require('../structures/command.js'),
  { MessageEmbed } = require('discord.js');

module.exports = class extends Command {
  constructor(client, filePath) {
    super(client, filePath, {
      name: "ping",
      aliases: []
    });
  }

  async execute(message) {
    message.channel.send("Pinging...")
      .then(m => m.edit(`Client Ping: ${m.createdTimestamp - message.createdTimestamp} | API Ping: ${this.client.pings[0]}`));
  }
};