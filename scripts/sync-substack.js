const Parser = require('rss-parser');
const fs = require('fs').promises;
const path = require('path');
const TurndownService = require('turndown');
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

// Create axios instance with SSL verification disabled
const client = axios.create({
    httpsAgent: new https.Agent({  
        rejectUnauthorized: false
    })
});

const parser = new Parser({
    customFields: {
        item: ['content:encoded']
    }
});

const turndown = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-'
});

// Configure these variables
const SUBSTACK_URL = 'https://blacktuesdays.substack.com/feed';
const POSTS_DIR = path.join(__dirname, '..', 'content', 'blog');
const POSTS_JSON = path.join(POSTS_DIR, 'posts.json');
const LOG_FILE = path.join(__dirname, '..', 'logs', 'sync.log');

// Helper function to log messages both to console and file
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

async function fetchFullContent(url) {
    try {
        const response = await client.get(url);
        const html = response.data;
        const $ = cheerio.load(html);
        
        // Remove unwanted elements
        $('.subscription-widget-wrap').remove();
        $('.button-wrapper').remove();
        $('.footer').remove();
        $('.post-footer').remove();
        $('.comments-section').remove();
        
        // Get the main content
        const content = $('.post-content').html();
        return content || '';
    } catch (error) {
        await log(`Error fetching full content from ${url}: ${error.message}`, true);
        return null;
    }
}

async function loadExistingPosts() {
    try {
        const content = await fs.readFile(POSTS_JSON, 'utf-8');
        return JSON.parse(content).posts;
    } catch (error) {
        return [];
    }
}

async function savePost(post) {
    const slug = post.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    // Clean up the excerpt
    const excerpt = post.contentSnippet
        .split('\n')[0]
        .replace(/"/g, '\\"')  // Escape quotes
        .replace(/:/g, ' -')   // Replace colons with dashes
        .trim();

    // Use the full content from RSS feed if available, otherwise fetch it
    let content = post['content:encoded'] || '';
    if (!content) {
        content = await fetchFullContent(post.link) || post.content || '';
    }

    const markdown = `---
title: ${post.title}
date: ${new Date(post.pubDate).toISOString().split('T')[0]}
excerpt: "${excerpt}"
originalUrl: ${post.link}
---

${turndown.turndown(content)}`;

    await fs.writeFile(
        path.join(POSTS_DIR, `${slug}.md`),
        markdown
    );

    return {
        title: post.title,
        date: new Date(post.pubDate).toISOString().split('T')[0],
        slug,
        excerpt
    };
}

async function updatePostsJson(newPosts) {
    const existingPosts = await loadExistingPosts();
    const allPosts = [...newPosts, ...existingPosts];
    
    // Remove duplicates based on slug
    const uniquePosts = allPosts.filter((post, index, self) =>
        index === self.findIndex(p => p.slug === post.slug)
    );

    // Sort by date, newest first
    uniquePosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    await fs.writeFile(
        POSTS_JSON,
        JSON.stringify({ posts: uniquePosts }, null, 2)
    );
}

async function syncSubstack() {
    try {
        await log('Starting Substack sync...');
        const feedResponse = await client.get(SUBSTACK_URL);
        const feed = await parser.parseString(feedResponse.data);
        
        await log(`Found ${feed.items.length} posts`);
        const newPosts = [];

        for (const item of feed.items) {
            await log(`Processing: ${item.title}`);
            const post = await savePost(item);
            newPosts.push(post);
        }

        await log('Updating posts index...');
        await updatePostsJson(newPosts);
        
        await log('Sync completed successfully!');
        
        // Exit with success code in automated mode
        if (process.env.AUTOMATED) {
            process.exit(0);
        }
    } catch (error) {
        await log(`Error syncing posts: ${error.message}`, true);
        
        // Exit with error code in automated mode
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
syncSubstack(); 