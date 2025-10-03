# 🔒 Security Features - Monkey Tilt VIP System

## 🛡️ Security Overview

The Monkey Tilt VIP Management System includes comprehensive security features to protect sensitive VIP and player data.

## 🔐 Authentication System

### Default Credentials
**⚠️ CHANGE THESE IN PRODUCTION!**

| Username | Password | Access Code | Role |
|----------|----------|-------------|------|
| `admin` | `MonkeyTilt2024!` | `VIP789` | Admin |
| `vip1` | `VipTeam2024!` | `VIP456` | VIP Team |
| `vip2` | `VipTeam2024!` | `VIP123` | VIP Team |

### Multi-Factor Authentication
- **Username**: Unique identifier
- **Password**: Strong password requirement
- **Access Code**: Additional security layer

## 🔒 Data Encryption & Anti-Inspection

### Local Storage Encryption
- All data is encrypted before storage using XOR encryption
- Encryption key: `MonkeyTiltVIP2024SecretKey!`
- Data stored as: `vipLeads_encrypted`, `vipPlayers_encrypted`, `vipBonuses_encrypted`

### Anti-Inspection Measures
- **Obfuscated Credentials**: Login data is obfuscated to prevent easy script inspection
- **Password Hashing**: Passwords are hashed before comparison
- **Right-Click Disabled**: Context menu is disabled to prevent inspection
- **Dev Tools Detection**: Detects and warns about developer tools usage
- **Console Clearing**: Automatically clears browser console
- **Keyboard Shortcuts Blocked**: F12, Ctrl+Shift+I, Ctrl+U are disabled

### Session Management
- Session timeout: 30 minutes of inactivity
- Auto-logout on browser close
- Session data stored in `sessionStorage`

## 🚨 Security Features

### 1. **Login Protection**
- Login screen blocks access to main application
- Invalid credential attempts show error messages
- Session persistence across browser refreshes

### 2. **Data Encryption**
- All VIP data encrypted in localStorage
- Encryption/decryption happens automatically
- Data unreadable without proper authentication

### 3. **Session Security**
- 30-minute inactivity timeout
- Auto-logout on session expiry
- User activity tracking (mouse/keyboard)

### 4. **Access Control**
- Role-based access (Admin/VIP Team)
- Secure logout functionality
- Session validation on every page load

### 5. **Visual Security Indicators**
- 🔒 "Data Encrypted" indicator
- 🛡️ Security status display
- User session information

### 6. **Anti-Inspection Protection**
- 🚫 Right-click context menu disabled
- 🔍 Developer tools detection and warnings
- ⌨️ Keyboard shortcuts blocked (F12, Ctrl+Shift+I, Ctrl+U)
- 🧹 Console automatically cleared
- 🔐 Obfuscated credential storage

## 🔧 Security Configuration

### Changing Default Credentials
Edit the `SECURITY_CONFIG` object in `script.js`:

```javascript
const SECURITY_CONFIG = {
    users: {
        'your_username': { 
            password: 'YourStrongPassword!', 
            accessCode: 'YourAccessCode', 
            role: 'admin' 
        }
    },
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
    encryptionKey: 'YourCustomEncryptionKey!'
};
```

### Security Best Practices

1. **Change Default Credentials**
   - Use strong, unique passwords
   - Change access codes regularly
   - Use different credentials for each user

2. **Encryption Key**
   - Use a long, random encryption key
   - Store it securely
   - Don't share the key

3. **Session Management**
   - Adjust timeout based on your needs
   - Monitor for suspicious activity
   - Regular security audits

## 🚀 Production Deployment

### Security Checklist
- [ ] Change all default credentials
- [ ] Update encryption key
- [ ] Configure HTTPS (Render provides this)
- [ ] Set up proper backup procedures
- [ ] Test all security features
- [ ] Train team on security protocols

### Additional Security (Recommended)
- Implement server-side authentication
- Add database encryption
- Set up audit logging
- Configure IP restrictions
- Add two-factor authentication

## 🆘 Security Issues

### If You Suspect a Breach
1. Change all passwords immediately
2. Update encryption keys
3. Clear all browser data
4. Review access logs
5. Contact system administrator

### Password Recovery
- No automatic password recovery
- Contact admin to reset credentials
- Manual credential update required

## 📞 Support

For security-related issues or questions:
- Contact: System Administrator
- Priority: High
- Response Time: Within 24 hours

---

**⚠️ IMPORTANT**: This is a client-side security implementation. For production use, consider implementing server-side authentication and database encryption for enhanced security.
