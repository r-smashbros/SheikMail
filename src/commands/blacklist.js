const Command = require('../structures/command.js'),
  moment = require('moment'),
  fs = require('fs'),
  { MessageEmbed } = require('discord.js');

module.exports = class extends Command {
  constructor(client, filePath) {
    super(client, filePath, {
      name: "blacklist",
      aliases: []
    });
  }

  async execute(message) {
    if (message.perm < this.client.Constants['perms']['mod']) return;

    const match = /(\d{17,20})/.exec(message.content);
    if (!match) return message.channel.send('ERR: Invalid ID Provided')

    const blacklist = this.client.config['discord']['blacklist']
    if (blacklist.includes(match[1])) delete blacklist[blacklist.indexOf(match[1])];
    else blacklist.push(match[1]);

    // It is bad practice to use JSON as a DB, but it is more reasonable for limited usage than other solutions with overhead.
    fs.writeFile('config.json', JSON.stringify(this.client.config), (err) => { 
      if (err) message.channel.send(`ERR:\n\`\`\`${err}\`\`\` `);
      return message.channel.send(`**${match[1]}** has been ${blacklist.includes(match[1]) ? 'blacklisted' : 'unblacklisted'}.`);
    })
  }
};