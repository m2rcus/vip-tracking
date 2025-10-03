// Simple server to inject environment variable into HTML
const express = require('express');
const path = require('path');
const fs = require('fs');

// Simple file-based database
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize database
function initDatabase() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            leads: [],
            players: [],
            lastUpdated: Date.now()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
    }
}

// Read data from file
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { leads: [], players: [], lastUpdated: Date.now() };
    }
}

// Write data to file
function writeData(data) {
    try {
        data.lastUpdated = Date.now();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

const app = express();
const PORT = process.env.PORT || 3000;

// Basic security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    next();
});

// Middleware for parsing JSON
app.use(express.json());

// Serve static files
app.use(express.static('.'));

// Serve index.html with environment variable injected
app.get('/', (req, res) => {
    try {
        // Read the index.html file
        let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
        
        // Get password from environment variable
        const systemPassword = process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!';
        
        // Simple but effective obfuscation
        const obfuscatedPassword = Buffer.from(systemPassword)
            .map((byte, index) => byte ^ (index + 42) ^ 0xAB)
            .toString('base64');
        
        // Inject the obfuscated password with simple anti-debugging
        const scriptTag = `
        <script>
            (function() {
                // Simple dev tools detection
                setInterval(() => {
                    if (window.outerHeight - window.innerHeight > 200 || 
                        window.outerWidth - window.innerWidth > 200) {
                        document.body.innerHTML = '<h1>Access Denied</h1><p>Developer tools detected.</p>';
                    }
                }, 1000);
                
                // Clear console periodically
                setInterval(() => {
                    console.clear();
                }, 2000);
                
                // Obfuscated password storage
                window._mt = '${obfuscatedPassword}';
                window._key = 42;
                window._xor = 0xAB;
                
                // Simple deobfuscation function
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

// API Endpoints for shared data
// Get all data
app.get('/api/data', (req, res) => {
    const data = readData();
    res.json(data);
});

// Save all data
app.post('/api/data', (req, res) => {
    const { leads, players } = req.body;
    const data = { leads, players, lastUpdated: Date.now() };
    
    if (writeData(data)) {
        res.json({ success: true, message: 'Data saved successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save data' });
    }
});

// Add new lead
app.post('/api/leads', (req, res) => {
    const data = readData();
    const newLead = {
        ...req.body,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
    };
    
    data.leads.push(newLead);
    
    if (writeData(data)) {
        res.json({ success: true, lead: newLead });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save lead' });
    }
});

// Add new player
app.post('/api/players', (req, res) => {
    const data = readData();
    const newPlayer = {
        ...req.body,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
    };
    
    data.players.push(newPlayer);
    
    if (writeData(data)) {
        res.json({ success: true, player: newPlayer });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save player' });
    }
});

// Update lead
app.put('/api/leads/:id', (req, res) => {
    const data = readData();
    const leadIndex = data.leads.findIndex(lead => lead.id === req.params.id);
    
    if (leadIndex !== -1) {
        data.leads[leadIndex] = { ...data.leads[leadIndex], ...req.body };
        
        if (writeData(data)) {
            res.json({ success: true, lead: data.leads[leadIndex] });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update lead' });
        }
    } else {
        res.status(404).json({ success: false, message: 'Lead not found' });
    }
});

// Update player
app.put('/api/players/:id', (req, res) => {
    const data = readData();
    const playerIndex = data.players.findIndex(player => player.id === req.params.id);
    
    if (playerIndex !== -1) {
        data.players[playerIndex] = { ...data.players[playerIndex], ...req.body };
        
        if (writeData(data)) {
            res.json({ success: true, player: data.players[playerIndex] });
        } else {
            res.status(500).json({ success: false, message: 'Failed to update player' });
        }
    } else {
        res.status(404).json({ success: false, message: 'Player not found' });
    }
});

// Delete lead
app.delete('/api/leads/:id', (req, res) => {
    const data = readData();
    data.leads = data.leads.filter(lead => lead.id !== req.params.id);
    
    if (writeData(data)) {
        res.json({ success: true, message: 'Lead deleted successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to delete lead' });
    }
});

// Delete player
app.delete('/api/players/:id', (req, res) => {
    const data = readData();
    data.players = data.players.filter(player => player.id !== req.params.id);
    
    if (writeData(data)) {
        res.json({ success: true, message: 'Player deleted successfully' });
    } else {
        res.status(500).json({ success: false, message: 'Failed to delete player' });
    }
});

app.listen(PORT, () => {
    // Initialize database
    initDatabase();
    
    console.log(`Server running on port ${PORT}`);
    console.log(`SYSTEM_PASSWORD (first 5 chars): ${(process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!').substring(0, 5)}*****`);
    console.log(`Database file: ${DATA_FILE}`);
});
