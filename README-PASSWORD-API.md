# 🔐 Password API - Monkey Tilt VIP System

## 📋 Overview

This is the password verification API for the Monkey Tilt VIP Management System. It runs as a separate service to keep the password completely hidden from the main application code.

## 🔒 Security Features

- **Environment Variable Password** - Password never stored in code
- **IP-based Ban Tracking** - Bans IPs after 3 failed attempts
- **CORS Protection** - Only allows requests from authorized domains
- **Permanent Bans** - No recovery possible once banned

## 🚀 Deployment

### 1. Create GitHub Repository
- Repository name: `monkey-tilt-password-api`
- Add these files:
  - `password-api.js`
  - `package-password.json` (rename to `package.json`)

### 2. Deploy to Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your repository
4. **CRITICAL**: Add environment variable:
   - **Key**: `SYSTEM_PASSWORD`
   - **Value**: Your secure password (e.g., `MySecurePassword123!`)
5. Deploy with these settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

### 3. Update Main App
- Update the `passwordApiUrl` in your main app's `script.js`
- Point it to your Render API URL

## 🔑 Changing Password

**Super Easy!** No code changes needed:

1. Go to Render dashboard
2. Click your password API service
3. Go to "Environment" tab
4. Edit `SYSTEM_PASSWORD` value
5. Save - auto-deploys instantly!

## 📡 API Endpoints

### POST `/verify-password`
Verifies password and tracks failed attempts.

**Request:**
```json
{
  "password": "YourPassword123!"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Access granted",
  "timestamp": 1234567890
}
```

**Response (Failed):**
```json
{
  "success": false,
  "message": "Invalid password",
  "attemptsRemaining": 2
}
```

**Response (Banned):**
```json
{
  "success": false,
  "message": "Access permanently denied",
  "banned": true
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "Password API is running"
}
```

## 🛡️ Security Notes

- **Password is never in code** - only in environment variables
- **IP banning** prevents brute force attacks
- **Permanent bans** - no recovery possible
- **CORS enabled** for cross-origin requests
- **No logging** of actual passwords

## 🔧 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SYSTEM_PASSWORD` | The password for system access | Yes |
| `PORT` | Port to run on (default: 3000) | No |

## 📞 Support

This API is designed to work seamlessly with the Monkey Tilt VIP Management System. The password is completely hidden and can be changed instantly via the Render dashboard.
