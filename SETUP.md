# 🔒 Secure Setup Guide

## Security Status

✅ **API Key is now secure!** Your OpenRouter API key is stored on the backend and never exposed to the client.

## Setup Options

You have **two backend options** to choose from:

### Option 1: PHP Backend (Simpler - No Installation Required)
### Option 2: Node.js Backend (More Modern)

---

## 🐘 Option 1: PHP Backend Setup

### Requirements
- PHP 7.4 or higher
- PHP cURL extension enabled
- A web server (Apache, Nginx, or PHP built-in server)

### Steps

1. **Verify PHP is installed:**
   ```bash
   php --version
   ```

2. **Your API key is already configured in `config.php`**
   - The file is already set up with your key
   - It's in `.gitignore` so it won't be committed to git

3. **Start the PHP server:**
   ```bash
   php -S localhost:8000
   ```

4. **Open your browser:**
   ```
   http://localhost:8000
   ```

### File Structure (PHP)
```
├── index.html          # Frontend
├── script.js           # Frontend JS (secure - no API key)
├── styles.css          # Styles
├── api.php             # Backend API endpoint
├── config.php          # API key storage (gitignored)
└── .gitignore          # Protects sensitive files
```

---

## 🟢 Option 2: Node.js Backend Setup

### Requirements
- Node.js 14 or higher
- npm (comes with Node.js)

### Steps

1. **Verify Node.js is installed:**
   ```bash
   node --version
   npm --version
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Your API key is already configured in `.env`**
   - The file is already set up with your key
   - It's in `.gitignore` so it won't be committed to git

4. **Start the server:**
   ```bash
   npm start
   ```

   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   ```
   http://localhost:3000
   ```

### File Structure (Node.js)
```
├── index.html          # Frontend
├── script.js           # Frontend JS (secure - no API key)
├── styles.css          # Styles
├── server.js           # Backend server
├── .env                # API key storage (gitignored)
├── package.json        # Node.js dependencies
└── .gitignore          # Protects sensitive files
```

---

## 🔐 Security Features

### ✅ What's Secure Now:

1. **API Key Hidden**: Never exposed in client-side code
2. **Backend Proxy**: All API calls go through your server
3. **Git Protection**: `.gitignore` prevents committing sensitive files
4. **Environment Variables**: API key stored in `.env` or `config.php`

### ⚠️ Important Security Notes:

1. **Never commit these files to git:**
   - `.env` (Node.js)
   - `config.php` (PHP)
   
2. **For production deployment:**
   - Use environment variables on your hosting platform
   - Enable HTTPS
   - Add rate limiting
   - Implement user authentication if needed

3. **Current `.gitignore` protects:**
   ```
   config.php
   .env
   .env.local
   node_modules/
   ```

---

## 🧪 Testing the Setup

1. **Open the application in your browser**
2. **Search for a location** (e.g., "Paris")
3. **Check the browser console** - you should see:
   ```
   === Calling Secure Backend API ===
   ```
4. **You should NOT see** any API keys in:
   - Browser console
   - Network tab
   - Page source code

---

## 🚀 Deployment

### For PHP:
- Upload files to your web hosting
- Set up `config.php` with your API key on the server
- Ensure `.gitignore` is respected

### For Node.js:
- Deploy to platforms like:
  - Heroku
  - Vercel
  - Railway
  - DigitalOcean
- Set environment variable `OPENROUTER_API_KEY` in your hosting dashboard
- The `.env` file is only for local development

---

## 🔧 Troubleshooting

### "API key not configured on server"
- **PHP**: Check that `config.php` exists and has the correct API key
- **Node.js**: Check that `.env` exists and has `OPENROUTER_API_KEY`

### "Network error"
- Make sure the backend server is running
- Check the console for the correct endpoint URL

### "CORS error"
- **PHP**: The `api.php` already has CORS headers
- **Node.js**: The `server.js` already has CORS enabled

---

## 📝 Which Backend Should I Use?

### Choose PHP if:
- ✅ You already have PHP installed
- ✅ You want simpler setup
- ✅ You're deploying to shared hosting
- ✅ You don't want to install Node.js

### Choose Node.js if:
- ✅ You prefer modern JavaScript
- ✅ You want better development tools
- ✅ You're deploying to cloud platforms
- ✅ You want auto-reload during development

---

## ✅ Verification Checklist

- [ ] Backend server is running
- [ ] Application loads in browser
- [ ] Can search for locations
- [ ] AI recommendations work
- [ ] No API key visible in browser console
- [ ] No API key visible in network requests
- [ ] `.gitignore` is protecting sensitive files

---

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Check the server console/logs for errors
3. Verify your API key is correct
4. Make sure you have credits in your OpenRouter account
5. Test the API key using `api-test.html`