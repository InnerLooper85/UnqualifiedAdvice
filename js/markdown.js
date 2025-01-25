// Load marked library
const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
document.head.appendChild(script);

// Wait for marked to load
script.onload = () => {
    // Configure marked options
    marked.setOptions({
        gfm: true,
        breaks: true,
        headerIds: true,
        sanitize: false
    });
};

// Function to load and render Markdown content
async function loadMarkdownContent(path, targetId) {
    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to load ${path}`);
        
        const markdown = await response.text();
        const content = marked.parse(markdown);
        
        document.getElementById(targetId).innerHTML = content;
    } catch (error) {
        console.error('Error loading markdown:', error);
        document.getElementById(targetId).innerHTML = '<p>Error loading content</p>';
    }
}

// Function to load blog posts list
async function loadBlogPosts() {
    try {
        const response = await fetch('/content/blog/posts.json');
        if (!response.ok) throw new Error('Failed to load blog posts');
        
        const posts = await response.json();
        const container = document.getElementById('recent-posts');
        
        if (!container) return;
        
        const recentPosts = posts.slice(0, 3); // Show 3 most recent posts
        
        recentPosts.forEach(post => {
            const article = document.createElement('article');
            article.className = 'post-card';
            article.innerHTML = `
                <h3><a href="/blog/${post.slug}">${post.title}</a></h3>
                <time>${new Date(post.date).toLocaleDateString()}</time>
                <p>${post.excerpt}</p>
            `;
            container.appendChild(article);
        });
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
} 