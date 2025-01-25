const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const https = require('https');

// Create a custom HTTPS agent that ignores SSL certificate issues
const agent = new https.Agent({
    rejectUnauthorized: false
});

// Configure RSS parser with custom fields
const parser = new Parser({
    customFields: {
        item: [
            'itunes:episode',
            'itunes:duration',
            'itunes:summary',
            'itunes:image',
            'content:encoded'
        ]
    },
    requestOptions: {
        agent: agent
    }
});

// Configure these variables
const PODCAST_RSS_URL = 'https://feeds.libsyn.com/513538/rss';
const EPISODES_FILE = path.join(__dirname, '..', 'content', 'podcast', 'episodes.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'podcast-sync.log');

// Helper function to log messages
async function log(message, isError = false) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    
    // Create logs directory if it doesn't exist
    const logsDir = path.dirname(LOG_FILE);
    await fs.mkdir(logsDir, { recursive: true });
    
    // Append to log file
    await fs.appendFile(LOG_FILE, logMessage);
    
    // Also log to console if not in automated mode
    if (!process.env.AUTOMATED) {
        if (isError) {
            console.error(message);
        } else {
            console.log(message);
        }
    }
}

async function loadExistingEpisodes() {
    try {
        const content = await fs.readFile(EPISODES_FILE, 'utf-8');
        return JSON.parse(content).episodes;
    } catch (error) {
        return [];
    }
}

async function saveEpisodes(episodes) {
    await fs.writeFile(
        EPISODES_FILE,
        JSON.stringify({ episodes }, null, 2)
    );
}

function getEmbedUrl(item) {
    // Get the show ID and episode slug from the listen URL
    const showId = '513538';
    const episodeSlug = item.link?.split('/').pop();
    return episodeSlug ? `https://player.libsyn.com/embed/${showId}/${episodeSlug}` : null;
}

function cleanUrl(url) {
    if (!url) return null;
    // Remove any whitespace, newlines, or carriage returns and join the parts
    return url.split(/[\s\n\r]+/).join('');
}

function getArtworkUrl(item) {
    // Try to get episode-specific artwork first
    const episodeArtwork = 
        item['itunes:image']?.['$']?.href || // From itunes:image field
        item.itunes?.image || // From itunes.image field
        item['image']?.url ||
        item['image']?.href;

    if (episodeArtwork) {
        console.log(`Found episode artwork: ${episodeArtwork}`);
        return cleanUrl(episodeArtwork);
    }

    // Try to extract artwork from the description
    const description = item.description || item['content:encoded'] || '';
    const imgMatch = description.match(/<img[^>]+src="([^">]+)"/i);
    if (imgMatch && imgMatch[1]) {
        console.log(`Found artwork in description: ${imgMatch[1]}`);
        return cleanUrl(imgMatch[1]);
    }

    // Fallback to show artwork
    const showArtwork = 
        item.feed?.image?.url ||
        item.feed?.itunes?.image?.href;

    if (showArtwork) {
        console.log(`Using show artwork: ${showArtwork}`);
        return cleanUrl(showArtwork);
    }

    return null;
}

async function syncPodcast() {
    console.log('Starting podcast sync...');
    
    try {
        const feed = await parser.parseURL(PODCAST_RSS_URL);
        console.log(`Found ${feed.items.length} episodes`);
        
        // Debug: Print the first item's structure
        console.log('First item structure:', JSON.stringify(feed.items[0], null, 2));
        
        const episodes = feed.items.map(item => {
            // Debug: Print artwork-related fields
            console.log('\nArtwork debug for episode:', item.title);
            console.log('itunes:image:', item['itunes:image']);
            console.log('item.image:', item.image);
            console.log('item.itunes:', item.itunes);
            
            return {
                title: item.title,
                date: item.pubDate,
                number: item['itunes:episode'],
                description: item['itunes:summary'] || item.contentSnippet || '',
                duration: item['itunes:duration'] || '',
                embedUrl: getEmbedUrl(item),
                listenUrl: item.link || '',
                audioUrl: item.enclosure?.url || '',
                artworkUrl: getArtworkUrl(item)
            };
        });
        
        // Load existing episodes
        const existingEpisodes = await loadExistingEpisodes();
        
        // Merge episodes, remove duplicates, and sort by date
        const allEpisodes = [...episodes, ...existingEpisodes];
        const uniqueEpisodes = allEpisodes.filter((episode, index, self) =>
            index === self.findIndex(e => e.title === episode.title)
        );
        
        // Sort by date, newest first
        uniqueEpisodes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Save updated episodes
        await saveEpisodes(uniqueEpisodes);
        
        await log('Podcast sync completed successfully!');
        
        if (process.env.AUTOMATED) {
            process.exit(0);
        }
    } catch (error) {
        await log(`Error syncing podcast: ${error.message}`, true);
        
        if (process.env.AUTOMATED) {
            process.exit(1);
        }
    }
}

// Check if running in automated mode
if (process.argv.includes('--automated')) {
    process.env.AUTOMATED = 'true';
}

// Run the sync
syncPodcast(); 