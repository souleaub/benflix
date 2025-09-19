const RadarrAPI = require('./radarr');
const SonarrAPI = require('./sonarr');

module.exports = {
    setup: async function () {
        console.log("setup function up");

        // Initialize API connections
        const radarr = new RadarrAPI(
            process.env.RADARR_URL || 'http://localhost:7878',
            process.env.RADARR_API_KEY || ''
        );

        const sonarr = new SonarrAPI(
            process.env.SONARR_URL || 'http://localhost:8989',
            process.env.SONARR_API_KEY || ''
        );

        // Add Cloudflare Access headers if service token is provided
        const cfClientId = process.env.CF_ACCESS_CLIENT_ID;
        const cfClientSecret = process.env.CF_ACCESS_CLIENT_SECRET;

        if (cfClientId && cfClientSecret) {
            console.log("Adding Cloudflare Access service token headers...");

            radarr.headers['CF-Access-Client-Id'] = cfClientId;
            radarr.headers['CF-Access-Client-Secret'] = cfClientSecret;

            sonarr.headers['CF-Access-Client-Id'] = cfClientId;
            sonarr.headers['CF-Access-Client-Secret'] = cfClientSecret;
        }

        // Test connections
        try {
            console.log("Testing Radarr connection...");
            const radarrStatus = await radarr.getSystemStatus();
            console.log(`✓ Radarr connected: ${radarrStatus.appName} v${radarrStatus.version}`);
        } catch (error) {
            console.log(`✗ Radarr connection failed: ${error.message}`);
        }

        try {
            console.log("Testing Sonarr connection...");
            const sonarrStatus = await sonarr.getSystemStatus();
            console.log(`✓ Sonarr connected: ${sonarrStatus.appName} v${sonarrStatus.version}`);
        } catch (error) {
            console.log(`✗ Sonarr connection failed: ${error.message}`);
        }

        return {
            radarr,
            sonarr
        };
    }
}