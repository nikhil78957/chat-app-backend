# 🚀 Quick Start Guide

## ✅ Everything is Ready!

Your API key is secure and the application is ready to run.

---

## 🏃 Start in 3 Steps

### Option A: PHP (Recommended for Quick Start)

```bash
# Step 1: Navigate to project folder
cd your-project-folder

# Step 2: Start PHP server
php -S localhost:8000

# Step 3: Open browser
# Go to: http://localhost:8000
```

### Option B: Node.js

```bash
# Step 1: Install dependencies (first time only)
npm install

# Step 2: Start server
npm start

# Step 3: Open browser
# Go to: http://localhost:3000
```

---

## 🎯 Test It Out

1. **Search for a location**: Type "Paris" and click 🔍
2. **AI will automatically suggest places to visit**
3. **Chat with AI**: Use the 🤖 button or chat panel
4. **Try these searches**:
   - Tokyo
   - New York
   - London
   - Bali

---

## 🔒 Security Confirmed

✅ Your API key is **NOT** exposed in:
- Browser console
- Network requests
- Page source code
- Git repository

✅ API key is **ONLY** stored in:
- `.env` (Node.js) - gitignored
- `config.php` (PHP) - gitignored

---

## 📁 Project Structure

```
your-project/
├── 🌐 Frontend (Client-side)
│   ├── index.html          # Main page
│   ├── script.js           # JavaScript (secure!)
│   └── styles.css          # Styling
│
├── 🔐 Backend (Server-side)
│   ├── api.php             # PHP endpoint
│   ├── config.php          # PHP config (gitignored)
│   ├── server.js           # Node.js server
│   └── .env                # Node.js config (gitignored)
│
├── 📚 Documentation
│   ├── README.md           # Main documentation
│   ├── SETUP.md            # Detailed setup guide
│   ├── SECURITY-CHECK.md   # Security audit
│   └── QUICKSTART.md       # This file
│
└── 🛠️ Configuration
    ├── .gitignore          # Protects sensitive files
    └── package.json        # Node.js dependencies
```

---

## 🎨 Features

- 🗺️ **Interactive Map**: OpenStreetMap integration
- 🤖 **AI Assistant**: DeepSeek R1 powered recommendations
- 📍 **Location Search**: Find any place worldwide
- 🎯 **Auto-recommendations**: AI suggests places when you search
- 📱 **Mobile Responsive**: Works on all devices
- 🔒 **Secure**: API key protected on backend

---

## 🆘 Troubleshooting

### "Cannot GET /"
- Make sure you're running the server
- Check the correct port (8000 for PHP, 3000 for Node.js)

### "API key not configured"
- **PHP**: Check `config.php` exists
- **Node.js**: Check `.env` exists

### "Network error"
- Verify the backend server is running
- Check browser console for errors

---

## 📖 Need More Help?

- **Detailed Setup**: See `SETUP.md`
- **Security Info**: See `SECURITY-CHECK.md`
- **Full Documentation**: See `README.md`
- **API Testing**: Open `api-test.html` in browser

---

## ✨ You're All Set!

Your secure AI map application is ready to use. Enjoy! 🎉