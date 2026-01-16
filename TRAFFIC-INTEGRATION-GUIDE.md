# Live Traffic Integration Guide

## Current Implementation

EcoRoute now includes a traffic toggle button that displays simulated traffic data for demonstration purposes. To integrate real-time traffic data, follow this guide.

## Traffic API Options

### Option 1: TomTom Traffic API (Recommended)
**Pros:**
- Free tier: 2,500 requests/day
- Comprehensive traffic flow data
- Real-time incidents
- Easy integration

**Setup:**
1. Sign up at https://developer.tomtom.com/
2. Create an API key
3. Add to your config.php:
```php
define('TOMTOM_API_KEY', 'your-api-key-here');
```

**Implementation:**
```javascript
async fetchTomTomTraffic(lat, lng) {
    const apiKey = 'YOUR_TOMTOM_API_KEY';
    const url = `https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point=${lat},${lng}&key=${apiKey}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        return {
            currentSpeed: data.flowSegmentData.currentSpeed,
            freeFlowSpeed: data.flowSegmentData.freeFlowSpeed,
            confidence: data.flowSegmentData.confidence,
            roadClosure: data.flowSegmentData.roadClosure
        };
    } catch (error) {
        console.error('TomTom Traffic error:', error);
        return null;
    }
}
```

### Option 2: HERE Traffic API
**Pros:**
- Free tier: 250,000 requests/month
- Global coverage
- Traffic incidents and flow

**Setup:**
1. Sign up at https://developer.here.com/
2. Create project and get API key
3. Add to config.php

**Implementation:**
```javascript
async fetchHERETraffic(bbox) {
    const apiKey = 'YOUR_HERE_API_KEY';
    const url = `https://traffic.ls.hereapi.com/traffic/6.3/flow.json?bbox=${bbox}&apiKey=${apiKey}`;
    
    const response = await fetch(url);
    return await response.json();
}
```

### Option 3: Google Maps Traffic Layer
**Pros:**
- Most accurate data
- Easy integration with Google Maps
- Real-time updates

**Cons:**
- Requires Google Maps API (paid)
- Must use Google Maps instead of Leaflet

**Implementation:**
```javascript
// Requires switching to Google Maps
const trafficLayer = new google.maps.TrafficLayer();
trafficLayer.setMap(map);
```

### Option 4: OpenStreetMap Traffic (Free)
**Pros:**
- Completely free
- Open source

**Cons:**
- Limited real-time data
- Less accurate than commercial APIs

## Recommended Implementation

### Step 1: Update config.php
```php
<?php
// Add traffic API configuration
define('TRAFFIC_API_PROVIDER', 'tomtom'); // or 'here', 'google'
define('TRAFFIC_API_KEY', 'your-api-key-here');
?>
```

### Step 2: Create traffic API endpoint (traffic-api.php)
```php
<?php
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$lat = $_GET['lat'] ?? null;
$lng = $_GET['lng'] ?? null;

if (!$lat || !$lng) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing coordinates']);
    exit;
}

$apiKey = TRAFFIC_API_KEY;
$provider = TRAFFIC_API_PROVIDER;

if ($provider === 'tomtom') {
    $url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json?point={$lat},{$lng}&key={$apiKey}";
    
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);
    
    echo $response;
} else {
    http_response_code(501);
    echo json_encode(['error' => 'Provider not implemented']);
}
?>
```

### Step 3: Update script.js
```javascript
async fetchRealTraffic() {
    if (!this.routePolyline) return null;
    
    const bounds = this.routePolyline.getBounds();
    const center = bounds.getCenter();
    
    try {
        const response = await fetch(`traffic-api.php?lat=${center.lat}&lng=${center.lng}`);
        const data = await response.json();
        
        if (data.flowSegmentData) {
            return {
                currentSpeed: data.flowSegmentData.currentSpeed,
                freeFlowSpeed: data.flowSegmentData.freeFlowSpeed,
                congestion: this.calculateCongestion(
                    data.flowSegmentData.currentSpeed,
                    data.flowSegmentData.freeFlowSpeed
                )
            };
        }
        
        return null;
    } catch (error) {
        console.error('Traffic API error:', error);
        return null;
    }
}

calculateCongestion(currentSpeed, freeFlowSpeed) {
    const ratio = currentSpeed / freeFlowSpeed;
    
    if (ratio > 0.8) return 'light';
    if (ratio > 0.5) return 'moderate';
    if (ratio > 0.3) return 'heavy';
    return 'congested';
}
```

### Step 4: Update showTraffic() method
```javascript
async showTraffic() {
    this.showLoading(true);
    
    const trafficData = await this.fetchRealTraffic();
    
    if (trafficData) {
        this.displayTrafficData(trafficData);
        this.showMessage(`Traffic: ${trafficData.congestion} (${trafficData.currentSpeed} km/h)`);
    } else {
        // Fallback to simulated data
        this.addTrafficFlowLayer();
        this.showMessage('Using simulated traffic data');
    }
    
    this.trafficEnabled = true;
    this.showLoading(false);
}

