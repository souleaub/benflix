class RadarrAPI {
  constructor(baseUrl = 'http://localhost:7878', apiKey = '') {
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
      throw new Error(`Radarr API request failed: ${error.message}`);
    }
  }

  async getMovies(options = {}) {
    const params = new URLSearchParams();

    if (options.tmdbId) params.append('tmdbId', options.tmdbId);
    if (options.excludeLocalCovers) params.append('excludeLocalCovers', options.excludeLocalCovers);

    const query = params.toString();
    const endpoint = `/api/v3/movie${query ? '?' + query : ''}`;

    return await this.request(endpoint);
  }

  async getMovie(id) {
    return await this.request(`/api/v3/movie/${id}`);
  }

  async addMovie(movieData) {
    return await this.request('/api/v3/movie', {
      method: 'POST',
      body: JSON.stringify(movieData)
    });
  }

  async updateMovie(id, movieData) {
    return await this.request(`/api/v3/movie/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData)
    });
  }

  async deleteMovie(id, options = {}) {
    const params = new URLSearchParams();

    if (options.deleteFiles) params.append('deleteFiles', options.deleteFiles);
    if (options.addImportExclusion) params.append('addImportExclusion', options.addImportExclusion);

    const query = params.toString();
    const endpoint = `/api/v3/movie/${id}${query ? '?' + query : ''}`;

    return await this.request(endpoint, { method: 'DELETE' });
  }

  async searchMovies(term) {
    const params = new URLSearchParams({ term });
    return await this.request(`/api/v3/movie/lookup?${params}`);
  }

  async getQueue(options = {}) {
    const params = new URLSearchParams();

    if (options.page) params.append('page', options.page);
    if (options.pageSize) params.append('pageSize', options.pageSize);
    if (options.sortKey) params.append('sortKey', options.sortKey);
    if (options.sortDirection) params.append('sortDirection', options.sortDirection);
    if (options.includeUnknownMovieItems) params.append('includeUnknownMovieItems', options.includeUnknownMovieItems);
    if (options.includeMovie) params.append('includeMovie', options.includeMovie);

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
    if (options.includeMovie) params.append('includeMovie', options.includeMovie);
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

  async searchMovie(movieId) {
    return await this.request('/api/v3/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'MoviesSearch',
        movieIds: [movieId]
      })
    });
  }

  async refreshMovie(movieId) {
    return await this.request('/api/v3/command', {
      method: 'POST',
      body: JSON.stringify({
        name: 'RefreshMovie',
        movieIds: [movieId]
      })
    });
  }

  async getCommands() {
    return await this.request('/api/v3/command');
  }

  async getCommand(id) {
    return await this.request(`/api/v3/command/${id}`);
  }
}

module.exports = RadarrAPI;