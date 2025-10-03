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
        
        // Obfuscate the password using simple XOR encryption
        const obfuscatedPassword = Buffer.from(systemPassword).map((byte, index) => 
            byte ^ (index + 42) ^ 0xAB
        ).toString('base64');
        
        // Inject the obfuscated password with anti-debugging
        const scriptTag = `
        <script>
            (function() {
                // Anti-debugging: Clear console and disable dev tools
                console.clear();
                setInterval(() => {
                    if (window.outerHeight - window.innerHeight > 200 || 
                        window.outerWidth - window.innerWidth > 200) {
                        document.body.innerHTML = '<h1>Access Denied</h1><p>Developer tools detected.</p>';
                    }
                }, 1000);
                
                // Obfuscated password storage
                window._mt = '${obfuscatedPassword}';
                window._key = 42;
                window._xor = 0xAB;
                
                // Deobfuscation function
                window._getPassword = function() {
                    try {
                        const data = atob(window._mt);
                        return data.split('').map((char, index) => 
                            String.fromCharCode(char.charCodeAt(0) ^ (index + window._key) ^ window._xor)
                        ).join('');
                    } catch(e) {
                        return null;
                    }
                };
                
                // Clear obfuscation variables after use
                setTimeout(() => {
                    delete window._mt;
                    delete window._key;
                    delete window._xor;
                }, 5000);
            })();
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
                <div id="status"></div>
                <script>
                    function resetBan() {
                        const status = document.getElementById('status');
                        status.innerHTML = 'Resetting ban data...';
                        
                        try {
                            // Clear all possible ban data locations
                            localStorage.clear();
                            sessionStorage.clear();
                            
                            // Clear specific keys
                            localStorage.removeItem('vipBanData');
                            sessionStorage.removeItem('vipBanData');
                            localStorage.removeItem('vipFailedAttempts');
                            sessionStorage.removeItem('vipFailedAttempts');
                            localStorage.removeItem('vipSession');
                            sessionStorage.removeItem('vipSession');
                            
                            // Clear all localStorage keys that might contain ban data
                            for (let i = localStorage.length - 1; i >= 0; i--) {
                                const key = localStorage.key(i);
                                if (key && (key.includes('ban') || key.includes('vip') || key.includes('failed'))) {
                                    localStorage.removeItem(key);
                                }
                            }
                            
                            // Clear all sessionStorage keys that might contain ban data
                            for (let i = sessionStorage.length - 1; i >= 0; i--) {
                                const key = sessionStorage.key(i);
                                if (key && (key.includes('ban') || key.includes('vip') || key.includes('failed'))) {
                                    sessionStorage.removeItem(key);
                                }
                            }
                            
                            // Clear IndexedDB ban data
                            if ('indexedDB' in window) {
                                const request = indexedDB.deleteDatabase('vipBanDB');
                                request.onsuccess = () => {
                                    status.innerHTML = 'Ban reset successfully! Redirecting...';
                                    setTimeout(() => {
                                        window.location.href = '/';
                                    }, 2000);
                                };
                                request.onerror = () => {
                                    status.innerHTML = 'Ban reset completed (IndexedDB clear failed, but other data cleared). Redirecting...';
                                    setTimeout(() => {
                                        window.location.href = '/';
                                    }, 2000);
                                };
                            } else {
                                status.innerHTML = 'Ban reset successfully! Redirecting...';
                                setTimeout(() => {
                                    window.location.href = '/';
                                }, 2000);
                            }
                        } catch (error) {
                            status.innerHTML = 'Error: ' + error.message + '. Try manually clearing browser data.';
                        }
                    }
                </script>
            </body>
        </html>
    `);
});

// Manual reset endpoint with instructions
app.get('/manual-reset', (req, res) => {
    res.send(`
        <html>
            <head><title>Manual Ban Reset</title></head>
            <body>
                <h1>Manual Ban Reset Instructions</h1>
                <p>If the automatic reset didn't work, follow these steps:</p>
                <ol>
                    <li><strong>Open Developer Tools:</strong> Press F12 or right-click → Inspect</li>
                    <li><strong>Go to Application tab</strong> (or Storage tab in Firefox)</li>
                    <li><strong>Clear Storage:</strong>
                        <ul>
                            <li>Click "Clear storage" or "Clear site data"</li>
                            <li>Or manually delete these items:
                                <ul>
                                    <li>Local Storage → Delete all items</li>
                                    <li>Session Storage → Delete all items</li>
                                    <li>IndexedDB → Delete 'vipBanDB' if it exists</li>
                                </ul>
                            </li>
                        </ul>
                    </li>
                    <li><strong>Refresh the page</strong> and try logging in again</li>
                </ol>
                <p><a href="/">← Back to Login</a></p>
            </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`SYSTEM_PASSWORD (first 5 chars): ${(process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!').substring(0, 5)}*****`);
});
