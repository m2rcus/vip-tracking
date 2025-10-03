// Monkey Tilt VIP Management System - Single Password
let leads = [];
let players = [];
let bonuses = [];
let isAuthenticated = false;
let failedAttempts = 0;
let isBanned = false;

// Configuration
const CONFIG = {
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    encryptionKey: 'MonkeyTiltVIP2024SecretKey!',
    maxFailedAttempts: 3,
    // Password API URL - will be set to your Render deployment
    passwordApiUrl: 'https://your-password-api.onrender.com'
};

// Advanced ban system - survives cookie clearing
function generateFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Fingerprint', 2, 2);
    
    const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
    ].join('|');
    
    // Create hash of fingerprint
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
        const char = fingerprint.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
}

function isDeviceBanned() {
    const fingerprint = generateFingerprint();
    const banKey = `ban_${fingerprint}`;
    const banData = localStorage.getItem(banKey);
    
    if (banData) {
        try {
            const ban = JSON.parse(banData);
            // Check if ban is still valid (permanent)
            return ban.banned === true;
        } catch (e) {
            return false;
        }
    }
    return false;
}

function banDevice() {
    const fingerprint = generateFingerprint();
    const banKey = `ban_${fingerprint}`;
    const banData = {
        banned: true,
        timestamp: Date.now(),
        attempts: failedAttempts
    };
    
    // Store ban in multiple places for redundancy
    localStorage.setItem(banKey, JSON.stringify(banData));
    sessionStorage.setItem('banned', 'true');
    
    // Also store in IndexedDB for extra persistence
    if ('indexedDB' in window) {
        const request = indexedDB.open('BanDB', 1);
        request.onupgradeneeded = function() {
            const db = request.result;
            if (!db.objectStoreNames.contains('bans')) {
                db.createObjectStore('bans');
            }
        };
        request.onsuccess = function() {
            const db = request.result;
            const transaction = db.transaction(['bans'], 'readwrite');
            const store = transaction.objectStore('bans');
            store.put(banData, fingerprint);
        };
    }
    
    isBanned = true;
    showBanMessage();
}

function showBanMessage() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('banMessage').style.display = 'flex';
    
    // Disable all form interactions
    document.body.style.pointerEvents = 'none';
    document.body.style.userSelect = 'none';
}

// Simple encryption/decryption (for demo purposes)
function encryptData(data) {
    try {
        const jsonString = JSON.stringify(data);
        // Simple XOR encryption (not production-ready)
        let encrypted = '';
        for (let i = 0; i < jsonString.length; i++) {
            encrypted += String.fromCharCode(
                jsonString.charCodeAt(i) ^ SECURITY_CONFIG.encryptionKey.charCodeAt(i % SECURITY_CONFIG.encryptionKey.length)
            );
        }
        return btoa(encrypted);
    } catch (error) {
        console.error('Encryption error:', error);
        return null;
    }
}

function decryptData(encryptedData) {
    try {
        const decrypted = atob(encryptedData);
        let jsonString = '';
        for (let i = 0; i < decrypted.length; i++) {
            jsonString += String.fromCharCode(
                decrypted.charCodeAt(i) ^ SECURITY_CONFIG.encryptionKey.charCodeAt(i % SECURITY_CONFIG.encryptionKey.length)
            );
        }
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Decryption error:', error);
        return null;
    }
}

// Load encrypted data with additional security checks
function loadSecureData() {
    // Only load data if user is properly authenticated
    if (!isAuthenticated || !currentUser) {
        return;
    }
    
    try {
        // Use obfuscated storage keys
        const storageKeys = ['vipLeads_encrypted', 'vipPlayers_encrypted', 'vipBonuses_encrypted'];
        const dataArrays = [leads, players, bonuses];
        
        storageKeys.forEach((key, index) => {
            const encryptedData = localStorage.getItem(key);
            if (encryptedData) {
                const decryptedData = decryptData(encryptedData);
                if (decryptedData && Array.isArray(decryptedData)) {
                    dataArrays[index] = decryptedData;
                }
            }
        });
        
        // Update global arrays
        leads = dataArrays[0];
        players = dataArrays[1];
        bonuses = dataArrays[2];
        
    } catch (error) {
        // Clear data on error to prevent corruption
        leads = [];
        players = [];
        bonuses = [];
    }
}

// Save encrypted data
function saveSecureData() {
    try {
        const encryptedLeads = encryptData(leads);
        const encryptedPlayers = encryptData(players);
        const encryptedBonuses = encryptData(bonuses);
        
        if (encryptedLeads) {
            localStorage.setItem('vipLeads_encrypted', encryptedLeads);
        }
        if (encryptedPlayers) {
            localStorage.setItem('vipPlayers_encrypted', encryptedPlayers);
        }
        if (encryptedBonuses) {
            localStorage.setItem('vipBonuses_encrypted', encryptedBonuses);
        }
    } catch (error) {
        console.error('Error saving secure data:', error);
    }
}

