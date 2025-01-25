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
                <h1>Unqualified Advice</h1>
                <div class="show-description">
                    <p>Hello and welcome to Unqualified Advice, an entertaining show for entertainment purposes. 
                    Join us as we talk about running our small businesses, what we've been learning, and how 
                    we're applying lessons from academia and real life as entrepreneurs and investors.</p>
                </div>
                
                <div class="episode-card">
                    <h2>Showing off Our Big Shiny Crystal Balls 🔮🔮</h2>
                    <div class="episode-meta">Episode 20 • January 16, 2024 • 50:51</div>
                    
                    <div class="episode-content">
                        <p><em>Hello my dear show notes readers!</em></p>
                        
                        <p>I've missed you so. We took a little longer than expected break this time, because someone recently 
                        turned 40 and hit it a little too hard in the fine city of New Orleans. Have you ever been? If not, you 
                        really must go. One night is not enough. Two nights are divine. Three nights are for 30-somethings.</p>
                        
                        <p>But back to the crux of the matter! This week, we take a look back at some dumb stuff we said about 
                        2024 last January, have a hearty chuckle, and proceed to say some dumb stuff about the coming year. 
                        We had a blast and hope you enjoy listening in as we stare down at our big shiny crystal balls.</p>
                        
                        <p>Hugs and kisses,<br>Old Man Sean</p>
                    </div>
                    
                    <div class="chapters">
                        <h3>Chapters</h3>
                        <ul>
                            <li>00:00 Reflections on Predictions for 2024</li>
                            <li>09:28 Lessons Learned from Past Predictions</li>
                            <li>12:19 Bold Predictions for 2025</li>
                            <li>15:22 The Future of Advertising and Market Behavior</li>
                            <li>17:56 Labor Market Predictions and Economic Corrections</li>
                            <li>21:03 Jay Powell Buys Bitcoin?</li>
                            <li>28:29 Anticipating Scandals in Private Equity</li>
                            <li>31:50 The DEI Pendulum Continues to Change Direction</li>
                            <li>34:06 Labor Strikes: Frequency vs. Success</li>
                            <li>37:28 The Future of SEO and AI Integration</li>
                        </ul>
                    </div>
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