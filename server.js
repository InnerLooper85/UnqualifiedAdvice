const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const matter = require('gray-matter');

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
        const episodesPath = path.join(__dirname, 'content', 'podcast', 'episodes.json');
        const data = await fs.readFile(episodesPath, 'utf8');
        const { episodes } = JSON.parse(data);
        return episodes;
    } catch (error) {
        console.error('Error reading episodes file:', error);
        return [];
    }
}

// Podcast index page
app.get('/podcast', async (req, res) => {
    try {
        const episodes = await loadEpisodes();
        const episodesHtml = episodes.map(episode => `
            <div class="episode-card">
                <div class="episode-card__content">
                    <div class="episode-card__header">
                        <div class="episode-card__artwork">
                            <img src="${episode.artworkUrl}" alt="${episode.title} artwork" loading="lazy">
                        </div>
                        <div class="episode-card__main">
                            <h2 class="episode-card__title">${episode.title}</h2>
                            <div class="episode-card__meta">
                                <span class="episode-card__date">${episode.date}</span>
                                <span class="episode-card__number">Episode ${episode.number}</span>
                                <span class="episode-card__duration">${episode.duration}</span>
                            </div>
                            <div class="episode-card__description">${episode.description}</div>
                            <div class="episode-card__links">
                                <a href="${episode.listenUrl}" target="_blank" rel="noopener">Listen on Libsyn</a>
                            </div>
                        </div>
                    </div>
                    <div class="episode-card__embed">
                        <audio controls preload="none" style="width: 100%;">
                            <source src="${episode.audioUrl}" type="audio/mpeg">
                            Your browser does not support the audio element.
                        </audio>
                    </div>
                </div>
            </div>
        `).join('');

        const html = await fs.readFile('templates/podcast.html', 'utf8');
        res.send(html.replace('{{episodes}}', episodesHtml));
    } catch (error) {
        console.error('Error loading episodes:', error);
        res.status(500).send('Error loading episodes');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
}); 