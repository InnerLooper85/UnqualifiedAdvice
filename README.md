# Simple Static Site with Markdown Support

A lightweight website using HTML, CSS, JavaScript, and basic libraries for Markdown processing.

## Features

1. Clean, responsive landing page
2. Blog with Markdown support
3. About and Contact pages
4. Newsletter integration (ConvertKit)
5. Social media links

## Project Structure

```
project/
├── index.html          # Landing page
├── css/
│   └── style.css      # Main styles
├── js/
│   ├── main.js        # Site functionality
│   └── markdown.js    # Markdown processing
├── content/
│   ├── blog/          # Blog posts in Markdown
│   ├── about.md       # About page content
│   └── contact.md     # Contact page content
└── templates/
    └── post.html      # Blog post template
```

## Development

1. Write content in Markdown
2. Serve locally using Python's built-in server:
   ```bash
   python3 -m http.server
   ```
3. View at http://localhost:8000

