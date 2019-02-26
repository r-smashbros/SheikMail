const config = require('../../config.json');
const Constants = require('../Constants.json');

class PermissionLevel {

  fetch(client, message) {
    if (!message.author || !message.member) return [0, "Guild Member"];

    if (config['discord']['roleAuth']['dev'].includes(message.author.id))
      return [
        Constants['perms']['dev'],
        "Developer"
      ];

    if (message.member.roles.some(r => config['discord']['roleAuth']['admin'].includes(r.id)))
      return [
        Constants['perms']['admin'],
        "Admin"
      ];

    if (message.member.roles.some(r => config['discord']['roleAuth']['mod'].includes(r.id)))
      return [
        Constants['perms']['mod'],
        "Mod"
      ];

    return [0, "Guild Member"];
  }
}

module.exports = PermissionLevel;