const path = require("path");
const klaw = require("klaw");
const fetch = require("snekfetch");
const moment = require("moment");
const { Client, Collection, MessageEmbed } = require("discord.js");

const commandsPath = path.join(__dirname, "commands");

new class extends Client {
  constructor() {
    super({ fetchAllMembers: true });

    this.config = require("../config.json");
    this.Constants = require("./Constants.json");
    this.commands = new Collection();
    
    this.handlers = {};
    this.handlers.db = new (require("./handlers/database.js"))(this);

    this.init();

    this.on("ready", () => {
      console.log(`Client Information: \nUser: ${this.user.tag}\nGuilds: ${this.guilds.size}\nChannels: ${this.channels.size}\nUsers: ${this.users.size}`);
      this.user.setPresence({ activity: { name: `Message me for help!`, type: 0 } });
    });

    this.on("message", async message => {
      if (message.author.bot) return;
      if (this.config.discord.blacklist.includes(message.author.id)) return;

      if (message.channel.type === "dm")
        return this.handleDM(message);

      if (
        message.channel.parentID &&
        message.channel.parentID === this.config["discord"]["modmail"]["categoryID"] &&
        message.channel.id !== this.config["discord"]["modmail"]["logsID"] &&
        /modmail-\d+/.test(message.channel.name) &&
        !message.content.startsWith(`${this.config["discord"]["prefix"]}close`)
      )
        return this.handleModMailResponse(message);

      message.permArray = await new (require("./structures/permission.js"))().fetch(this, message);
      message.perm = message.permArray[0];

      if (!message.content.startsWith(this.config["discord"]["prefix"])) return;

      const content = message.content.slice(this.config["discord"]["prefix"].length);

      const command = await this.fetchCommand(content.split(" ")[0]);
      if (!command) return;

      return command.execute(message);

    });

    this.login(this.config["discord"]["token"]);
  }

  fetchCommand(text) {
    return new Promise((resolve, reject) => {
      if (this.commands.has(text)) return resolve(this.commands.get(text));
      this.commands.forEach(c => { if (c.aliases && c.aliases.includes(text)) return resolve(c); });
      return resolve();
    });
  }

  init() {
    klaw(commandsPath).on("data", item => {
      const file = path.parse(item.path);
      if (!file.ext || file.ext !== ".js") return;

      const command = new (require(`${file.dir}/${file.base}`))(this);
      this.commands.set(command.name, command);
    });
  }

  async hastebin(data) {
    const { body } = await fetch.post("https://haste.cheezewerks.com/documents").send(data).catch(e => { return false; });
    if (!body || !body.key) return false;
    return `https://haste.cheezewerks.com/${body.key}`;
  }

  async handleDM(message) {
    if (!this.guilds.get(this.config["discord"]["modmail"]["guildID"]).channels.some(c => c.name === `modmail-${message.author.id}`)) {
      const guild = this.guilds.get(this.config["discord"]["modmail"]["guildID"]);
      const member = await guild.members.fetch(message.author.id);

      const caseChannel = await guild.channels.create(`modmail-${message.author.id}`, {
        "parent": (this.guilds.get(this.config["discord"]["modmail"]["guildID"])).channels.get(this.config["discord"]["modmail"]["categoryID"]),
        "topic": `${message.author.tag} (${message.author.id})`,
        "type": "text"
      });

      const embed = new MessageEmbed()
        .setDescription(
          `**User:** ${message.author}\n` +
          `**Joined Server:** ${moment(member.joinedTimestamp).format("L")} (${moment(member.joinedTimestamp).from(moment())})\n` +
          `**Joined Discord**: ${moment(message.author.createdTimestamp).format("L")} (${moment(message.author.createdTimestamp).from(moment())})`
        )
        .setColor(this.Constants["colours"]["info"])
        .setFooter("Only seen by staff")
        .setTimestamp();

      await caseChannel.send({ embed });
      await caseChannel.send(`\n**${message.author.username}:** ${message.content}`);

      message.author.send("Thank you for your ModMail. It will be reviewed by a moderator at their earliest convenience.")
        .catch(console.error);
      return;
    }

    const caseChannel = (this.guilds.get(this.config["discord"]["modmail"]["guildID"])).channels
      .find(c => c.name === `modmail-${message.author.id}`);
    caseChannel.send(`**${message.author.username}:** ${message.content}`);
    if (message.attachments.size > 0) {
      caseChannel.send(`**Images:** ${message.attachments.map(att => att.url).join("\n")}`);
    }
    return;
  }

  async handleModMailResponse(message) {
    const author = await this.users.fetch((/\d+/.exec(message.channel.name))[0]);
    author.send(`**${message.author.username}:** ${message.content}`)
      .catch(e => message.channel.send(`Cannot DM user. Suggestion: Close ModMail case.`));
    if (message.attachments.size > 0) {
      author.send(`**${message.author.username}:** ${message.attachments.map(att => att.url).join("\n")}`)
        .catch(e => message.channel.send(`Cannot DM user. Suggestion: Close ModMail case.`));
    }
    return;
  }
};

process.on("message", msg => console.log(msg))
  .on("uncaughtException", err => console.log(err.stack, true))
  .on("unhandledRejection", err => console.log(err.stack, true));