displayTrafficData(trafficData) {
    // Color code the route based on traffic
    if (this.routePolyline) {
        const color = this.getTrafficColor(trafficData.congestion);
        this.routePolyline.setStyle({ color: color, weight: 6 });
    }
    
    // Add traffic info to route info panel
    const routeInfo = document.getElementById('routeInfo');
    if (routeInfo) {
        const trafficDiv = document.createElement('div');
        trafficDiv.className = 'info-item';
        trafficDiv.innerHTML = `
            <span class="info-label"><i class="fas fa-traffic-light"></i> Traffic:</span>
            <span class="info-value" style="color: ${this.getTrafficColor(trafficData.congestion)}">
                ${trafficData.congestion} (${trafficData.currentSpeed} km/h)
            </span>
        `;
        routeInfo.appendChild(trafficDiv);
    }
}
```

## Testing

### Test with Simulated Data
1. Click the Traffic button
2. Verify traffic markers appear on map
3. Check traffic status in popups

### Test with Real API
1. Add API key to config.php
2. Create traffic-api.php endpoint
3. Update fetchRealTraffic() method
4. Test with real routes
5. Verify traffic data displays correctly

## Features to Add

### 1. Traffic-Aware Routing
```javascript
async findRouteWithTraffic() {
    // Request route with traffic consideration
    const url = `https://router.project-osrm.org/route/v1/driving/${this.startPoint.lng},${this.startPoint.lat};${this.endPoint.lng},${this.endPoint.lat}?overview=full&geometries=geojson&steps=true&annotations=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Adjust time estimate based on traffic
    const trafficData = await this.fetchRealTraffic();
    if (trafficData) {
        const trafficMultiplier = this.getTrafficMultiplier(trafficData.congestion);
        const adjustedTime = data.routes[0].duration * trafficMultiplier;
        
        // Update display with traffic-adjusted time
        this.displayAdjustedTime(adjustedTime);
    }
}

getTrafficMultiplier(congestion) {
    const multipliers = {
        'light': 1.0,
        'moderate': 1.3,
        'heavy': 1.7,
        'congested': 2.5
    };
    return multipliers[congestion] || 1.0;
}
```

### 2. Alternative Routes
```javascript
async findAlternativeRoutes() {
    // Request multiple route options
    const url = `https://router.project-osrm.org/route/v1/driving/${this.startPoint.lng},${this.startPoint.lat};${this.endPoint.lng},${this.endPoint.lat}?alternatives=3&overview=full`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    // Display all routes with traffic info
    data.routes.forEach((route, index) => {
        this.displayAlternativeRoute(route, index);
    });
}
```

### 3. Traffic Alerts
```javascript
async checkTrafficIncidents() {
    // Fetch traffic incidents along route
    const incidents = await this.fetchTrafficIncidents();
    
    if (incidents && incidents.length > 0) {
        this.showTrafficAlert(incidents);
    }
}

showTrafficAlert(incidents) {
    const alert = document.createElement('div');
    alert.className = 'traffic-alert';
    alert.innerHTML = `
        <i class="fas fa-exclamation-triangle"></i>
        <strong>Traffic Alert:</strong> ${incidents[0].description}
    `;
    document.body.appendChild(alert);
}
```

## Cost Estimation

### TomTom Free Tier
- 2,500 requests/day
- ~75,000 requests/month
- Sufficient for small to medium apps

### HERE Free Tier
- 250,000 requests/month
- Best for high-traffic apps

### Upgrade Costs
- TomTom: $0.50 per 1,000 requests
- HERE: $1.00 per 1,000 requests
- Google Maps: $2.00 per 1,000 requests

## Best Practices

1. **Cache Traffic Data**: Cache for 5-10 minutes to reduce API calls
2. **Batch Requests**: Request traffic for multiple points at once
3. **Error Handling**: Always have fallback to simulated data
4. **Rate Limiting**: Implement client-side rate limiting
5. **User Feedback**: Show loading states and error messages

## Conclusion

The traffic feature is currently implemented with simulated data for demonstration. To enable real traffic:

1. Choose a traffic API provider
2. Sign up and get API key
3. Create backend endpoint (traffic-api.php)
4. Update fetchRealTraffic() method
5. Test thoroughly

For production use, TomTom Traffic API is recommended for its balance of features, accuracy, and cost.
