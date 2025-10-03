# 🎲 Monkey Tilt VIP Management System

A comprehensive, secure Lead & Player Management System for tracking VIPs, leads, and generating reports with advanced security features.

## 🔐 Security Features

- **Multi-Factor Authentication**: Username, password, and access code
- **Data Encryption**: All data encrypted in localStorage
- **Session Management**: 30-minute timeout with auto-logout
- **Access Control**: Role-based permissions
- **Security Indicators**: Visual security status display

## 🚀 Features

- **Lead Management**: Track leads with source, contact method, personality, and favorite games
- **Player Management**: Manage current players with bonuses and important information
- **Comprehensive Reporting**: Generate reports with filtering and CSV export
- **Personality Tracking**: Track interests, favorite sports, athletes, and games
- **Bonus Management**: Track all bonuses given to players
- **CSV Export**: Export all data for analysis
- **Secure Data Storage**: Encrypted local storage

## 🔑 Default Login Credentials

**⚠️ CHANGE THESE IN PRODUCTION!**

| Username | Password | Access Code | Role |
|----------|----------|-------------|------|
| `admin` | `MonkeyTilt2024!` | `VIP789` | Admin |
| `vip1` | `VipTeam2024!` | `VIP456` | VIP Team |
| `vip2` | `VipTeam2024!` | `VIP123` | VIP Team |

## 🚀 Deployment on Render

1. **Create a GitHub Repository**:
   - Push this code to GitHub
   - Make sure all files are included

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New +" → "Static Site"
   - Connect your GitHub repository
   - Use these settings:
     - **Build Command**: (leave empty)
     - **Publish Directory**: `.`
     - **Environment**: Static Site
     - **Plan**: Free

3. **Security Configuration**:
   - See `SECURITY.md` for detailed security setup
   - Change default credentials before production use
   - Configure encryption keys for your environment

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Usage

1. **Add Leads**: Track potential players with their source, contact info, and interests
2. **Add Players**: Manage current players with their gaming preferences and bonuses
3. **Generate Reports**: Create comprehensive reports with filtering options
4. **Export Data**: Download CSV files for analysis

## 🔒 Data Storage & Security

- **Encrypted Storage**: All data is encrypted before storage in localStorage
- **Session Security**: 30-minute timeout with auto-logout
- **No External Servers**: All data stays in the browser
- **Backup Recommended**: For production use, consider implementing a backend database

## Tech Stack

- HTML5
- CSS3 (with modern gradients and animations)
- Vanilla JavaScript
- LocalStorage for data persistence
- Responsive design for mobile/desktop