// Enhanced password authentication with ban system
async function authenticateUser(password) {
    // Check if device is already banned
    if (isDeviceBanned() || isBanned) {
        showBanMessage();
        return false;
    }
    
    try {
        const response = await fetch(`${CONFIG.passwordApiUrl}/verify-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ password })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Reset failed attempts on successful login
            failedAttempts = 0;
            isAuthenticated = true;
            sessionStorage.setItem('vipSession', JSON.stringify({
                timestamp: Date.now(),
                sessionId: Math.random().toString(36).substring(2, 15)
            }));
            return true;
        } else {
            // Increment failed attempts
            failedAttempts++;
            
            // Check if max attempts reached
            if (failedAttempts >= CONFIG.maxFailedAttempts) {
                banDevice();
                return false;
            }
            
            // Add delay to prevent brute force
            await new Promise(resolve => setTimeout(resolve, 2000));
            return false;
        }
    } catch (error) {
        console.error('Authentication error:', error);
        
        // Fallback: allow access if API is down (for development)
        // Note: This fallback should be removed in production
        if (password === 'MonkeyTilt2024!') {
            failedAttempts = 0;
            isAuthenticated = true;
            sessionStorage.setItem('vipSession', JSON.stringify({
                timestamp: Date.now(),
                sessionId: Math.random().toString(36).substring(2, 15)
            }));
            return true;
        }
        
        // Increment failed attempts even on API error
        failedAttempts++;
        if (failedAttempts >= CONFIG.maxFailedAttempts) {
            banDevice();
        }
        
        return false;
    }
}

function checkSession() {
    const session = sessionStorage.getItem('vipSession');
    if (session) {
        try {
            const sessionData = JSON.parse(session);
            const now = Date.now();
            if (now - sessionData.timestamp < CONFIG.sessionTimeout) {
                isAuthenticated = true;
                return true;
            } else {
                logout();
            }
        } catch (error) {
            logout();
        }
    }
    return false;
}

function logout() {
    isAuthenticated = false;
    sessionStorage.removeItem('vipSession');
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function showMainApp() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('currentUser').textContent = 'Welcome to Monkey Tilt VIP System';
    loadSecureData();
    renderAllData();
    
    // Additional security: Disable right-click and F12
    setupAntiInspection();
}

// Anti-inspection measures
function setupAntiInspection() {
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showSecurityWarning();
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+U
    document.addEventListener('keydown', function(e) {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.key === 'u')) {
            e.preventDefault();
            showSecurityWarning();
        }
    });
    
    // Clear console periodically
    setInterval(() => {
        if (typeof console !== 'undefined') {
            console.clear();
        }
    }, 1000);
    
    // Detect dev tools
    let devtools = false;
    setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
            if (!devtools) {
                devtools = true;
                showSecurityWarning();
                // Optionally logout on dev tools detection
                // logout();
            }
        } else {
            devtools = false;
        }
    }, 500);
}

function showSecurityWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        color: #ff6b6b;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        font-weight: bold;
        z-index: 99999;
        text-align: center;
    `;
    warning.innerHTML = `
        <div>
            <h1>🚫 UNAUTHORIZED ACCESS DETECTED</h1>
            <p>This system is protected. Please contact your administrator.</p>
        </div>
    `;
    document.body.appendChild(warning);
    
    setTimeout(() => {
        if (document.body.contains(warning)) {
            document.body.removeChild(warning);
        }
    }, 3000);
}

function createSecurityIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'security-indicator encrypted';
    indicator.textContent = 'Data Encrypted';
    document.body.appendChild(indicator);
}

// Initialize app with security
document.addEventListener('DOMContentLoaded', function() {
    // Check if device is banned first
    if (isDeviceBanned()) {
        showBanMessage();
        return;
    }
    
    // Check for existing session
    if (checkSession()) {
        showMainApp();
        initializeApp();
        setupEventListeners();
    } else {
        showLoginScreen();
        setupSecurityEventListeners();
    }
});

function setupSecurityEventListeners() {
    // Login form handler
    document.getElementById('loginForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        const password = document.getElementById('password').value;
        
        // Show loading state
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
        submitBtn.disabled = true;
        
        const success = await authenticateUser(password);
        
        if (success) {
            showMainApp();
            initializeApp();
            setupEventListeners();
        } else {
            document.getElementById('loginError').style.display = 'flex';
            setTimeout(() => {
                document.getElementById('loginError').style.display = 'none';
            }, 3000);
        }
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
    
    // Logout handler
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    // Auto-logout on inactivity
    let inactivityTimer;
    function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(() => {
            if (isAuthenticated) {
                logout();
                alert('Session expired due to inactivity. Please log in again.');
            }
        }, CONFIG.sessionTimeout);
    }
    
    document.addEventListener('mousemove', resetInactivityTimer);
    document.addEventListener('keypress', resetInactivityTimer);
    resetInactivityTimer();
}

function initializeApp() {
    // Set today's date as default for date inputs
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('contactDate').value = today;
    document.getElementById('registrationDate').value = today;
    document.getElementById('bonusDate').value = today;
}

function setupEventListeners() {
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => switchTab(e.target.dataset.tab));
    });

    // Forms
    document.getElementById('leadForm').addEventListener('submit', handleLeadSubmit);
    document.getElementById('playerForm').addEventListener('submit', handlePlayerSubmit);
    document.getElementById('editLeadForm').addEventListener('submit', handleEditLeadSubmit);
    document.getElementById('editPlayerForm').addEventListener('submit', handleEditPlayerSubmit);
    document.getElementById('addBonusForm').addEventListener('submit', handleBonusSubmit);

    // Filters and search
    document.getElementById('searchLeadsInput').addEventListener('input', filterLeads);
    document.getElementById('statusFilter').addEventListener('change', filterLeads);
    document.getElementById('sourceFilter').addEventListener('change', filterLeads);
    document.getElementById('searchPlayersInput').addEventListener('input', filterPlayers);
    document.getElementById('tierFilter').addEventListener('change', filterPlayers);
    document.getElementById('statusFilterPlayers').addEventListener('change', filterPlayers);

    // Export buttons
    document.getElementById('exportLeadsBtn').addEventListener('click', () => exportToCSV('leads'));
    document.getElementById('exportPlayersBtn').addEventListener('click', () => exportToCSV('players'));
    document.getElementById('exportReportBtn').addEventListener('click', exportReport);

    // Clear buttons
    document.getElementById('clearLeadsBtn').addEventListener('click', () => clearAllData('leads'));
    document.getElementById('clearPlayersBtn').addEventListener('click', () => clearAllData('players'));

    // Report generation
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    document.getElementById('reportType').addEventListener('change', toggleReportFilters);
    document.getElementById('dateRange').addEventListener('change', toggleDateRange);

    // Modal close
    document.querySelectorAll('.close').forEach(close => {
        close.addEventListener('click', closeModal);
    });
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) closeModal();
    });
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
}

