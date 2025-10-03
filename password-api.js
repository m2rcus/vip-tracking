// Enhanced password API with ban tracking for Render deployment
// This will be deployed separately to hide the password from GitHub

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// The actual password - loaded from environment variable
const SYSTEM_PASSWORD = process.env.SYSTEM_PASSWORD || 'MonkeyTilt2024!';

// In-memory ban tracking (in production, use a database)
const bannedIPs = new Set();
const failedAttempts = new Map();

// Get client IP
function getClientIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Enhanced password verification endpoint with ban tracking
app.post('/verify-password', (req, res) => {
    const { password } = req.body;
    const clientIP = getClientIP(req);
    
    // Check if IP is banned
    if (bannedIPs.has(clientIP)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Access permanently denied',
            banned: true
        });
    }
    
    if (password === SYSTEM_PASSWORD) {
        // Reset failed attempts on successful login
        failedAttempts.delete(clientIP);
        
        res.json({ 
            success: true, 
            message: 'Access granted',
            timestamp: Date.now()
        });
    } else {
        // Track failed attempts
        const attempts = (failedAttempts.get(clientIP) || 0) + 1;
        failedAttempts.set(clientIP, attempts);
        
        // Ban after 3 failed attempts
        if (attempts >= 3) {
            bannedIPs.add(clientIP);
            return res.status(403).json({ 
                success: false, 
                message: 'Access permanently denied',
                banned: true
            });
        }
        
        res.json({ 
            success: false, 
            message: 'Invalid password',
            attemptsRemaining: 3 - attempts
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Password API is running' });
});

app.listen(PORT, () => {
    console.log(`Password API running on port ${PORT}`);
});
