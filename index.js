const dotenv = require('dotenv')
const { Client, Events, GatewayIntentBits, Collection, Partials } = require('discord.js')
const path = require('path')
const fs = require('fs')
dotenv.config()

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildVoiceStates], 
    partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.GuildMember, Partials.User] })

client.commands = new Collection()

const eventsPath = path.join(__dirname, 'events')
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once) {
		client.once(event.name, (...args) => event.execute(...args));
	} else {
		client.on(event.name, (...args) => event.execute(...args));
	}
}


const commandsPath = path.join(__dirname, 'commands')
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.warn(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.warn(`[WARNING] Command ${interaction.commandName} not found!`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    } else if (interaction.isStringSelectMenu()) {
        // Handle select menu interactions
        let command;
        if (interaction.customId === 'movie_select') {
            command = interaction.client.commands.get('movies');
        } else if (interaction.customId === 'series_select' || interaction.customId.startsWith('season_select_')) {
            command = interaction.client.commands.get('tvshows');
        }

        if (command && command.handleSelectMenu) {
            try {
                await command.handleSelectMenu(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while handling the selection!', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        // Handle button interactions
        let command;
        if (interaction.customId.startsWith('download_movie_')) {
            command = interaction.client.commands.get('movies');
        } else if (interaction.customId.startsWith('download_series_')) {
            command = interaction.client.commands.get('tvshows');
        }

        if (command && command.handleButton) {
            try {
                await command.handleButton(interaction);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error while handling the button!', ephemeral: true });
            }
        }
    }
})


client.login(process.env.BOT_TOKEN);