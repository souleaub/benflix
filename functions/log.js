// Function to log specific messages to the log channel
// This function can be used in any command file by requiring it

const { logChannelId } = require('../config.json');
const { EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

module.exports = {
    log: async function (interaction, message, color = '#0000FF', title = 'Log', user = null,logtochannel = false, logtofile = false) {

        if (logtochannel) {
        const logChannel = interaction.client.channels.cache.get(logChannelId);
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(message)
            .setTimestamp()
            .setColor(color);
        await logChannel.send({ embeds: [embed] });
        }
        if (logtofile) {

            const date = new Date();
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const day = date.getDate();
            
            const hour = date.getHours();
            const minute = date.getMinutes();
            const second = date.getSeconds();

            if (!fs.existsSync(path.join(__dirname, '../logs'))) {
                fs.mkdirSync(path.join(__dirname, '../logs'));
            }

            if (!fs.existsSync(path.join(__dirname, `../logs/log_${year}-${month}-${day}.log`))) {
                fs.writeFileSync(path.join(__dirname, `../logs/log_${year}-${month}-${day}.log`), `Log for ${year}-${month}-${day}`
                );
            }
            fs.appendFileSync(path.join(__dirname, `../logs/log_${year}-${month}-${day}.log`), `\n[${hour}:${minute}:${second} UTC] ${user} : ${title} : ${message}`);

        }
            
    }

}
