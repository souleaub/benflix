const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tvshows')
        .setDescription('Search for TV shows')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('TV show title to search for')
                .setRequired(true)),

    async execute(interaction) {
        const query = interaction.options.getString('query');

        try {
            await interaction.deferReply();

            const sonarr = interaction.client.sonarr;
            if (!sonarr) {
                return await interaction.editReply('❌ Sonarr API not initialized. Please check your configuration.');
            }

            const searchResults = await sonarr.searchSeries(query);

            if (!searchResults || searchResults.length === 0) {
                return await interaction.editReply(`No TV shows found for "${query}"`);
            }

            // Limit to first 10 results for dropdown
            const series = searchResults.slice(0, 10);

            const embed = new EmbedBuilder()
                .setTitle(`📺 TV Show Search Results for "${query}"`)
                .setDescription(`Found ${searchResults.length} shows (showing first ${series.length})`)
                .setColor(0x0099FF)
                .setTimestamp();

            // Add series details to embed
            series.forEach((show, index) => {
                embed.addFields({
                    name: `${index + 1}. ${show.title} (${show.year || 'Unknown'})`,
                    value: `**TVDB ID:** ${show.tvdbId}\n**Overview:** ${show.overview ? show.overview.substring(0, 100) + '...' : 'No overview available'}`,
                    inline: false
                });
            });

            // Store series data for later retrieval
            if (!interaction.client.seriesCache) {
                interaction.client.seriesCache = new Map();
            }
            series.forEach(show => {
                interaction.client.seriesCache.set(show.tvdbId.toString(), show);
            });

            // Create dropdown with series options
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('series_select')
                .setPlaceholder('Select a TV show to download')
                .addOptions(
                    series.map((show) => ({
                        label: `${show.title} (${show.year || 'Unknown'})`.substring(0, 100),
                        description: `TVDB: ${show.tvdbId}`,
                        value: show.tvdbId.toString()
                    }))
                );

            const downloadButton = new ButtonBuilder()
                .setCustomId('download_selected_series')
                .setLabel('📺 Download Selected Series')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true); // Initially disabled until selection

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(downloadButton);

            await interaction.editReply({
                embeds: [embed],
                components: [row1, row2]
            });

        } catch (error) {
            console.error('Error searching TV shows:', error);
            await interaction.editReply(`Error searching for TV shows: ${error.message}`);
        }
    },

    async handleSelectMenu(interaction) {
        if (interaction.customId === 'series_select') {
            const tvdbId = interaction.values[0];
            const selectedLabel = interaction.component.options.find(opt => opt.value === tvdbId)?.label || 'Selected Series';

            // Get series data from cache to extract seasons
            const selectedSeries = interaction.client.seriesCache?.get(tvdbId);
            if (!selectedSeries) {
                return await interaction.reply({ content: '❌ Series not found in cache. Please search again.', ephemeral: true });
            }

            // Create season selection dropdown
            const seasonOptions = [];

            // Add "All Seasons" option
            seasonOptions.push({
                label: '📺 All Seasons',
                description: 'Download all available seasons',
                value: 'all_seasons'
            });

            // Add individual seasons if available
            if (selectedSeries.seasons && selectedSeries.seasons.length > 0) {
                selectedSeries.seasons.forEach(season => {
                    if (season.seasonNumber >= 0) { // Include season 0 (specials) if present
                        const seasonLabel = season.seasonNumber === 0 ? 'Specials' : `Season ${season.seasonNumber}`;
                        seasonOptions.push({
                            label: seasonLabel,
                            description: `Episodes: ${season.statistics?.totalEpisodeCount || 'Unknown'}`,
                            value: `season_${season.seasonNumber}`
                        });
                    }
                });
            } else {
                // If no season data, just add Season 1 as fallback
                seasonOptions.push({
                    label: 'Season 1',
                    description: 'First season',
                    value: 'season_1'
                });
            }

            const seasonSelectMenu = new StringSelectMenuBuilder()
                .setCustomId(`season_select_${tvdbId}`)
                .setPlaceholder('Select which seasons to download')
                .addOptions(seasonOptions.slice(0, 25)); // Discord limit

            const seriesSelectMenu = StringSelectMenuBuilder.from(interaction.message.components[0].components[0])
                .setPlaceholder(`Selected: ${selectedLabel}`);

            const row1 = new ActionRowBuilder().addComponents(seriesSelectMenu);
            const row2 = new ActionRowBuilder().addComponents(seasonSelectMenu);

            await interaction.update({
                components: [row1, row2]
            });

        } else if (interaction.customId.startsWith('season_select_')) {
            const tvdbId = interaction.customId.replace('season_select_', '');
            const selectedSeasons = interaction.values[0];

            // Create download button with season info
            const downloadButton = new ButtonBuilder()
                .setCustomId(`download_series_${tvdbId}_${selectedSeasons}`)
                .setLabel(`Download Selected Seasons`)
                .setStyle(ButtonStyle.Success);

            const seasonSelectMenu = StringSelectMenuBuilder.from(interaction.message.components[1].components[0])
                .setPlaceholder(`Selected: ${interaction.component.options.find(opt => opt.value === selectedSeasons)?.label || 'Selected'}`);

            const row1 = new ActionRowBuilder().addComponents(interaction.message.components[0].components[0]);
            const row2 = new ActionRowBuilder().addComponents(seasonSelectMenu);
            const row3 = new ActionRowBuilder().addComponents(downloadButton);

            await interaction.update({
                components: [row1, row2, row3]
            });
        }
    },

    async handleButton(interaction) {
        if (interaction.customId.startsWith('download_series_')) {
            // Parse tvdbId and season selection from custom ID
            const parts = interaction.customId.replace('download_series_', '').split('_');
            const tvdbId = parts[0];
            const seasonSelection = parts.slice(1).join('_'); // Rejoin in case of underscores

            try {
                await interaction.deferReply({ ephemeral: true });

                const sonarr = interaction.client.sonarr;
                if (!sonarr) {
                    return await interaction.editReply('❌ Sonarr API not initialized. Please check your configuration.');
                }

                // Get quality profiles and root folders for series addition
                const profiles = await sonarr.getProfiles();
                const rootFolders = await sonarr.getRootFolders();

                if (!profiles || profiles.length === 0) {
                    return await interaction.editReply('❌ No quality profiles found in Sonarr');
                }

                if (!rootFolders || rootFolders.length === 0) {
                    return await interaction.editReply('❌ No root folders found in Sonarr');
                }

                // Get series data from cache
                const seriesToAdd = interaction.client.seriesCache?.get(tvdbId);

                if (!seriesToAdd) {
                    return await interaction.editReply('❌ Series not found in cache. Please search again.');
                }

                // Determine monitor type and description based on selection
                let monitorType;
                let seasonDescription;

                if (seasonSelection === 'all_seasons') {
                    monitorType = 'all';
                    seasonDescription = 'All seasons';
                } else if (seasonSelection.startsWith('season_')) {
                    const seasonNumber = parseInt(seasonSelection.replace('season_', ''));
                    if (seasonNumber === 1) {
                        monitorType = 'firstSeason';
                        seasonDescription = 'Season 1';
                    } else if (seasonNumber === 0) {
                        monitorType = 'all'; // For specials, monitor all and let user adjust later
                        seasonDescription = 'Specials';
                    } else {
                        // For other specific seasons, we'll use a two-step approach
                        monitorType = 'none'; // Add without monitoring, then update
                        seasonDescription = `Season ${seasonNumber}`;
                    }
                }

                // Prepare series data for addition using all available data from search
                const seriesData = {
                    title: seriesToAdd.title,
                    sortTitle: seriesToAdd.sortTitle || seriesToAdd.title,
                    status: seriesToAdd.status || 'continuing',
                    overview: seriesToAdd.overview || '',
                    network: seriesToAdd.network || '',
                    airTime: seriesToAdd.airTime || '',
                    images: seriesToAdd.images || [],
                    seasons: seriesToAdd.seasons || [],
                    year: seriesToAdd.year,
                    path: `${rootFolders[0].path}/${seriesToAdd.title}`,
                    qualityProfileId: profiles[0].id,
                    seasonFolder: true,
                    monitored: true,
                    useSceneNumbering: false,
                    runtime: seriesToAdd.runtime || 0,
                    tvdbId: parseInt(tvdbId),
                    tvRageId: seriesToAdd.tvRageId || 0,
                    tvMazeId: seriesToAdd.tvMazeId || 0,
                    tmdbId: seriesToAdd.tmdbId || 0,
                    firstAired: seriesToAdd.firstAired || null,
                    lastAired: seriesToAdd.lastAired || null,
                    seriesType: seriesToAdd.seriesType || 'standard',
                    cleanTitle: seriesToAdd.cleanTitle || seriesToAdd.title,
                    imdbId: seriesToAdd.imdbId || '',
                    titleSlug: seriesToAdd.titleSlug || '',
                    rootFolderPath: rootFolders[0].path,
                    certification: seriesToAdd.certification || '',
                    genres: seriesToAdd.genres || [],
                    tags: [],
                    addOptions: {
                        ignoreEpisodesWithFiles: false,
                        ignoreEpisodesWithoutFiles: false,
                        monitor: monitorType,
                        searchForMissingEpisodes: true,
                        searchForCutoffUnmetEpisodes: false
                    }
                };

                console.log(`Adding series with monitor type: ${monitorType}`);
                console.log(`Series data:`, JSON.stringify(seriesData, null, 2));

                // Add the series to Sonarr
                const addedSeries = await sonarr.addSeries(seriesData);

                // For specific seasons (other than season 1), we need to update the monitoring after adding
                if (seasonSelection.startsWith('season_') && monitorType === 'none') {
                    const seasonNumber = parseInt(seasonSelection.replace('season_', ''));
                    try {
                        // Get the series ID from the response
                        const seriesId = addedSeries.id;

                        // Get current seasons
                        const currentSeasons = await sonarr.getSeasons(seriesId);

                        // Update each season's monitoring status
                        for (const season of currentSeasons) {
                            season.monitored = season.seasonNumber === seasonNumber;
                            await sonarr.updateSeason(season);
                        }

                        console.log(`Updated season monitoring for series ${seriesId}, only monitoring season ${seasonNumber}`);
                    } catch (updateError) {
                        console.error('Error updating season monitoring:', updateError);
                        // Continue anyway, series was added successfully
                    }
                }

                const successEmbed = new EmbedBuilder()
                    .setTitle('📺 TV Series Added Successfully')
                    .setDescription(`**${seriesData.title} (${seriesData.year})** has been added to Sonarr`)
                    .addFields(
                        { name: 'Quality Profile', value: profiles[0].name, inline: true },
                        { name: 'Root Folder', value: rootFolders[0].path, inline: true },
                        { name: 'Seasons', value: seasonDescription, inline: true },
                        { name: 'Auto Search', value: 'Enabled', inline: true }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.editReply({ embeds: [successEmbed] });

            } catch (error) {
                console.error('Error adding TV series:', error);

                let errorMessage = 'Failed to add TV series to Sonarr';
                if (error.message.includes('already exists')) {
                    errorMessage = '⚠️ This TV series is already in your Sonarr library';
                } else if (error.message.includes('401')) {
                    errorMessage = '❌ Unauthorized - check your API key';
                } else if (error.message.includes('404')) {
                    errorMessage = '❌ Sonarr instance not found - check your URL';
                }

                await interaction.editReply(`${errorMessage}: ${error.message}`);
            }
        }
    }
};