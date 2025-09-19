const { Events } = require('discord.js')
const { setup } = require('../utils/setup')
module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Ready, logged in as ${client.user.tag}!`)
        const apis = await setup()
        client.radarr = apis.radarr
        client.sonarr = apis.sonarr
    },
};