// Lead Management
function handleLeadSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Only require name, source, contact method, and date
    const name = formData.get('leadName')?.trim();
    const source = formData.get('leadSource');
    const contactMethod = formData.get('contactMethod');
    const contactDate = formData.get('contactDate');
    
    if (!name || !source || !contactMethod || !contactDate) {
        showMessage('Please fill in all required fields (Name, Source, Contact Method, Date)', 'error');
        return;
    }
    
    const lead = {
        id: Date.now().toString(),
        name: name,
        email: formData.get('leadEmail')?.trim() || '',
        phone: formData.get('leadPhone')?.trim() || '',
        source: source,
        contactMethod: contactMethod,
        contactDate: contactDate,
        telegramUsername: formData.get('telegramUsername')?.trim() || '',
        gamblingRanking: formData.get('gamblingRanking') || '',
        personality: formData.get('leadPersonality')?.trim() || '',
        favoriteGames: formData.get('leadFavoriteGames')?.trim() || '',
        notes: formData.get('leadNotes')?.trim() || '',
        status: formData.get('leadStatus') || 'new',
        createdAt: new Date().toISOString()
    };
    
    leads.push(lead);
    saveData();
    renderLeads();
    e.target.reset();
    showMessage('🎉 Lead added successfully!', 'success');
}

function handlePlayerSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Only require name, player ID, and registration date
    const name = formData.get('playerName')?.trim();
    const playerId = formData.get('playerId')?.trim();
    const registrationDate = formData.get('registrationDate');
    
    if (!name || !playerId || !registrationDate) {
        showMessage('Please fill in all required fields (Name, Player ID, Registration Date)', 'error');
        return;
    }
    
    const player = {
        id: Date.now().toString(),
        name: name,
        email: formData.get('playerEmail')?.trim() || '',
        phone: formData.get('playerPhone')?.trim() || '',
        playerId: playerId,
        registrationDate: registrationDate,
        tier: formData.get('playerTier') || 'bronze',
        totalDeposits: parseFloat(formData.get('totalDeposits')) || 0,
        totalWithdrawals: parseFloat(formData.get('totalWithdrawals')) || 0,
        lastActivity: formData.get('lastActivity') || '',
        telegramUsername: formData.get('telegramUsername')?.trim() || '',
        personality: formData.get('playerPersonality')?.trim() || '',
        favoriteGames: formData.get('playerFavoriteGames')?.trim() || '',
        notes: formData.get('playerNotes')?.trim() || '',
        status: formData.get('playerStatus') || 'active',
        createdAt: new Date().toISOString()
    };
    
    players.push(player);
    saveData();
    renderPlayers();
    e.target.reset();
    showMessage('🎉 Player added successfully!', 'success');
}

function handleBonusSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bonus = {
        id: Date.now().toString(),
        playerId: document.getElementById('bonusPlayerId').value,
        type: formData.get('bonusType'),
        amount: parseFloat(formData.get('bonusAmount')) || 0,
        percentage: parseFloat(formData.get('bonusPercentage')) || 0,
        date: formData.get('bonusDate'),
        wagering: parseFloat(formData.get('bonusWagering')) || 0,
        expiry: formData.get('bonusExpiry'),
        notes: formData.get('bonusNotes'),
        createdAt: new Date().toISOString()
    };
    
    bonuses.push(bonus);
    saveData();
    renderPlayers();
    closeModal();
    showMessage('Bonus added successfully!', 'success');
}

// Rendering Functions
function renderAllData() {
    renderLeads();
    renderPlayers();
}

