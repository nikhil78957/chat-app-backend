# AI Debugging Guide

## Issue: AI not working

I've added enhanced logging to help diagnose the issue. Follow these steps:

### Step 1: Open the test page
1. Open `test-ai.html` in your browser
2. It will automatically run a test when the page loads
3. Check the results on the page

### Step 2: Check browser console
1. Open browser Developer Tools (F12)
2. Go to the Console tab
3. Look for these log messages:
   - "=== Calling Secure Backend API ==="
   - "Response status:"
   - "Raw response text:"
   - "Parsed response data:"

### Step 3: Check for common issues

#### Issue A: 404 Not Found
**Symptom:** Response status: 404
**Solution:** The api.php file is not accessible
- Make sure you're running a PHP server
- Check that api.php is in the same directory as index.html
- Try accessing http://localhost/api.php directly in browser

#### Issue B: CORS Error
**Symptom:** Console shows "CORS policy" error
**Solution:** Already handled in api.php, but verify:
- api.php has the CORS headers at the top
- You're accessing via http://localhost (not file://)

#### Issue C: 401 Unauthorized
**Symptom:** Response status: 401
**Solution:** API key issue
- Check config.php has the correct API key
- Verify the API key is valid on OpenRouter

#### Issue D: 500 Server Error
**Symptom:** Response status: 500
**Solution:** PHP error
- Check PHP error logs
- Make sure config.php exists and is readable
- Verify PHP cURL extension is enabled

#### Issue E: Empty or malformed response
**Symptom:** "Raw response text" is empty or not JSON
**Solution:** 
- Check if PHP is actually running (not just serving the file as text)
- Verify api.php doesn't have syntax errors
- Check PHP error logs

### Step 4: Test the backend directly

Run this in your browser console:
```javascript
fetch('api.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({message: 'test'})
})
.then(r => r.text())
.then(t => console.log('Response:', t))
.catch(e => console.error('Error:', e));
```

### Step 5: Verify PHP server is running

Make sure you're running a PHP server, not just opening the HTML file:

**Option 1: PHP Built-in Server**
```bash
php -S localhost:8000
```
Then access: http://localhost:8000/index.html

**Option 2: XAMPP/WAMP**
- Place files in htdocs folder
- Access via http://localhost/your-folder/

**Option 3: Other web server**
- Make sure PHP is enabled
- Check .htaccess if using Apache

### Step 6: Check what the console shows

After opening the main app (index.html) and clicking "Ask AI":
1. Open browser console (F12)
2. Click the "Ask AI" button in navbar
3. Type a message and send
4. Look for the detailed logs I added

**Expected logs:**
```
=== Calling Secure Backend API ===
Endpoint: api.php
Message: your message here
Response status: 200
Response ok: true
Raw response text: {"success":true,"response":{"role":"assistant","content":"..."}}
Parsed response data: {success: true, response: {...}}
Extracted content: the AI's actual response
```

### Step 7: Common fixes

1. **Clear browser cache** - Old JavaScript might be cached
2. **Hard refresh** - Ctrl+F5 or Cmd+Shift+R
3. **Check file permissions** - config.php and api.php should be readable
4. **Verify PHP version** - Should be PHP 7.0 or higher
5. **Check cURL** - Run `php -m | grep curl` to verify cURL is installed

### What I changed:

1. **Enhanced logging in script.js** - Now shows raw response before parsing
2. **Created test-ai.html** - Standalone test page for debugging
3. **Better error messages** - More specific error handling

### Next steps:

1. Run test-ai.html and share what you see
2. Check browser console and share the logs
3. Let me know which error you're getting

The AI should work once we identify which of these issues is occurring!
