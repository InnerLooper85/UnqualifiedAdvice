// Basic router
function handleRoute() {
    const path = window.location.pathname;
    const main = document.querySelector('main');
    
    switch(path) {
        case '/':
            main.innerHTML = `
                <h1>Welcome to My Site</h1>
                <p>A place for my thoughts and ideas</p>
                <!-- Other home content -->
            `;
            break;
        case '/podcast':
            main.innerHTML = `
                <h1>Podcast</h1>
                <!-- Podcast content -->
            `;
            break;
        // Add other routes as needed
        default:
            main.innerHTML = `
                <h1>404 - Page Not Found</h1>
                <p>The page you're looking for doesn't exist.</p>
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