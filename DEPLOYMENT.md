# 🚀 Deployment Guide - Monkey Tilt VIP System

## 📋 Overview

This guide will help you deploy both the main VIP system and the password API to Render.

## 🔐 Step 1: Deploy Password API

### 1.1 Create Password API Repository
1. Create a new GitHub repository called `monkey-tilt-password-api`
2. Copy these files to the new repository:
   - `password-api.js`
   - `package-password.json` (rename to `package.json`)

### 1.2 Deploy Password API to Render
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your `monkey-tilt-password-api` repository
4. Use these settings:
   - **Name**: `monkey-tilt-password-api`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free
5. **IMPORTANT**: Before clicking "Create Web Service":
   - Click "Advanced" → "Add Environment Variable"
   - **Key**: `SYSTEM_PASSWORD`
   - **Value**: `YourSecurePassword123!` (change this to your desired password)
6. Click "Create Web Service"
7. Wait for deployment to complete
8. **Copy the URL** (e.g., `https://monkey-tilt-password-api.onrender.com`)

## 🎲 Step 2: Update Main Application

### 2.1 Update Password API URL
1. Open `script.js` in your main VIP system
2. Find this line:
   ```javascript
   passwordApiUrl: 'https://your-password-api.onrender.com'
   ```
3. Replace with your actual Render URL:
   ```javascript
   passwordApiUrl: 'https://monkey-tilt-password-api.onrender.com'
   ```

### 2.2 Deploy Main Application
1. Push your updated code to GitHub
2. Go to [render.com](https://render.com)
3. Click "New +" → "Static Site"
4. Connect your main VIP system repository
5. Use these settings:
   - **Name**: `monkey-tilt-vip-system`
   - **Build Command**: (leave empty)
   - **Publish Directory**: `.`
   - **Plan**: Free
6. Click "Create Static Site"

## 🔑 Step 3: Change Password (Easy!)

### 3.1 Update Password via Environment Variable
1. Go to your Render dashboard
2. Click on your password API service
3. Go to "Environment" tab
4. Find `SYSTEM_PASSWORD` variable
5. Click "Edit" and change the value to your new password
6. Click "Save Changes"
7. Render will automatically redeploy with new password
8. **No code changes needed!**

## 🧪 Step 4: Test Deployment

### 4.1 Test Password API
1. Visit your password API URL
2. You should see: `{"status":"Password API is running"}`

### 4.2 Test Main Application
1. Visit your main application URL
2. Try logging in with the password you set in the environment variable
3. Verify all features work correctly

## 🔒 Security Features

### Password Protection
- ✅ **Password stored as environment variable** - never in code
- ✅ **Not visible in GitHub** - completely hidden
- ✅ **Can be changed instantly** via Render dashboard
- ✅ **No code changes needed** to update password
- ✅ **API endpoint protected** by CORS

### Permanent Ban System
- ✅ **3 failed attempts = permanent ban**
- ✅ **Device fingerprinting** - survives cookie clearing
- ✅ **Multiple storage methods** - localStorage, sessionStorage, IndexedDB
- ✅ **IP-based banning** on server side
- ✅ **No recovery possible** once banned

### Data Security
- ✅ All data encrypted in localStorage
- ✅ Session timeout (30 minutes)
- ✅ Anti-inspection measures
- ✅ Right-click disabled
- ✅ Dev tools detection

## 📱 URLs After Deployment

- **Main VIP System**: `https://monkey-tilt-vip-system.onrender.com`
- **Password API**: `https://monkey-tilt-password-api.onrender.com`

## 🆘 Troubleshooting

### Password API Not Working
- Check if the API URL is correct in `script.js`
- Verify the API is deployed and running
- Check Render logs for errors

### Main App Not Loading
- Verify all files are in the repository
- Check that `Publish Directory` is set to `.`
- Ensure `index.html` is in the root

### Login Issues
- Verify password matches in both places
- Check browser console for errors
- Ensure CORS is working properly

## 🔄 Updates

### To Change Password
1. Edit `password-api.js` in the password API repository
2. Push changes to GitHub
3. Render will auto-deploy

### To Update Main App
1. Make changes to your main repository
2. Push to GitHub
3. Render will auto-deploy

---

**🎯 Result**: You'll have a secure VIP management system with the password hidden on a separate service!
