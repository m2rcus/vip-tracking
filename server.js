// Simple server to inject environment variable into HTML
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static('.'));

// Serve index.html with environment variable injected
app.get('/', (req, res) => {
    try {
        // Read the index.html file
        let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        // Get password from environment variable
        const systemPassword = process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!';
        
        // Inject the password as a script tag
        const scriptTag = `
        <script>
            window.SYSTEM_PASSWORD = '${systemPassword}';
        </script>`;
        
        // Insert the script tag before the closing head tag
        html = html.replace('</head>', `${scriptTag}</head>`);
        
        res.send(html);
    } catch (error) {
        console.error('Error serving index.html:', error);
        res.status(500).send('Error loading page');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
