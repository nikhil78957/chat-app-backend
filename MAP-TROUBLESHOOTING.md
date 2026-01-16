# Map Troubleshooting Guide 🗺️

## Quick Diagnosis

### Test Files Created:
1. **debug-map.html** - Tests basic Leaflet functionality
2. **test-simple.html** - Interactive testing panel
3. **TEST-FEATURES.html** - Feature verification

### Steps to Diagnose:

#### Step 1: Test Basic Map
Open `debug-map.html` in your browser
- ✅ If you see markers → Leaflet is working
- ❌ If blank → Leaflet library issue

#### Step 2: Test Interactive
Open `test-simple.html` in your browser
- Click buttons 1-4 to test each component
- Check console output for errors

#### Step 3: Check Browser Console
Open index.html and press F12
- Look for red errors
- Check if "Script.js is loading" appears
- Check if "MapApp initialized successfully" appears

## Common Issues & Fixes

### Issue 1: Blank Map
**Symptoms:** White/gray screen, no map tiles

**Fixes:**
```javascript
// Check if map div exists
console.log(document.getElementById('map')); // Should not be null

// Check if Leaflet loaded
console.log(typeof L); // Should be 'object'

// Check map instance
console.log(window.app); // Should show MapApp instance
```

**Solution:** Hard refresh (Ctrl+F5)

### Issue 2: Map Not Initializing
**Symptoms:** Console error "Cannot read property 'map' of undefined"

**Fix:** Ensure DOM is loaded before script runs
```html
<!-- Script should be at end of body -->
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="script.js"></script>
```

### Issue 3: Markers Not Showing
**Symptoms:** Map loads but no markers appear

**Check:**
1. Are Font Awesome icons loading?
2. Are CSS styles applied?
3. Check browser console for errors

**Test:**
```javascript
// In browser console
const testMarker = L.marker([40.7128, -74.0060]).addTo(window.app.map);
testMarker.bindPopup('Test').openPopup();
```

### Issue 4: New Pin Markers Not Showing
**Symptoms:** Old A/B markers or no markers

**Fix:** Clear browser cache
- Chrome: Ctrl+Shift+Delete
- Firefox: Ctrl+Shift+Delete
- Safari: Cmd+Option+E

Then hard refresh: Ctrl+F5 (Cmd+Shift+R on Mac)

### Issue 5: CSS Not Loading
**Symptoms:** Unstyled elements, wrong colors

**Check:**
```html
<!-- Verify these are in index.html <head> -->
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
<link rel="stylesheet" href="styles.css">
```

## Manual Testing Checklist

### ✅ Basic Functionality
- [ ] Map loads and shows tiles
- [ ] Can zoom in/out
- [ ] Can pan around
- [ ] Sidebar appears on left

### ✅ Search & Route
- [ ] Can enter start location
- [ ] Can enter destination
- [ ] "Find Route" button works
- [ ] Route appears on map
- [ ] Blue pin at start (not "A")
- [ ] Red pin at end (not "B")

### ✅ Navigation
- [ ] "Start Navigation" button appears after route
- [ ] Button is enabled (not grayed out)
- [ ] Clicking shows navigation panel
- [ ] Location permission requested

### ✅ Traffic
- [ ] Traffic button toggles
- [ ] Only shows incidents near route
- [ ] Markers have icons and colors

### ✅ Premium Design
- [ ] Gradient backgrounds on buttons
- [ ] Smooth hover effects
- [ ] Rounded corners
- [ ] Shadows on cards
- [ ] Inter font loaded

## Browser Console Commands

### Check if everything loaded:
```javascript
// Check Leaflet
console.log('Leaflet:', typeof L);

// Check map instance
console.log('Map:', window.app?.map);

// Check if map has tiles
console.log('Tiles:', window.app?.map?._layers);

// Test adding marker
if (window.app?.map) {
    L.marker([40.7128, -74.0060])
        .addTo(window.app.map)
        .bindPopup('Test Marker')
        .openPopup();
}
```

### Force reload script:
```javascript
// Remove old script
document.querySelector('script[src="script.js"]')?.remove();

// Add new script
const script = document.createElement('script');
script.src = 'script.js?' + Date.now(); // Cache bust
document.body.appendChild(script);
```

## Still Not Working?

### Nuclear Option - Complete Reset:

1. **Clear Everything:**
   ```
   - Close all browser tabs
   - Clear browser cache completely
   - Clear browser data (cookies, storage)
   - Restart browser
   ```

2. **Verify Files:**
   ```
   - Check script.js has no syntax errors
   - Check styles.css is complete
   - Check index.html has all elements
   ```

3. **Test in Different Browser:**
   - Try Chrome if using Firefox
   - Try Firefox if using Chrome
   - Try incognito/private mode

4. **Check File Paths:**
   ```
   All files should be in same directory:
   - index.html
   - script.js
   - styles.css
   - api.php
   ```

## Expected Console Output

When working correctly, you should see:
```
=== Script.js is loading ===
Constructor - Using secure backend API
DOM loaded, initializing MapApp...
MapApp initialized successfully: MapApp {map: {...}, ...}
Script.js loaded successfully
```

## Get Help

If still having issues, check:
1. Browser console (F12) for errors
2. Network tab for failed requests
3. Elements tab to verify HTML structure

---

**Quick Fix:** 99% of issues are solved by:
1. Hard refresh (Ctrl+F5)
2. Clear cache
3. Check browser console for errors
