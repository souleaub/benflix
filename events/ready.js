const { Events } = require('discord.js')
const { setup } = require('../utils/setup')
module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`Ready, logged in as ${client.user.tag}!`)
        setup()
    },
};