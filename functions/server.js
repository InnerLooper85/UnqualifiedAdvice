const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs').promises;
const matter = require('gray-matter');
const sanitizeHtml = require('sanitize-html');
const Parser = require('rss-parser');
const parser = new Parser();
const marked = require('marked');
const https = require('https');

const app = express();

// Serve static files from public directory
app.use(express.static('public'));

// Helper functions (keep existing helper functions)
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

async function readTemplate(templateName) {
    const templatePath = path.join(__dirname, '../templates', templateName);
    return await fs.readFile(templatePath, 'utf-8');
}

function applyTemplate(template, data) {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '');
}

// Keep your existing route handlers
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
        const postPath = path.join(__dirname, '../content/blog', `${req.params.slug}.md`);
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

// Keep other route handlers (about, contact, blog index, podcast)
// ... (copy your existing routes here)

// Export the serverless handler
exports.handler = serverless(app); 