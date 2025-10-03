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

// Debug endpoint to check environment variable
app.get('/debug', (req, res) => {
    const systemPassword = process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!';
    res.json({
        hasPassword: !!process.env.SYSTEM_PASSWORD,
        passwordLength: systemPassword.length,
        passwordFirst5: systemPassword.substring(0, 5),
        nodeEnv: process.env.NODE_ENV,
        maxFailedAttempts: 6
    });
});

// Reset ban endpoint (for testing)
app.get('/reset-ban', (req, res) => {
    res.send(`
        <html>
            <head><title>Reset Ban</title></head>
            <body>
                <h1>Ban Reset</h1>
                <p>Click the button below to reset your ban status:</p>
                <button onclick="resetBan()">Reset Ban</button>
                <script>
                    function resetBan() {
                        // Clear all ban data
                        localStorage.removeItem('vipBanData');
                        sessionStorage.removeItem('vipBanData');
                        localStorage.removeItem('vipFailedAttempts');
                        sessionStorage.removeItem('vipFailedAttempts');
                        
                        // Clear IndexedDB ban data
                        if ('indexedDB' in window) {
                            const request = indexedDB.deleteDatabase('vipBanDB');
                            request.onsuccess = () => {
                                alert('Ban reset successfully! You can now try logging in again.');
                                window.location.href = '/';
                            };
                        } else {
                            alert('Ban reset successfully! You can now try logging in again.');
                            window.location.href = '/';
                        }
                    }
                </script>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`SYSTEM_PASSWORD (first 5 chars): ${(process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!').substring(0, 5)}*****`);
});
