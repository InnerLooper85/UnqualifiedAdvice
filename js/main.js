// Basic router
function handleRoute() {
    const path = window.location.pathname;
    const main = document.querySelector('main');
    
    switch(path) {
        case '/':
            main.innerHTML = `
                <h1>Welcome to My Site</h1>
                <p>A place for my thoughts and ideas</p>
                <h2>Recent Posts</h2>
                <!-- Add your recent posts here -->
            `;
            break;
            
        case '/podcast':
            main.innerHTML = `
                <h1>Podcast</h1>
                <div class="podcast-episodes">
                    <article>
                        <h2>Latest Episode</h2>
                        <p>Description of your latest podcast episode goes here.</p>
                        <!-- Add your podcast player or episode list here -->
                    </article>
                </div>
            `;
            break;
            
        case '/blog':
            main.innerHTML = `
                <h1>Blog</h1>
                <div class="blog-posts">
                    <article>
                        <h2>Latest Posts</h2>
                        <p>Your blog content goes here.</p>
                    </article>
                </div>
            `;
            break;
            
        case '/about':
            main.innerHTML = `
                <h1>About</h1>
                <div class="about-content">
                    <p>Tell your story here. Share information about yourself or your site.</p>
                </div>
            `;
            break;
            
        case '/contact':
            main.innerHTML = `
                <h1>Contact</h1>
                <div class="contact-form">
                    <p>Get in touch with me:</p>
                    <form id="contact-form">
                        <div>
                            <label for="name">Name:</label>
                            <input type="text" id="name" name="name" required>
                        </div>
                        <div>
                            <label for="email">Email:</label>
                            <input type="email" id="email" name="email" required>
                        </div>
                        <div>
                            <label for="message">Message:</label>
                            <textarea id="message" name="message" required></textarea>
                        </div>
                        <button type="submit">Send Message</button>
                    </form>
                </div>
            `;
            break;
            
        default:
            main.innerHTML = `
                <h1>404 - Page Not Found</h1>
                <p>Sorry, the page you're looking for doesn't exist.</p>
                <p><a href="/">Return to Home</a></p>
            `;
    }
}

// Listen for navigation events
window.addEventListener('popstate', handleRoute);
window.addEventListener('load', handleRoute);

// Update links to use client-side navigation
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.origin === window.location.origin) {
        e.preventDefault();
        const path = e.target.pathname;
        window.history.pushState({}, '', path);
        handleRoute();
    }
}); 