function renderLeads() {
    const container = document.getElementById('leadsList');
    if (leads.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><h3>No Leads Yet</h3><p>Add your first lead to get started</p></div>';
        return;
    }

    container.innerHTML = leads.map(lead => `
        <div class="vip-item">
            <div class="vip-header">
                <div>
                    <h3 class="vip-name">${lead.name}</h3>
                    <p class="vip-company">${lead.email || 'No email'}</p>
                </div>
                <div class="vip-actions">
                    <button class="btn btn-warning" onclick="editLead('${lead.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger" onclick="deleteLead('${lead.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="vip-details">
                <div class="vip-detail">
                    <span class="vip-detail-label">Source</span>
                    <span class="vip-detail-value">${formatValue(lead.source)}</span>
                </div>
                <div class="vip-detail">
                    <span class="vip-detail-label">Contact Method</span>
                    <span class="vip-detail-value">${formatValue(lead.contactMethod)}</span>
                </div>
                <div class="vip-detail">
                    <span class="vip-detail-label">Contact Date</span>
                    <span class="vip-detail-value">${formatDate(lead.contactDate)}</span>
                </div>
                <div class="vip-detail">
                    <span class="vip-detail-label">Status</span>
                    <span class="vip-detail-value priority-badge priority-${lead.status}">${formatValue(lead.status)}</span>
                </div>
                <div class="vip-detail">
                    <span class="vip-detail-label">Telegram</span>
                    <span class="vip-detail-value">${lead.telegramUsername || 'N/A'}</span>
                </div>
                <div class="vip-detail">
                    <span class="vip-detail-label">Ranking</span>
                    <span class="vip-detail-value">${formatValue(lead.gamblingRanking)}</span>
                </div>
            </div>
            ${lead.personality ? `<div class="vip-feedback"><div class="vip-feedback-label">Personality & Interests</div><div class="vip-feedback-text">${lead.personality}</div></div>` : ''}
            ${lead.favoriteGames ? `<div class="vip-feedback"><div class="vip-feedback-label">Favorite Games</div><div class="vip-feedback-text">${lead.favoriteGames}</div></div>` : ''}
            ${lead.notes ? `<div class="vip-feedback"><div class="vip-feedback-label">General Notes</div><div class="vip-feedback-text">${lead.notes}</div></div>` : ''}
        </div>
    `).join('');
}

