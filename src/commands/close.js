const Command = require('../structures/command.js'),
  moment = require('moment'),
  { MessageEmbed } = require('discord.js');

module.exports = class extends Command {
  constructor(client, filePath) {
    super(client, filePath, {
      name: "close",
      aliases: []
    });
  }

  async execute(message) {
    if (message.perm < this.client.Constants['perms']['mod']) return;
    if (!/modmail-\d+/.test(message.channel.name)) return;
    const author = await this.client.users.fetch((/\d+/.exec(message.channel.name))[0]);
    message.guild.members.fetch(author.id)
      .then(async m => await this.memberClose(message, author, m))
      .catch(async e => await this.noMemberClose(message, author));
  }

  async memberClose(message, author, member) {
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const haste = await this.client.hastebin(
      messages.map(m => `${moment(m.createdAt).format("dddd MMMM Do, YYYY, hh:mm A")} | ${m.author.tag} (${m.author.id}):\n${m.content}`).join("\n\n=-= =-= =-= =-= =-=\n\n")
    );

    if (haste === false) return message.channel.send('Hastebin down. Data not saved. Case not closed.');

    const embed = new MessageEmbed()
      .setTitle(`${author.tag} (${author.id})`)
      .setDescription(
        `\n` +
        `**Joined Server:** ${moment(member.joinedTimestamp).format('L')} (${moment(member.joinedTimestamp).from(moment())})\n` +
        `**Joined Discord**: ${moment(member.user.createdTimestamp).format('L')} (${moment(member.user.createdTimestamp).from(moment())})\n` +
        `\n` +
        `**Closed By:** ${message.author.tag} (${message.author.id})\n` +
        `**Logs:** ${haste}`
      )
      .setColor(this.client.Constants['colours']['info'])
      .setTimestamp();

    message.guild.channels.get(this.client.config['discord']['modmail']['logsID'])
      .send({ embed });
    //.send(`\`\`\`asciidoc\n= ${author.tag} (${author.id}) =\nClosed By:: ${message.author.tag} (${message.author.id})\nLogs:: ${haste}\n\`\`\``)

    author.send(`**Your ModMail case has been marked resolved by:** ${message.author.tag} (${message.author.id})`)
      .then(m => message.channel.send(`Closing ModMail Case. Channel will be deleted in 10 seconds.`))
      .catch(e => message.channel.send(`Couldn't DM User. Closing ModMail Case. Channel will be deleted in 10 seconds.`));

    setTimeout(() => {
      message.channel.delete(`Case Closed: ${author.tag} (${author.id}) | By: ${message.author.tag} (${message.author.id})`);
    }, 10 * 1000);
  }

  async noMemberClose(message, author) {
    const messages = await message.channel.messages.fetch({ limit: 100 });
    const haste = await this.client.hastebin(
      messages.map(m => `${moment(m.createdAt).format("dddd MMMM Do, YYYY, hh:mm A")} | ${m.author.tag} (${m.author.id}):\n${m.content}`).join("\n\n=-= =-= =-= =-= =-=\n\n")
    );

    if (haste === false) return message.channel.send('Hastebin down. Data not saved. Case not closed.');

    const embed = new MessageEmbed()
      .setTitle(`${author.tag} (${author.id})`)
      .setDescription(
        `\n` +
        `**Error:** Could not fetch member.\n` +
        `\n` +
        `**Closed By:** ${message.author.tag} (${message.author.id})\n` +
        `**Logs:** ${haste}`
      )
      .setColor(this.client.Constants['colours']['error'])
      .setTimestamp();

    message.guild.channels.get(this.client.config['discord']['modmail']['logsID'])
      .send({ embed });
    //.send(`\`\`\`asciidoc\n= ${author.tag} (${author.id}) =\nClosed By:: ${message.author.tag} (${message.author.id})\nLogs:: ${haste}\n\`\`\``)

    message.channel.send(`User no longer in server. Closing ModMail Case. Channel will be deleted in 10 seconds.`);

    setTimeout(() => {
      message.channel.delete(`Case Closed: ${author.tag} (${author.id}) | By: ${message.author.tag} (${message.author.id})`);
    }, 10 * 1000);
  }
};