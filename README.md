# Benflix API Wrappers

JavaScript API wrappers for Radarr and Sonarr applications.

## Installation

No additional dependencies required - uses built-in `fetch` API.

## Usage

### Radarr API

```javascript
const RadarrAPI = require('./utils/radarr');

// Initialize with your Radarr instance
const radarr = new RadarrAPI('http://localhost:7878', 'your-api-key');

// Get all movies
const movies = await radarr.getMovies();

// Get a specific movie
const movie = await radarr.getMovie(1);

// Search for movies
const results = await radarr.searchMovies('Inception');

// Add a movie
const newMovie = await radarr.addMovie({
  title: 'Movie Title',
  year: 2023,
  tmdbId: 12345,
  qualityProfileId: 1,
  rootFolderPath: '/movies/',
  monitored: true
});
```

### Sonarr API

```javascript
const SonarrAPI = require('./utils/sonarr');

// Initialize with your Sonarr instance
const sonarr = new SonarrAPI('http://localhost:8989', 'your-api-key');

// Get all series
const series = await sonarr.getSeries();

// Get episodes for a series
const episodes = await sonarr.getEpisodes({ seriesId: 1 });

// Search for series
const results = await sonarr.searchSeries('Breaking Bad');

// Get calendar
const calendar = await sonarr.getCalendar({
  start: '2023-01-01',
  end: '2023-01-31'
});
```

## API Methods

### Radarr Methods

#### Movies
- `getMovies(options)` - Get all movies
- `getMovie(id)` - Get movie by ID
- `addMovie(movieData)` - Add new movie
- `updateMovie(id, movieData)` - Update movie
- `deleteMovie(id, options)` - Delete movie
- `searchMovies(term)` - Search for movies

#### Queue & History
- `getQueue(options)` - Get download queue
- `deleteQueueItem(id, options)` - Remove item from queue
- `getHistory(options)` - Get download history

#### System
- `getSystemStatus()` - Get system status
- `getHealth()` - Get health checks
- `getProfiles()` - Get quality profiles
- `getRootFolders()` - Get root folders
- `getTags()` - Get tags
- `createTag(label)` - Create new tag

#### Commands
- `searchMovie(movieId)` - Search for movie
- `refreshMovie(movieId)` - Refresh movie metadata
- `getCommands()` - Get all commands
- `getCommand(id)` - Get command by ID

### Sonarr Methods

#### Series
- `getSeries(options)` - Get all series
- `getSeriesById(id)` - Get series by ID
- `addSeries(seriesData)` - Add new series
- `updateSeries(id, seriesData)` - Update series
- `deleteSeries(id, options)` - Delete series
- `searchSeries(term)` - Search for series

#### Episodes & Seasons
- `getEpisodes(options)` - Get episodes
- `getEpisode(id)` - Get episode by ID
- `updateEpisode(id, episodeData)` - Update episode
- `getSeasons(seriesId)` - Get seasons for series
- `updateSeason(seasonData)` - Update season

#### Queue & History
- `getQueue(options)` - Get download queue
- `deleteQueueItem(id, options)` - Remove item from queue
- `getHistory(options)` - Get download history

#### Calendar & Wanted
- `getCalendar(options)` - Get calendar episodes
- `getWanted(options)` - Get missing episodes

#### System
- `getSystemStatus()` - Get system status
- `getHealth()` - Get health checks
- `getProfiles()` - Get quality profiles
- `getLanguageProfiles()` - Get language profiles
- `getRootFolders()` - Get root folders
- `getTags()` - Get tags
- `createTag(label)` - Create new tag

#### Commands
- `searchSeason(seriesId, seasonNumber)` - Search for season
- `searchEpisode(episodeIds)` - Search for episodes
- `refreshSeries(seriesId)` - Refresh series metadata
- `rescanSeries(seriesId)` - Rescan series files
- `getCommands()` - Get all commands
- `getCommand(id)` - Get command by ID

## Configuration

### Constructor Options

Both APIs accept the same constructor parameters:

```javascript
new RadarrAPI(baseUrl, apiKey)
new SonarrAPI(baseUrl, apiKey)
```

- `baseUrl` - Base URL of your instance (default: `http://localhost:7878` for Radarr, `http://localhost:8989` for Sonarr)
- `apiKey` - Your API key from Settings > General

### Common Options

Many methods accept an `options` object with parameters like:

- `page` - Page number for pagination
- `pageSize` - Number of items per page
- `sortKey` - Field to sort by
- `sortDirection` - Sort direction (`asc` or `desc`)
- `includeImages` - Include image data
- `monitored` - Filter by monitored status

## Error Handling

All methods return Promises and will throw errors for:
- HTTP errors (4xx, 5xx responses)
- Network errors
- Invalid JSON responses

```javascript
try {
  const movies = await radarr.getMovies();
} catch (error) {
  console.error('API Error:', error.message);
}
```

## Authentication

Both APIs use API Key authentication via the `X-Api-Key` header. Get your API key from:

- **Radarr**: Settings > General > Security > API Key
- **Sonarr**: Settings > General > Security > API Key

## Requirements

- Node.js with fetch support (Node 18+ or polyfill)
- Radarr v3+ or Sonarr v3+