# VIP Tracking System

A comprehensive Lead & Player Management System for tracking VIPs, leads, and generating reports.

## Features

- **Lead Management**: Track leads with source, contact method, personality, and favorite games
- **Player Management**: Manage current players with bonuses and important information
- **Comprehensive Reporting**: Generate reports with filtering and CSV export
- **Personality Tracking**: Track interests, favorite sports, athletes, and games
- **Bonus Management**: Track all bonuses given to players
- **CSV Export**: Export all data for analysis

## Deployment on Render

1. **Create a GitHub Repository**:
   - Push this code to GitHub
   - Make sure all files are included

2. **Deploy on Render**:
   - Go to [render.com](https://render.com)
   - Sign up/login with GitHub
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Use these settings:
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Environment**: Node
     - **Plan**: Free

3. **Alternative - Static Site**:
   - Or use "Static Site" option
   - Point to your repository
   - Build Command: (leave empty)
   - Publish Directory: (leave empty)

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

## Data Storage

All data is stored locally in the browser using localStorage. For production use, consider implementing a backend database.

## Tech Stack

- HTML5
- CSS3 (with modern gradients and animations)
- Vanilla JavaScript
- LocalStorage for data persistence
- Responsive design for mobile/desktop
