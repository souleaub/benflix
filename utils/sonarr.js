class SonarrAPI {
  constructor(baseUrl = 'http://localhost:8989', apiKey = '') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.headers = {
      'Content-Type': 'application/json',
      'X-Api-Key': this.apiKey
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.headers,
      ...options
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }

      return await response.text();
    } catch (error) {
      throw new Error(`Sonarr API request failed: ${error.message}`);
    }
  }

  async getSeries(options = {}) {
    const params = new URLSearchParams();

    if (options.tvdbId) params.append('tvdbId', options.tvdbId);
    if (options.includeSeasonImages) params.append('includeSeasonImages', options.includeSeasonImages);

    const query = params.toString();
    const endpoint = `/api/v3/series${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }

  async getSeriesById(id) {
    return await this.request(`/api/v3/series/${id}`);
  }

  async addSeries(seriesData) {
    return await this.request('/api/v3/series', {
      method: 'POST',
      body: JSON.stringify(seriesData)
    });
  }

  async updateSeries(id, seriesData) {
    return await this.request(`/api/v3/series/${id}`, {
      method: 'PUT',
      body: JSON.stringify(seriesData)
    });
  }

  async deleteSeries(id, options = {}) {
    const params = new URLSearchParams();

    if (options.deleteFiles) params.append('deleteFiles', options.deleteFiles);
    if (options.addImportListExclusion) params.append('addImportListExclusion', options.addImportListExclusion);

    const query = params.toString();
    const endpoint = `/api/v3/series/${id}${query ? '?' + query : ''}`;

    return await this.request(endpoint, { method: 'DELETE' });
  }

  async searchSeries(term) {
    const params = new URLSearchParams({ term });
    return await this.request(`/api/v3/series/lookup?${params}`);
  }

  async getEpisodes(options = {}) {
    const params = new URLSearchParams();

    if (options.seriesId) params.append('seriesId', options.seriesId);
    if (options.seasonNumber) params.append('seasonNumber', options.seasonNumber);
    if (options.episodeIds) params.append('episodeIds', options.episodeIds);
    if (options.includeImages) params.append('includeImages', options.includeImages);

    const query = params.toString();
    const endpoint = `/api/v3/episode${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }

  async getEpisode(id) {
    return await this.request(`/api/v3/episode/${id}`);
  }

  async updateEpisode(id, episodeData) {
    return await this.request(`/api/v3/episode/${id}`, {
      method: 'PUT',
      body: JSON.stringify(episodeData)
    });
  }

  async getSeasons(seriesId) {
    return await this.request(`/api/v3/season?seriesId=${seriesId}`);
  }

  async updateSeason(seasonData) {
    return await this.request('/api/v3/season', {
      method: 'PUT',
      body: JSON.stringify(seasonData)
    });
  }

  async getQueue(options = {}) {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    if (options.sortKey) params.append('sortKey', options.sortKey);
    if (options.sortDirection) params.append('sortDirection', options.sortDirection);
    if (options.includeUnknownSeriesItems) params.append('includeUnknownSeriesItems', options.includeUnknownSeriesItems);
    if (options.includeSeries) params.append('includeSeries', options.includeSeries);
    if (options.includeEpisode) params.append('includeEpisode', options.includeEpisode);

    const query = params.toString();
    const endpoint = `/api/v3/queue${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }

  async deleteQueueItem(id, options = {}) {
    const params = new URLSearchParams();

    if (options.removeFromClient) params.append('removeFromClient', options.removeFromClient);
    if (options.blocklist) params.append('blocklist', options.blocklist);
    if (options.skipRedownload) params.append('skipRedownload', options.skipRedownload);
    if (options.changeCategory) params.append('changeCategory', options.changeCategory);

    const query = params.toString();
    const endpoint = `/api/v3/queue/${id}${query ? '?' + query : ''}`;

    return await this.request(endpoint, { method: 'DELETE' });
  }

  async getHistory(options = {}) {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    if (options.sortKey) params.append('sortKey', options.sortKey);
    if (options.sortDirection) params.append('sortDirection', options.sortDirection);
    if (options.includeSeries) params.append('includeSeries', options.includeSeries);
    if (options.includeEpisode) params.append('includeEpisode', options.includeEpisode);
    if (options.eventType) params.append('eventType', options.eventType);

    const query = params.toString();
    const endpoint = `/api/v3/history${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }

  async getSystemStatus() {
    return await this.request('/api/v3/system/status');
  }

  async getHealth() {
    return await this.request('/api/v3/health');
  }

  async getProfiles() {
    return await this.request('/api/v3/qualityprofile');
  }

  async getLanguageProfiles() {
    return await this.request('/api/v3/languageprofile');
  }

  async getRootFolders() {
    return await this.request('/api/v3/rootfolder');
  }

  async getTags() {
    return await this.request('/api/v3/tag');
  }

  async createTag(label) {
    return await this.request('/api/v3/tag', {
      method: 'POST',
      body: JSON.stringify({ label })
    });
  }

  async searchSeason(seriesId, seasonNumber) {
    return await this.request('/api/v3/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'SeasonSearch',
        seriesId: seriesId,
        seasonNumber: seasonNumber
      })
    });
  }

  async searchEpisode(episodeIds) {
    return await this.request('/api/v3/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'EpisodeSearch',
        episodeIds: Array.isArray(episodeIds) ? episodeIds : [episodeIds]
      })
    });
  }

  async refreshSeries(seriesId) {
    return await this.request('/api/v3/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'RefreshSeries',
        seriesIds: [seriesId]
      })
    });
  }

  async rescanSeries(seriesId) {
    return await this.request('/api/v3/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'RescanSeries',
        seriesIds: [seriesId]
      })
    });
  }

  async getCommands() {
    return await this.request('/api/v3/command');
  }

  async getCommand(id) {
    return await this.request(`/api/v3/command/${id}`);
  }

  async getCalendar(options = {}) {
    const params = new URLSearchParams();

    if (options.start) params.append('start', options.start);
    if (options.end) params.append('end', options.end);
    if (options.unmonitored) params.append('unmonitored', options.unmonitored);
    if (options.includeSeries) params.append('includeSeries', options.includeSeries);
    if (options.includeEpisodeFile) params.append('includeEpisodeFile', options.includeEpisodeFile);
    if (options.includeEpisodeImages) params.append('includeEpisodeImages', options.includeEpisodeImages);

    const query = params.toString();
    const endpoint = `/api/v3/calendar${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }

  async getWanted(options = {}) {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    if (options.sortKey) params.append('sortKey', options.sortKey);
    if (options.sortDirection) params.append('sortDirection', options.sortDirection);
    if (options.includeSeries) params.append('includeSeries', options.includeSeries);
    if (options.includeImages) params.append('includeImages', options.includeImages);
    if (options.monitored) params.append('monitored', options.monitored);

    const query = params.toString();
    const endpoint = `/api/v3/wanted/missing${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }
}

module.exports = SonarrAPI;