function renderPlayers() {
    const container = document.getElementById('playersList');
    if (players.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-crown"></i><h3>No Players Yet</h3><p>Add your first player to get started</p></div>';
        return;
    }

    container.innerHTML = players.map(player => {
        const playerBonuses = bonuses.filter(bonus => bonus.playerId === player.id);
        return `
            <div class="vip-item">
                <div class="vip-header">
                    <div>
                        <h3 class="vip-name">${player.name}</h3>
                        <p class="vip-company">ID: ${player.playerId} | ${player.email || 'No email'}</p>
                    </div>
                    <div class="vip-actions">
                        <button class="btn btn-success" onclick="addBonus('${player.id}')">
                            <i class="fas fa-gift"></i> Add Bonus
                        </button>
                        <button class="btn btn-warning" onclick="editPlayer('${player.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="deletePlayer('${player.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                <div class="vip-details">
                    <div class="vip-detail">
                        <span class="vip-detail-label">Tier</span>
                        <span class="vip-detail-value priority-badge priority-${player.tier}">${formatValue(player.tier)}</span>
                    </div>
                    <div class="vip-detail">
                        <span class="vip-detail-label">Status</span>
                        <span class="vip-detail-value priority-badge priority-${player.status}">${formatValue(player.status)}</span>
                    </div>
                    <div class="vip-detail">
                        <span class="vip-detail-label">Registration</span>
                        <span class="vip-detail-value">${formatDate(player.registrationDate)}</span>
                    </div>
                    <div class="vip-detail">
                        <span class="vip-detail-label">Total Deposits</span>
                        <span class="vip-detail-value">$${player.totalDeposits.toFixed(2)}</span>
                    </div>
                    <div class="vip-detail">
                        <span class="vip-detail-label">Total Withdrawals</span>
                        <span class="vip-detail-value">$${player.totalWithdrawals.toFixed(2)}</span>
                    </div>
                    <div class="vip-detail">
                        <span class="vip-detail-label">Last Activity</span>
                        <span class="vip-detail-value">${formatDate(player.lastActivity)}</span>
                    </div>
                </div>
                ${player.personality ? `<div class="vip-feedback"><div class="vip-feedback-label">Personality & Interests</div><div class="vip-feedback-text">${player.personality}</div></div>` : ''}
                ${player.favoriteGames ? `<div class="vip-feedback"><div class="vip-feedback-label">Favorite Games</div><div class="vip-feedback-text">${player.favoriteGames}</div></div>` : ''}
                ${player.notes ? `<div class="vip-feedback"><div class="vip-feedback-label">Important Information</div><div class="vip-feedback-text">${player.notes}</div></div>` : ''}
                ${playerBonuses.length > 0 ? `
                    <div class="bonus-section">
                        <div class="bonus-header">
                            <h4><i class="fas fa-gift"></i> Bonuses (${playerBonuses.length})</h4>
                        </div>
                        <div class="bonus-list">
                            ${playerBonuses.map(bonus => `
                                <div class="bonus-item">
                                    <div class="bonus-type">${formatValue(bonus.type)}</div>
                                    <div class="bonus-amount">$${bonus.amount.toFixed(2)} ${bonus.percentage > 0 ? `(${bonus.percentage}%)` : ''}</div>
                                    <div class="bonus-date">${formatDate(bonus.date)}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// Edit Functions
function editLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;

    document.getElementById('editLeadId').value = lead.id;
    document.getElementById('editLeadName').value = lead.name;
    document.getElementById('editLeadEmail').value = lead.email || '';
    document.getElementById('editLeadPhone').value = lead.phone || '';
    document.getElementById('editLeadSource').value = lead.source;
    document.getElementById('editContactMethod').value = lead.contactMethod;
    document.getElementById('editContactDate').value = lead.contactDate;
    document.getElementById('editTelegramUsername').value = lead.telegramUsername || '';
    document.getElementById('editGamblingRanking').value = lead.gamblingRanking || '';
    document.getElementById('editLeadPersonality').value = lead.personality || '';
    document.getElementById('editLeadFavoriteGames').value = lead.favoriteGames || '';
    document.getElementById('editLeadNotes').value = lead.notes || '';
    document.getElementById('editLeadStatus').value = lead.status;

    document.getElementById('editLeadModal').style.display = 'block';
}

function editPlayer(id) {
    const player = players.find(p => p.id === id);
    if (!player) return;

    document.getElementById('editPlayerId').value = player.id;
    document.getElementById('editPlayerName').value = player.name;
    document.getElementById('editPlayerEmail').value = player.email || '';
    document.getElementById('editPlayerPhone').value = player.phone || '';
    document.getElementById('editPlayerId').value = player.playerId;
    document.getElementById('editRegistrationDate').value = player.registrationDate;
    document.getElementById('editPlayerTier').value = player.tier;
    document.getElementById('editTotalDeposits').value = player.totalDeposits;
    document.getElementById('editTotalWithdrawals').value = player.totalWithdrawals;
    document.getElementById('editLastActivity').value = player.lastActivity || '';
    document.getElementById('editPlayerTelegramUsername').value = player.telegramUsername || '';
    document.getElementById('editPlayerPersonality').value = player.personality || '';
    document.getElementById('editPlayerFavoriteGames').value = player.favoriteGames || '';
    document.getElementById('editPlayerNotes').value = player.notes || '';
    document.getElementById('editPlayerStatus').value = player.status;

    document.getElementById('editPlayerModal').style.display = 'block';
}

function addBonus(playerId) {
    document.getElementById('bonusPlayerId').value = playerId;
    document.getElementById('addBonusModal').style.display = 'block';
}

function handleEditLeadSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editLeadId').value;
    const formData = new FormData(e.target);
    
    const leadIndex = leads.findIndex(l => l.id === id);
    if (leadIndex !== -1) {
        leads[leadIndex] = {
            ...leads[leadIndex],
            name: formData.get('leadName'),
            email: formData.get('leadEmail'),
            phone: formData.get('leadPhone'),
            source: formData.get('leadSource'),
            contactMethod: formData.get('contactMethod'),
            contactDate: formData.get('contactDate'),
            telegramUsername: formData.get('telegramUsername'),
            gamblingRanking: formData.get('gamblingRanking'),
            personality: formData.get('leadPersonality'),
            favoriteGames: formData.get('leadFavoriteGames'),
            notes: formData.get('leadNotes'),
            status: formData.get('leadStatus')
        };
        
        saveData();
        renderLeads();
        closeModal();
        showMessage('Lead updated successfully!', 'success');
    }
}

function handleEditPlayerSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('editPlayerId').value;
    const formData = new FormData(e.target);
    
    const playerIndex = players.findIndex(p => p.id === id);
    if (playerIndex !== -1) {
        players[playerIndex] = {
            ...players[playerIndex],
            name: formData.get('playerName'),
            email: formData.get('playerEmail'),
            phone: formData.get('playerPhone'),
            playerId: formData.get('playerId'),
            registrationDate: formData.get('registrationDate'),
            tier: formData.get('playerTier'),
            totalDeposits: parseFloat(formData.get('totalDeposits')) || 0,
            totalWithdrawals: parseFloat(formData.get('totalWithdrawals')) || 0,
            lastActivity: formData.get('lastActivity'),
            telegramUsername: formData.get('telegramUsername'),
            personality: formData.get('playerPersonality'),
            favoriteGames: formData.get('playerFavoriteGames'),
            notes: formData.get('playerNotes'),
            status: formData.get('playerStatus')
        };
        
        saveData();
        renderPlayers();
        closeModal();
        showMessage('Player updated successfully!', 'success');
    }
}

// Delete Functions
function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        leads = leads.filter(l => l.id !== id);
        saveData();
        renderLeads();
        showMessage('Lead deleted successfully!', 'success');
    }
}

function deletePlayer(id) {
    if (confirm('Are you sure you want to delete this player?')) {
        players = players.filter(p => p.id !== id);
        bonuses = bonuses.filter(b => b.playerId !== id);
        saveData();
        renderPlayers();
        showMessage('Player deleted successfully!', 'success');
    }
}

// Filter Functions
function filterLeads() {
    const search = document.getElementById('searchLeadsInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const sourceFilter = document.getElementById('sourceFilter').value;
    
    const filtered = leads.filter(lead => {
        const matchesSearch = lead.name.toLowerCase().includes(search) || 
                            (lead.email && lead.email.toLowerCase().includes(search));
        const matchesStatus = !statusFilter || lead.status === statusFilter;
        const matchesSource = !sourceFilter || lead.source === sourceFilter;
        
        return matchesSearch && matchesStatus && matchesSource;
    });
    
    renderFilteredLeads(filtered);
}

function filterPlayers() {
    const search = document.getElementById('searchPlayersInput').value.toLowerCase();
    const tierFilter = document.getElementById('tierFilter').value;
    const statusFilter = document.getElementById('statusFilterPlayers').value;
    
    const filtered = players.filter(player => {
        const matchesSearch = player.name.toLowerCase().includes(search) || 
                            player.playerId.toLowerCase().includes(search) ||
                            (player.email && player.email.toLowerCase().includes(search));
        const matchesTier = !tierFilter || player.tier === tierFilter;
        const matchesStatus = !statusFilter || player.status === statusFilter;
        
        return matchesSearch && matchesTier && matchesStatus;
    });
    
    renderFilteredPlayers(filtered);
}

function renderFilteredLeads(filteredLeads) {
    const container = document.getElementById('leadsList');
    if (filteredLeads.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No Leads Found</h3><p>Try adjusting your search criteria</p></div>';
        return;
    }
    
    // Use same rendering logic as renderLeads but with filtered data
    const originalLeads = leads;
    leads = filteredLeads;
    renderLeads();
    leads = originalLeads;
}

function renderFilteredPlayers(filteredPlayers) {
    const container = document.getElementById('playersList');
    if (filteredPlayers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No Players Found</h3><p>Try adjusting your search criteria</p></div>';
        return;
    }
    
    // Use same rendering logic as renderPlayers but with filtered data
    const originalPlayers = players;
    players = filteredPlayers;
    renderPlayers();
    players = originalPlayers;
}

// Report Functions
function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const dateRange = document.getElementById('dateRange').value;
    
    let filteredData = { leads, players, bonuses };
    
    // Apply date filtering
    if (dateRange !== 'all') {
        const { startDate, endDate } = getDateRange(dateRange);
        filteredData = filterDataByDate(filteredData, startDate, endDate);
    }
    
    // Apply custom filters if needed
    if (reportType === 'custom') {
        const filterField = document.getElementById('filterField').value;
        const filterValue = document.getElementById('filterValue').value;
        if (filterValue) {
            filteredData = applyCustomFilter(filteredData, filterField, filterValue);
        }
    }
    
    displayReport(reportType, filteredData);
    document.getElementById('exportReportBtn').style.display = 'inline-flex';
}

function getDateRange(range) {
    const today = new Date();
    let startDate, endDate = today.toISOString().split('T')[0];
    
    switch (range) {
        case 'last7days':
            startDate = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
        case 'last30days':
            startDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
        case 'last90days':
            startDate = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            break;
        case 'custom':
            startDate = document.getElementById('startDate').value;
            endDate = document.getElementById('endDate').value;
            break;
        default:
            startDate = '1900-01-01';
    }
    
    return { startDate, endDate };
}

function filterDataByDate(data, startDate, endDate) {
    return {
        leads: data.leads.filter(lead => lead.contactDate >= startDate && lead.contactDate <= endDate),
        players: data.players.filter(player => player.registrationDate >= startDate && player.registrationDate <= endDate),
        bonuses: data.bonuses.filter(bonus => bonus.date >= startDate && bonus.date <= endDate)
    };
}

function applyCustomFilter(data, field, value) {
    const filteredData = { ...data };
    
    switch (field) {
        case 'source':
            filteredData.leads = data.leads.filter(lead => lead.source === value);
            break;
        case 'status':
            filteredData.leads = data.leads.filter(lead => lead.status === value);
            filteredData.players = data.players.filter(player => player.status === value);
            break;
        case 'tier':
            filteredData.players = data.players.filter(player => player.tier === value);
            break;
        case 'contactMethod':
            filteredData.leads = data.leads.filter(lead => lead.contactMethod === value);
            break;
    }
    
    return filteredData;
}

function displayReport(type, data) {
    const container = document.getElementById('reportContent');
    
    switch (type) {
        case 'overall':
            container.innerHTML = generateOverallReport(data);
            break;
        case 'leads':
            container.innerHTML = generateLeadsReport(data.leads);
            break;
        case 'players':
            container.innerHTML = generatePlayersReport(data.players);
            break;
        case 'conversions':
            container.innerHTML = generateConversionsReport(data);
            break;
        case 'bonuses':
            container.innerHTML = generateBonusesReport(data.bonuses);
            break;
        case 'custom':
            container.innerHTML = generateCustomReport(data);
            break;
    }
}

function generateOverallReport(data) {
    const totalLeads = data.leads.length;
    const totalPlayers = data.players.length;
    const totalDeposits = data.players.reduce((sum, p) => sum + p.totalDeposits, 0);
    const totalWithdrawals = data.players.reduce((sum, p) => sum + p.totalWithdrawals, 0);
    const totalBonuses = data.bonuses.reduce((sum, b) => sum + b.amount, 0);
    const conversionRate = totalLeads > 0 ? ((data.leads.filter(l => l.status === 'converted').length / totalLeads) * 100).toFixed(1) : 0;
    
    return `
        <div class="report-stats">
            <div class="stat-card">
                <div class="stat-number">${totalLeads}</div>
                <div class="stat-label">Total Leads</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalPlayers}</div>
                <div class="stat-label">Total Players</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${conversionRate}%</div>
                <div class="stat-label">Conversion Rate</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$${totalDeposits.toFixed(2)}</div>
                <div class="stat-label">Total Deposits</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$${totalWithdrawals.toFixed(2)}</div>
                <div class="stat-label">Total Withdrawals</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">$${totalBonuses.toFixed(2)}</div>
                <div class="stat-label">Total Bonuses</div>
            </div>
        </div>
        <h3>Lead Sources</h3>
        ${generateSourceBreakdown(data.leads)}
        <h3>Player Tiers</h3>
        ${generateTierBreakdown(data.players)}
    `;
}

function generateSourceBreakdown(leads) {
    const sources = {};
    leads.forEach(lead => {
        sources[lead.source] = (sources[lead.source] || 0) + 1;
    });
    
    return Object.entries(sources).map(([source, count]) => `
        <div class="stat-card">
            <div class="stat-number">${count}</div>
            <div class="stat-label">${formatValue(source)}</div>
        </div>
    `).join('');
}

function generateTierBreakdown(players) {
    const tiers = {};
    players.forEach(player => {
        tiers[player.tier] = (tiers[player.tier] || 0) + 1;
    });
    
    return Object.entries(tiers).map(([tier, count]) => `
        <div class="stat-card">
            <div class="stat-number">${count}</div>
            <div class="stat-label">${formatValue(tier)}</div>
        </div>
    `).join('');
}

function generateLeadsReport(leads) {
    return `
        <h3>Leads Report (${leads.length} total)</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Contact Method</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Ranking</th>
                </tr>
            </thead>
            <tbody>
                ${leads.map(lead => `
                    <tr>
                        <td>${lead.name}</td>
                        <td>${formatValue(lead.source)}</td>
                        <td>${formatValue(lead.contactMethod)}</td>
                        <td>${formatDate(lead.contactDate)}</td>
                        <td>${formatValue(lead.status)}</td>
                        <td>${formatValue(lead.gamblingRanking)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generatePlayersReport(players) {
    return `
        <h3>Players Report (${players.length} total)</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Player ID</th>
                    <th>Tier</th>
                    <th>Status</th>
                    <th>Deposits</th>
                    <th>Withdrawals</th>
                    <th>Registration</th>
                </tr>
            </thead>
            <tbody>
                ${players.map(player => `
                    <tr>
                        <td>${player.name}</td>
                        <td>${player.playerId}</td>
                        <td>${formatValue(player.tier)}</td>
                        <td>${formatValue(player.status)}</td>
                        <td>$${player.totalDeposits.toFixed(2)}</td>
                        <td>$${player.totalWithdrawals.toFixed(2)}</td>
                        <td>${formatDate(player.registrationDate)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function generateBonusesReport(bonuses) {
    return `
        <h3>Bonuses Report (${bonuses.length} total)</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Player</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Percentage</th>
                    <th>Date</th>
                    <th>Wagering</th>
                </tr>
            </thead>
            <tbody>
                ${bonuses.map(bonus => {
                    const player = players.find(p => p.id === bonus.playerId);
                    return `
                        <tr>
                            <td>${player ? player.name : 'Unknown'}</td>
                            <td>${formatValue(bonus.type)}</td>
                            <td>$${bonus.amount.toFixed(2)}</td>
                            <td>${bonus.percentage > 0 ? bonus.percentage + '%' : 'N/A'}</td>
                            <td>${formatDate(bonus.date)}</td>
                            <td>${bonus.wagering > 0 ? bonus.wagering + 'x' : 'N/A'}</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function generateConversionsReport(data) {
    const convertedLeads = data.leads.filter(lead => lead.status === 'converted');
    return `
        <h3>Lead to Player Conversions (${convertedLeads.length} total)</h3>
        <table class="report-table">
            <thead>
                <tr>
                    <th>Lead Name</th>
                    <th>Source</th>
                    <th>Contact Date</th>
                    <th>Converted Date</th>
                    <th>Days to Convert</th>
                </tr>
            </thead>
            <tbody>
                ${convertedLeads.map(lead => {
                    const daysToConvert = Math.ceil((new Date(lead.createdAt) - new Date(lead.contactDate)) / (1000 * 60 * 60 * 24));
                    return `
                        <tr>
                            <td>${lead.name}</td>
                            <td>${formatValue(lead.source)}</td>
                            <td>${formatDate(lead.contactDate)}</td>
                            <td>${formatDate(lead.createdAt)}</td>
                            <td>${daysToConvert} days</td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
        </table>
    `;
}

function generateCustomReport(data) {
    return `
        <h3>Custom Filtered Report</h3>
        <div class="report-stats">
            <div class="stat-card">
                <div class="stat-number">${data.leads.length}</div>
                <div class="stat-label">Filtered Leads</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.players.length}</div>
                <div class="stat-label">Filtered Players</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${data.bonuses.length}</div>
                <div class="stat-label">Filtered Bonuses</div>
            </div>
        </div>
        ${data.leads.length > 0 ? generateLeadsReport(data.leads) : ''}
        ${data.players.length > 0 ? generatePlayersReport(data.players) : ''}
        ${data.bonuses.length > 0 ? generateBonusesReport(data.bonuses) : ''}
    `;
}

// Export Functions
function exportToCSV(type) {
    let csvContent = '';
    let filename = '';
    
    if (type === 'leads') {
        csvContent = generateLeadsCSV(leads);
        filename = 'leads_export.csv';
    } else if (type === 'players') {
        csvContent = generatePlayersCSV(players);
        filename = 'players_export.csv';
    }
    
    downloadCSV(csvContent, filename);
}

function generateLeadsCSV(leads) {
    const headers = ['Name', 'Email', 'Phone', 'Source', 'Contact Method', 'Contact Date', 'Telegram Username', 'Gambling Ranking', 'Personality & Interests', 'Favorite Games', 'Status', 'Notes'];
    const rows = leads.map(lead => [
        lead.name,
        lead.email || '',
        lead.phone || '',
        lead.source,
        lead.contactMethod,
        lead.contactDate,
        lead.telegramUsername || '',
        lead.gamblingRanking || '',
        lead.personality || '',
        lead.favoriteGames || '',
        lead.status,
        lead.notes || ''
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function generatePlayersCSV(players) {
    const headers = ['Name', 'Email', 'Phone', 'Player ID', 'Registration Date', 'Tier', 'Status', 'Total Deposits', 'Total Withdrawals', 'Last Activity', 'Telegram Username', 'Personality & Interests', 'Favorite Games', 'Notes'];
    const rows = players.map(player => [
        player.name,
        player.email || '',
        player.phone || '',
        player.playerId,
        player.registrationDate,
        player.tier,
        player.status,
        player.totalDeposits,
        player.totalWithdrawals,
        player.lastActivity || '',
        player.telegramUsername || '',
        player.personality || '',
        player.favoriteGames || '',
        player.notes || ''
    ]);
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function exportReport() {
    const reportType = document.getElementById('reportType').value;
    const reportContent = document.getElementById('reportContent').innerHTML;
    
    // Create a simple text report
    let reportText = `Report Type: ${reportType}\n`;
    reportText += `Generated: ${new Date().toLocaleString()}\n\n`;
    reportText += `Total Leads: ${leads.length}\n`;
    reportText += `Total Players: ${players.length}\n`;
    reportText += `Total Bonuses: ${bonuses.length}\n\n`;
    
    // Add CSV data
    if (reportType === 'leads' || reportType === 'overall') {
        reportText += 'LEADS DATA:\n';
        reportText += generateLeadsCSV(leads) + '\n\n';
    }
    
    if (reportType === 'players' || reportType === 'overall') {
        reportText += 'PLAYERS DATA:\n';
        reportText += generatePlayersCSV(players) + '\n\n';
    }
    
    if (reportType === 'bonuses' || reportType === 'overall') {
        reportText += 'BONUSES DATA:\n';
        reportText += generateBonusesCSV(bonuses) + '\n\n';
    }
    
    downloadCSV(reportText, `report_${reportType}_${new Date().toISOString().split('T')[0]}.csv`);
}

function generateBonusesCSV(bonuses) {
    const headers = ['Player Name', 'Player ID', 'Bonus Type', 'Amount', 'Percentage', 'Date', 'Wagering Requirements', 'Expiry Date', 'Notes'];
    const rows = bonuses.map(bonus => {
        const player = players.find(p => p.id === bonus.playerId);
        return [
            player ? player.name : 'Unknown',
            player ? player.playerId : 'Unknown',
            bonus.type,
            bonus.amount,
            bonus.percentage,
            bonus.date,
            bonus.wagering,
            bonus.expiry || '',
            bonus.notes || ''
        ];
    });
    
    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Utility Functions
function saveData() {
    // Save to localStorage with encryption
    saveSecureData();
}

function clearAllData(type) {
    if (confirm(`Are you sure you want to clear all ${type}? This action cannot be undone.`)) {
        if (type === 'leads') {
            leads = [];
        } else if (type === 'players') {
            players = [];
            bonuses = []; // Clear bonuses when clearing players
        }
        saveData();
        renderAllData();
        showMessage(`All ${type} cleared successfully!`, 'success');
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function showMessage(message, type = 'info') {
    // Create and show a temporary message
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'}"></i> ${message}`;
    
    // Position it at the top center
    messageDiv.style.position = 'fixed';
    messageDiv.style.top = '20px';
    messageDiv.style.left = '50%';
    messageDiv.style.transform = 'translateX(-50%)';
    messageDiv.style.zIndex = '9999';
    messageDiv.style.minWidth = '300px';
    messageDiv.style.textAlign = 'center';
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    messageDiv.style.opacity = '0';
    messageDiv.style.transform = 'translateX(-50%) translateY(-20px)';
    setTimeout(() => {
        messageDiv.style.transition = 'all 0.3s ease';
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(-50%) translateY(-20px)';
        setTimeout(() => {
            messageDiv.remove();
        }, 300);
    }, 3000);
}

function formatValue(value) {
    if (!value) return 'N/A';
    return value.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function toggleReportFilters() {
    const reportType = document.getElementById('reportType').value;
    const customFilters = document.getElementById('customFilters');
    customFilters.style.display = reportType === 'custom' ? 'block' : 'none';
}

function toggleDateRange() {
    const dateRange = document.getElementById('dateRange').value;
    const customDateRange = document.getElementById('customDateRange');
    customDateRange.style.display = dateRange === 'custom' ? 'block' : 'none';
}
