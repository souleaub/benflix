const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('movies')
        .setDescription('Search for movies')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('Movie title to search for')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('query');

        try {
            await interaction.deferReply();

            const radarr = interaction.client.radarr;
            if (!radarr) {
                return await interaction.editReply('❌ Radarr API not initialized. Please check your configuration.');
            }

            const searchResults = await radarr.searchMovies(query);

            if (!searchResults || searchResults.length === 0) {
                return await interaction.editReply(`No movies found for "${query}"`);
            }

            // Limit to first 10 results for dropdown
            const movies = searchResults.slice(0, 10);

            const embed = new EmbedBuilder()
                .setTitle(`<� Movie Search Results for "${query}"`)
                .setDescription(`Found ${searchResults.length} movies (showing first ${movies.length})`)
                .setColor(0x0099FF)
                .setTimestamp();

            // Add movie details to embed
            movies.forEach((movie, index) => {
                embed.addFields({
                    name: `${index + 1}. ${movie.title} (${movie.year || 'Unknown'})`,
                    value: `**TMDB ID:** ${movie.tmdbId}\n**Overview:** ${movie.overview ? movie.overview.substring(0, 100) + '...' : 'No overview available'}`,
                    inline: false
                });
            });

            // Store movie data for later retrieval
            if (!interaction.client.movieCache) {
                interaction.client.movieCache = new Map();
            }
            movies.forEach(movie => {
                interaction.client.movieCache.set(movie.tmdbId.toString(), movie);
            });

            // Create dropdown with movie options
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('movie_select')
                .setPlaceholder('Select a movie to download')
                .addOptions(
                    movies.map((movie) => ({
                        label: `${movie.title} (${movie.year || 'Unknown'})`.substring(0, 100),
                        description: `TMDB: ${movie.tmdbId}`,
                        value: movie.tmdbId.toString()
                    }))
                );

            const downloadButton = new ButtonBuilder()
                .setCustomId('download_selected_movie')
                .setLabel('=� Download Selected Movie')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true); // Initially disabled until selection

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(downloadButton);

            await interaction.editReply({
                embeds: [embed],
                components: [row1, row2]
            });

        } catch (error) {
            console.error('Error searching movies:', error);
            await interaction.editReply(`Error searching for movies: ${error.message}`);
        }
    },

    async handleSelectMenu(interaction) {
        if (interaction.customId === 'movie_select') {
            const tmdbId = interaction.values[0];
            const selectedLabel = interaction.component.options.find(opt => opt.value === tmdbId)?.label || 'Selected Movie';

            // Update the button to be enabled and store the selected movie data
            const downloadButton = new ButtonBuilder()
                .setCustomId(`download_movie_${tmdbId}`)
                .setLabel(`Download Selected Movie`)
                .setStyle(ButtonStyle.Success);

            const selectMenu = StringSelectMenuBuilder.from(interaction.message.components[0].components[0])
                .setPlaceholder(`Selected: ${selectedLabel}`);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(downloadButton);

            await interaction.update({
                components: [row1, row2]
            });
        }
    },

    async handleButton(interaction) {
        if (interaction.customId.startsWith('download_movie_')) {
            const tmdbId = interaction.customId.replace('download_movie_', '');

            try {
                await interaction.deferReply({ ephemeral: true });

                const radarr = interaction.client.radarr;
                if (!radarr) {
                    return await interaction.editReply('❌ Radarr API not initialized. Please check your configuration.');
                }

                // Get quality profiles and root folders for movie addition
                const profiles = await radarr.getProfiles();
                const rootFolders = await radarr.getRootFolders();

                if (!profiles || profiles.length === 0) {
                    return await interaction.editReply('L No quality profiles found in Radarr');
                }

                if (!rootFolders || rootFolders.length === 0) {
                    return await interaction.editReply('L No root folders found in Radarr');
                }

                // Get movie data from cache
                const movieToAdd = interaction.client.movieCache?.get(tmdbId);

                if (!movieToAdd) {
                    return await interaction.editReply('❌ Movie not found in cache. Please search again.');
                }

                // Prepare movie data for addition
                const movieData = {
                    title: movieToAdd.title,
                    year: movieToAdd.year,
                    tmdbId: parseInt(tmdbId),
                    qualityProfileId: profiles[0].id, // Use first quality profile
                    rootFolderPath: rootFolders[0].path, // Use first root folder
                    monitored: true,
                    minimumAvailability: 'announced',
                    addOptions: {
                        searchForMovie: true // Automatically search for movie after adding
                    }
                };

                // Add the movie to Radarr
                await radarr.addMovie(movieData);

                const successEmbed = new EmbedBuilder()
                    .setTitle(' Movie Added Successfully')
                    .setDescription(`**${movieData.title} (${movieData.year})** has been added to Radarr`)
                    .addFields(
                        { name: 'Quality Profile', value: profiles[0].name, inline: true },
                        { name: 'Root Folder', value: rootFolders[0].path, inline: true },
                        { name: 'Auto Search', value: 'Enabled', inline: true }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });

            } catch (error) {
                console.error('Error adding movie:', error);

                let errorMessage = 'Failed to add movie to Radarr';
                if (error.message.includes('already exists')) {
                    errorMessage = '� This movie is already in your Radarr library';
                } else if (error.message.includes('401')) {
                    errorMessage = 'L Unauthorized - check your API key';
                } else if (error.message.includes('404')) {
                    errorMessage = 'L Radarr instance not found - check your URL';
                }

                await interaction.editReply(`${errorMessage}: ${error.message}`);
            }
        }
    }
};