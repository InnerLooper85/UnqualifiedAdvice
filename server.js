const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const matter = require('gray-matter');
const sanitizeHtml = require('sanitize-html');
const Parser = require('rss-parser');
const parser = new Parser();
const marked = require('marked');
const https = require('https');

const app = express();
const port = 3000;

// Serve static files
app.use(express.static('public'));

// Helper function to read and parse markdown files
async function readMarkdownFile(filePath) {
    try {
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const { data, content } = matter(fileContent);
        const htmlContent = marked.parse(content);
        return { metadata: data, content: htmlContent };
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        throw error;
    }
}

// Helper function to read template
async function readTemplate(templateName) {
    const templatePath = path.join(__dirname, 'templates', templateName);
    return await fs.readFile(templatePath, 'utf-8');
}

// Replace template variables
function applyTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
}

// Home page
app.get('/', async (req, res) => {
    try {
        const template = await readTemplate('index.html');
        res.send(template);
    } catch (error) {
        res.status(500).send('Error loading page');
    }
});

// Blog post page
app.get('/blog/:slug', async (req, res) => {
    try {
        const postPath = path.join(__dirname, 'content', 'blog', `${req.params.slug}.md`);
        const template = await readTemplate('post.html');
        const { metadata, content } = await readMarkdownFile(postPath);
        
        const html = applyTemplate(template, {
            title: metadata.title,
            content: content
        });
        
        res.send(html);
    } catch (error) {
        res.status(404).send('Post not found');
    }
});

// About page
app.get('/about', async (req, res) => {
    try {
        const aboutPath = path.join(__dirname, 'content', 'about.md');
        const template = await readTemplate('page.html');
        const { metadata, content } = await readMarkdownFile(aboutPath);
        
        const html = applyTemplate(template, {
            title: metadata.title,
            content: content
        });
        
        res.send(html);
    } catch (error) {
        res.status(404).send('Page not found');
    }
});

// Contact page
app.get('/contact', async (req, res) => {
    try {
        const contactPath = path.join(__dirname, 'content', 'contact.md');
        const template = await readTemplate('page.html');
        const { metadata, content } = await readMarkdownFile(contactPath);
        
        const html = applyTemplate(template, {
            title: metadata.title,
            content: content
        });
        
        res.send(html);
    } catch (error) {
        res.status(404).send('Page not found');
    }
});

// Blog index page
app.get('/blog', async (req, res) => {
    try {
        const postsDir = path.join(__dirname, 'content', 'blog');
        const files = await fs.readdir(postsDir);
        const posts = [];

        for (const file of files) {
            if (file.endsWith('.md')) {
                const { metadata } = await readMarkdownFile(path.join(postsDir, file));
                posts.push({
                    ...metadata,
                    slug: file.replace('.md', '')
                });
            }
        }

        const template = await readTemplate('blog.html');
        const html = applyTemplate(template, {
            title: 'Blog',
            posts: posts.map(post => `
                <article class="post-card">
                    <h2><a href="/blog/${post.slug}">${post.title}</a></h2>
                    <time>${new Date(post.date).toLocaleDateString()}</time>
                    <p>${post.excerpt}</p>
                </article>
            `).join('')
        });

        res.send(html);
    } catch (error) {
        res.status(500).send('Error loading blog posts');
    }
});

// Function to load podcast episodes
async function loadEpisodes() {
    try {
        // Configure parser to ignore SSL errors
        const agent = new https.Agent({
            rejectUnauthorized: false
        });

        const customParser = new Parser({
            customFields: {
                item: [
                    ['itunes:summary', 'itunesSummary'],
                    ['itunes:duration', 'duration'],
                    ['itunes:image', 'image'],
                    ['itunes:episode', 'episodeNumber']
                ]
            },
            requestOptions: {
                agent: agent
            }
        });

        // Try different possible RSS feed URLs
        const feedUrls = [
            'https://feeds.libsyn.com/513538/rss'
        ];

        let feed;
        for (const url of feedUrls) {
            try {
                console.log('Attempting to fetch from:', url);
                feed = await customParser.parseURL(url);
                if (feed) {
                    console.log('Successfully fetched from:', url);
                    break;
                }
            } catch (e) {
                console.log(`Failed to fetch from ${url}:`, e.message);
            }
        }

        if (!feed) {
            throw new Error('Could not fetch RSS feed from any URL');
        }

        console.log('Successfully fetched RSS feed');
        
        // Map feed items to episodes
        const episodes = feed.items.map(item => ({
            title: item.title,
            description: item.itunesSummary || item.content || item.description,
            date: item.pubDate,
            number: item.episodeNumber || '',
            duration: item.duration || '',
            artworkUrl: item.image?.href || feed.image?.url || '',
            audioUrl: item.enclosure?.url || ''
        }));

        return episodes.sort((a, b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
        console.error('Error loading episodes:', error);
        return [];
    }
}

// Process episode descriptions
function processDescription(description) {
    if (!description) return '';

    // The description already contains HTML, so we just need to sanitize it
    const sanitized = sanitizeHtml(description, {
        allowedTags: [
            'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'li', 'ol',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'
        ],
        allowedAttributes: {
            'a': ['href', 'target', 'rel', 'class'],
            'div': ['class'],
            'span': ['class'],
            'ul': ['class'],
            'li': ['class'],
            'p': ['class', 'style'],
            '*': ['style']
        },
        allowedStyles: {
            '*': {
                'text-decoration': [/^underline$/],
                'margin': [/^.*$/],
                'text-align': [/^.*$/]
            }
        },
        // Don't escape entities
        parseStyleAttributes: true,
        textFilter: function(text) {
            return text;
        }
    });

    return sanitized;
}

// Podcast index page
app.get('/podcast', async (req, res) => {
    try {
        const episodes = await loadEpisodes();
        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Podcast Episodes</title>
                    <link rel="stylesheet" href="/css/style.css">
                </head>
                <body>
                    <nav>
                        <ul>
                            <li><a href="/">Home</a></li>
                            <li><a href="/blog">Blog</a></li>
                            <li><a href="/podcast">Podcast</a></li>
                            <li><a href="/about">About</a></li>
                            <li><a href="/contact">Contact</a></li>
                        </ul>
                    </nav>
                    <main>
                        <h1>Podcast Episodes</h1>
                        ${episodes.map(episode => `
                            <div class="episode-card">
                                <div class="episode-card__content">
                                    <div class="episode-card__header">
                                        <div class="episode-card__artwork">
                                            <img src="${episode.artworkUrl}" alt="${episode.title} artwork">
                                        </div>
                                        <div class="episode-card__main">
                                            <h2 class="episode-card__title">${episode.title}</h2>
                                            <div class="episode-card__meta">
                                                Episode ${episode.number} • ${new Date(episode.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} • ${episode.duration}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="episode-card__description">
                                        ${processDescription(episode.description)}
                                    </div>
                                    <div class="episode-card__embed">
                                        <audio controls preload="none" style="width: 100%;">
                                            <source src="${episode.audioUrl}" type="audio/mpeg">
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                    <div class="episode-card__links">
                                        <a href="${episode.listenUrl}" target="_blank" rel="noopener">Listen on Libsyn</a>
                                    </div>
                                </div>
                            </div>
                        `).join('\n')}
                    </main>
                </body>
            </html>
        `;
        res.send(html);
    } catch (error) {
        console.error('Error loading episodes:', error);
        res.status(500).send('Error loading episodes');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 