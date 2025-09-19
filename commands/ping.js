const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Ping')
        .setDefaultMemberPermissions(0),
    async execute(interaction) {
        await interaction.reply('pong');
    }
}