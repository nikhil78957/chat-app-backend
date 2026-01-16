console.log('=== Script.js is loading ===');

class MapApp {
    constructor() {
        this.map = null;
        this.markers = [];
        this.userLocation = null;
        this.userMarker = null; // Live location marker
        this.userHeading = 0; // Device heading from compass
        
        // Use backend API endpoint - no API key exposed!
        this.apiEndpoint = 'api.php';
        
        // Route planning state
        this.startPoint = null;
        this.endPoint = null;
        this.routePolyline = null;
        this.routeDistance = 0; // Store actual route distance in km
        this.routeSteps = []; // Store turn-by-turn directions
        this.destinationInfo = null; // Cache destination info
        this.trafficLayer = null; // Traffic overlay layer
        this.trafficEnabled = false; // Traffic toggle state
        this.trafficMarkers = []; // Traffic incident markers
        
        // Live navigation state
        this.navigationMode = false;
        this.currentStepIndex = 0;
        this.watchId = null; // Geolocation watch ID
        this.orientationSupported = false;
        this.petrolPumpMarkers = []; // Petrol pump markers
        
        // Carbon calculator state
        this.carbonPoints = [];
        this.carbonPolyline = null;
        
        // New search state
        this.searchTimeout = null;
        this.nearbyPlaces = [];
        this.selectedPlace = null;
        
        console.log('Constructor - Using secure backend API');
        
        this.init();
    }

    init() {
        this.initMap();
        this.bindEvents();
        this.requestLocation();
        this.initOrientation();
        this.showNearbyPlaces(); // Show nearby places on load
    }
    
    initOrientation() {
        // Check if device orientation is supported
        if (window.DeviceOrientationEvent) {
            // iOS 13+ requires permission
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // Will request permission when navigation starts
                this.orientationSupported = true;
            } else {
                // Android and older iOS
                this.orientationSupported = true;
                window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
            }
        }
    }
    
    async requestOrientationPermission() {
        if (typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permission = await DeviceOrientationEvent.requestPermission();
                if (permission === 'granted') {
                    window.addEventListener('deviceorientation', (e) => this.handleOrientation(e), true);
                    return true;
                }
            } catch (error) {
                console.error('Orientation permission error:', error);
            }
            return false;
        }
        return true; // Already granted or not needed
    }
    
    handleOrientation(event) {
        if (event.webkitCompassHeading) {
            // iOS
            this.userHeading = event.webkitCompassHeading;
        } else if (event.alpha) {
            // Android
            this.userHeading = 360 - event.alpha;
        }
        
        // Update user marker rotation if in navigation mode
        if (this.navigationMode && this.userMarker) {
            this.updateUserMarkerRotation();
        }
    }
    
    updateUserMarkerRotation() {
        if (!this.userMarker) return;
        
        const icon = this.userMarker.getElement();
        if (icon) {
            const arrow = icon.querySelector('.user-location-arrow');
            if (arrow) {
                arrow.style.transform = `rotate(${this.userHeading}deg)`;
            }
        }
    }

    initMap() {
        // Initialize map centered on a default location
        this.map = L.map('map').setView([40.7128, -74.0060], 10);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Add click event to map
        this.map.on('click', (e) => {
            this.addMarker(e.latlng.lat, e.latlng.lng, 'Clicked Location');
        });
    }

    bindEvents() {
        // Menu toggle for mobile
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                document.getElementById('sidebar').classList.toggle('open');
            });
        }

        // New search input with autocomplete
        const mainSearchInput = document.getElementById('mainSearchInput');
        if (mainSearchInput) {
            mainSearchInput.addEventListener('input', (e) => {
                this.handleSearchInput(e.target.value);
            });
            
            mainSearchInput.addEventListener('focus', () => {
                if (mainSearchInput.value.trim()) {
                    this.handleSearchInput(mainSearchInput.value);
                }
            });
        }

        // Clear search button
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.addEventListener('click', () => {
                mainSearchInput.value = '';
                clearSearchBtn.style.display = 'none';
                document.getElementById('searchSuggestions').style.display = 'none';
                this.showNearbyPlaces();
            });
        }

        // Location and clear buttons
        const locationBtn = document.getElementById('locationBtn');
        if (locationBtn) {
            locationBtn.addEventListener('click', () => {
                this.goToUserLocation();
            });
        }

        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearRoute();
                this.showNearbyPlaces();
            });
        }

        // Carbon calculator button
        const carbonBtn = document.getElementById('carbonBtn');
        if (carbonBtn) {
            carbonBtn.addEventListener('click', () => {
                this.toggleCarbonCalculator();
            });
        }

        const calculateBtn = document.getElementById('calculateBtn');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.calculateCarbon();
            });
        }

        // Start Navigation button
        const startNavBtn = document.getElementById('startNavBtn');
        if (startNavBtn) {
            startNavBtn.addEventListener('click', () => {
                this.startLiveNavigation();
            });
        }

        // Close sidebar when clicking on map (mobile)
        this.map.on('click', () => {
            if (window.innerWidth <= 768) {
                const sidebar = document.getElementById('sidebar');
                if (sidebar) sidebar.classList.remove('open');
            }
        });

        // Mobile sidebar minimize/expand
        const expandMapBtn = document.getElementById('expandMapBtn');
        if (expandMapBtn) {
            expandMapBtn.addEventListener('click', () => {
                this.expandSidebar();
            });
        }

        // Drag handle tap to toggle
        const dragHandle = document.getElementById('dragHandle');
        if (dragHandle) {
            dragHandle.addEventListener('click', (e) => {
                this.toggleSidebar();
            });
        }

        // Ask AI modal
        const askAINav = document.getElementById('askAINav');
        if (askAINav) {
            askAINav.addEventListener('click', (e) => {
                e.preventDefault();
                this.openAIModal();
            });
        }

        const closeAIModal = document.getElementById('closeAIModal');
        if (closeAIModal) {
            closeAIModal.addEventListener('click', () => {
                this.closeAIModal();
            });
        }

        const sendAIModalBtn = document.getElementById('sendAIModalBtn');
        if (sendAIModalBtn) {
            sendAIModalBtn.addEventListener('click', () => {
                this.sendAIModalMessage();
            });
        }

        const aiModalInput = document.getElementById('aiModalInput');
        if (aiModalInput) {
            aiModalInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAIModalMessage();
                }
            });
        }

        // Close modal on backdrop click
        const aiModal = document.getElementById('aiModal');
        if (aiModal) {
            aiModal.addEventListener('click', (e) => {
                if (e.target.id === 'aiModal') {
                    this.closeAIModal();
                }
            });
        }
    }

    showLoading(show = true) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    async findRoute() {
        const startQuery = document.getElementById('startInput').value.trim();
        const endQuery = document.getElementById('endInput').value.trim();

        console.log('Finding route from:', startQuery, 'to:', endQuery);

        if (!startQuery || !endQuery) {
            alert('Please enter both starting point and destination');
            return;
        }

        this.showLoading(true);

        try {
            // Geocode start point
            console.log('Geocoding start point...');
            const startResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(startQuery)}&limit=1`
            );
            const startData = await startResponse.json();
            console.log('Start data:', startData);

            // Geocode end point
            console.log('Geocoding end point...');
            const endResponse = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(endQuery)}&limit=1`
            );
            const endData = await endResponse.json();
            console.log('End data:', endData);

            if (startData && startData.length > 0 && endData && endData.length > 0) {
                this.startPoint = {
                    lat: parseFloat(startData[0].lat),
                    lng: parseFloat(startData[0].lon),
                    name: startData[0].display_name
                };

                this.endPoint = {
                    lat: parseFloat(endData[0].lat),
                    lng: parseFloat(endData[0].lon),
                    name: endData[0].display_name
                };

                console.log('Drawing route...');
                await this.drawRoute();
                
                // Preload destination info in background
                this.preloadDestinationInfo();
                
            } else {
                alert('Could not find one or both locations. Please try different search terms.');
            }
        } catch (error) {
            console.error('Route search error:', error);
            alert('Error finding route: ' + error.message);
        } finally {
            this.showLoading(false);
        }
    }

    async drawRoute() {
        console.log('drawRoute called');
        console.log('Start point:', this.startPoint);
        console.log('End point:', this.endPoint);
        console.log('Map initialized:', !!this.map);
        
        if (!this.map) {
            console.error('Map not initialized!');
            alert('Map is not ready. Please wait a moment and try again.');
            return;
        }
        
        if (!this.startPoint || !this.endPoint) {
            console.error('Start or end point is null!');
            alert('Could not get location coordinates. Please try different location names.');
            return;
        }
        
        if (!this.startPoint.lat || !this.startPoint.lng || !this.endPoint.lat || !this.endPoint.lng) {
            console.error('Invalid coordinates!');
            alert('Invalid location coordinates received.');
            return;
        }
        
        // Clear previous route (markers and polyline only, keep the points)
        if (this.markers.length > 0) {
            this.markers.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.markers = [];
        }
        
        if (this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
            this.routePolyline = null;
        }

        try {
            // Add start marker with location pin icon
            const startMarker = L.marker([this.startPoint.lat, this.startPoint.lng], {
                icon: L.divIcon({
                    className: 'route-marker start-marker',
                    html: `<div class="marker-container">
                        <div class="marker-pin start-pin">
                            <i class="fas fa-circle"></i>
                        </div>
                        <div class="marker-shadow"></div>
                    </div>`,
                    iconSize: [40, 50],
                    iconAnchor: [20, 50]
                })
            }).addTo(this.map);
            startMarker.bindPopup(`<strong>📍 Starting Point</strong><br>${this.startPoint.name}`);
            this.markers.push(startMarker);
            console.log('Start marker added');

            // Add end marker with flag icon
            const endMarker = L.marker([this.endPoint.lat, this.endPoint.lng], {
                icon: L.divIcon({
                    className: 'route-marker end-marker',
                    html: `<div class="marker-container">
                        <div class="marker-pin end-pin">
                            <i class="fas fa-location-dot"></i>
                        </div>
                        <div class="marker-shadow"></div>
                    </div>`,
                    iconSize: [40, 50],
                    iconAnchor: [20, 50]
                })
            }).addTo(this.map);
            endMarker.bindPopup(`<strong>🎯 Destination</strong><br>${this.endPoint.name}`);
            this.markers.push(endMarker);
            console.log('End marker added');

            // Draw route line using OSRM routing service
            console.log('Fetching road route from OSRM...');
            const routeResponse = await fetch(
                `https://router.project-osrm.org/route/v1/driving/${this.startPoint.lng},${this.startPoint.lat};${this.endPoint.lng},${this.endPoint.lat}?overview=full&geometries=geojson&steps=true`
            );
            const routeData = await routeResponse.json();
            
            console.log('OSRM Response:', routeData);
            
            if (routeData.code === 'Ok' && routeData.routes && routeData.routes.length > 0) {
                const route = routeData.routes[0];
                const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]); // Convert [lng, lat] to [lat, lng]
                
                // Store route steps for directions
                if (route.legs && route.legs.length > 0 && route.legs[0].steps) {
                    this.routeSteps = route.legs[0].steps;
                    console.log('Route steps loaded:', this.routeSteps.length, 'steps');
                } else {
                    console.warn('No steps found in route data');
                    this.routeSteps = [];
                }
                
                // Draw the actual road route
                this.routePolyline = L.polyline(coordinates, {
                    color: '#3498db',
                    weight: 5,
                    opacity: 0.8
                }).addTo(this.map);
                console.log('Road route added');
                
                // Use distance from routing service (more accurate)
                const distance = route.distance / 1000; // Convert meters to km
                const duration = route.duration / 60; // Convert seconds to minutes
                const hours = Math.floor(duration / 60);
                const minutes = Math.round(duration % 60);
                
                // Store the actual route distance
                this.routeDistance = distance;
                
                console.log('Distance:', distance, 'km');
                console.log('Duration:', hours, 'h', minutes, 'm');
                
                // Update route info
                document.getElementById('routeDistance').textContent = `${distance.toFixed(2)} km`;
                document.getElementById('routeTime').textContent = hours > 0 
                    ? `${hours}h ${minutes}m` 
                    : `${minutes} min`;
                document.getElementById('routeInfo').style.display = 'block';
                
                // Enable navigation button
                const navBtn = document.getElementById('startNavBtn');
                if (navBtn) {
                    navBtn.disabled = false;
                    navBtn.style.display = 'flex';
                }
                
                // Show petrol pumps along route
                this.showPetrolPumpsAlongRoute();
                
                // Automatically show traffic along route
                if (!this.trafficEnabled) {
                    this.showTrafficAlongRoute();
                }
                
                // Fit map to show route
                this.map.fitBounds(this.routePolyline.getBounds(), { padding: [50, 50] });
                
            } else {
                // Fallback to straight line if routing fails
                console.warn('OSRM routing failed, using straight line');
                this.routePolyline = L.polyline(
                    [[this.startPoint.lat, this.startPoint.lng], [this.endPoint.lat, this.endPoint.lng]],
                    {
                        color: '#3498db',
                        weight: 4,
                        opacity: 0.7,
                        dashArray: '10, 10'
                    }
                ).addTo(this.map);
                
                // Calculate straight-line distance
                const distance = this.map.distance(
                    [this.startPoint.lat, this.startPoint.lng],
                    [this.endPoint.lat, this.endPoint.lng]
                ) / 1000;
                
                // Store the distance
                this.routeDistance = distance;
                
                const timeHours = distance / 60;
                const hours = Math.floor(timeHours);
                const minutes = Math.round((timeHours - hours) * 60);
                
                document.getElementById('routeDistance').textContent = `${distance.toFixed(2)} km (straight)`;
                document.getElementById('routeTime').textContent = hours > 0 
                    ? `~${hours}h ${minutes}m` 
                    : `~${minutes} min`;
                document.getElementById('routeInfo').style.display = 'block';
                
                this.map.fitBounds([
                    [this.startPoint.lat, this.startPoint.lng],
                    [this.endPoint.lat, this.endPoint.lng]
                ], { padding: [50, 50] });
            }
            console.log('Route line added');

            console.log('Route drawn successfully');
        } catch (error) {
            console.error('Error in drawRoute:', error);
            alert('Error drawing route: ' + error.message);
        }
    }

    async preloadDestinationInfo() {
        // Preload destination info in background without showing it
        if (!this.endPoint) {
            console.log('No endpoint set, skipping preload');
            return;
        }
        
        const destination = document.getElementById('endInput').value.trim();
        if (!destination) {
            console.log('No destination entered, skipping preload');
            return;
        }

        console.log('=== Preloading destination info ===');
        console.log('Destination:', destination);
        
        // Show subtle loading indicator on Ask AI button
        const askAIBtn = document.getElementById('askAINav');
        if (askAIBtn) {
            askAIBtn.classList.add('info-loading');
            askAIBtn.classList.remove('info-ready');
        }

        try {
            const prompt = `Tell me about ${destination} as a travel destination. Include: 1) Brief overview, 2) Top 3-5 must-visit places, 3) Best time to visit, 4) Local cuisine highlights. Keep it concise and informative.`;
            console.log('Calling API with prompt:', prompt);
            
            const response = await this.callOpenRouterAPI(prompt);
            console.log('API response received:', response ? response.substring(0, 100) + '...' : 'null');
            
            // Check if response is an error message
            if (response && response.startsWith('Error')) {
                console.error('API returned error:', response);
                this.destinationInfo = null;
                if (askAIBtn) {
                    askAIBtn.classList.remove('info-loading');
                }
                return;
            }
            
            this.destinationInfo = response; // Cache it
            console.log('✓ Destination info preloaded and cached successfully');
            
            // Show indicator that info is ready
            if (askAIBtn) {
                askAIBtn.classList.remove('info-loading');
                askAIBtn.classList.add('info-ready');
                // Add a small pulse animation
                askAIBtn.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    askAIBtn.style.animation = '';
                }, 500);
            }
            
        } catch (error) {
            console.error('Preload destination info error:', error);
            console.error('Error stack:', error.stack);
            this.destinationInfo = null;
            // Silently fail - user can still click the button to try again
            if (askAIBtn) {
                askAIBtn.classList.remove('info-loading');
            }
        }
    }

    useCurrentLocationAsStart() {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser');
            return;
        }

        this.showLoading(true);
        const startInput = document.getElementById('startInput');
        startInput.value = 'Getting your location...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                console.log('Current location:', lat, lng);

                // Reverse geocode to get address
                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                    );
                    const data = await response.json();

                    if (data && data.display_name) {
                        startInput.value = data.display_name;
                        
                        // Set the start point directly
                        this.startPoint = {
                            lat: lat,
                            lng: lng,
                            name: data.display_name
                        };

                        console.log('Location set:', data.display_name);
                    } else {
                        startInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        this.startPoint = {
                            lat: lat,
                            lng: lng,
                            name: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                        };
                    }
                } catch (error) {
                    console.error('Reverse geocoding error:', error);
                    startInput.value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    this.startPoint = {
                        lat: lat,
                        lng: lng,
                        name: `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
                    };
                }

                this.showLoading(false);
            },
            (error) => {
                console.error('Geolocation error:', error);
                let errorMsg = 'Could not get your location. ';
                
                switch(error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg += 'Please allow location access.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg += 'Location information unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMsg += 'Location request timed out.';
                        break;
                    default:
                        errorMsg += 'Unknown error occurred.';
                }
                
                alert(errorMsg);
                startInput.value = '';
                this.showLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }

    clearRoute() {
        // Clear markers
        if (this.map && this.markers.length > 0) {
            this.markers.forEach(marker => {
                this.map.removeLayer(marker);
            });
        }
        this.markers = [];

        // Clear route line
        if (this.map && this.routePolyline) {
            this.map.removeLayer(this.routePolyline);
            this.routePolyline = null;
        }
        
        // Clear petrol pump markers
        if (this.petrolPumpMarkers && this.petrolPumpMarkers.length > 0) {
            this.petrolPumpMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.petrolPumpMarkers = [];
        }
        
        // Clear traffic markers
        if (this.trafficMarkers && this.trafficMarkers.length > 0) {
            this.trafficMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.trafficMarkers = [];
        }
        this.trafficEnabled = false;

        // Clear route info
        const routeInfo = document.getElementById('routeInfo');
        if (routeInfo) {
            routeInfo.style.display = 'none';
        }

        // Reset points and distance
        this.startPoint = null;
        this.endPoint = null;
        this.routeDistance = 0;
        this.routeSteps = [];
        this.destinationInfo = null; // Clear cached info
        
        // Remove info-ready indicator from Ask AI button
        const askAIBtn = document.getElementById('askAINav');
        if (askAIBtn) {
            askAIBtn.classList.remove('info-ready', 'info-loading');
        }
        
        // Clear AI modal messages so new destination info can be shown
        const aiModalMessages = document.getElementById('aiModalMessages');
        if (aiModalMessages) {
            aiModalMessages.innerHTML = '';
        }
        
        // Reset carbon calculator display
        document.getElementById('distanceDisplay').textContent = 'Set route first';
        document.getElementById('calculateBtn').disabled = true;
        document.getElementById('carbonResult').style.display = 'none';
        
        // Clear search and show nearby places
        const mainSearchInput = document.getElementById('mainSearchInput');
        if (mainSearchInput) {
            mainSearchInput.value = '';
        }
        const clearSearchBtn = document.getElementById('clearSearchBtn');
        if (clearSearchBtn) {
            clearSearchBtn.style.display = 'none';
        }
        this.selectedPlace = null;
    }

    async sendChatMessage() {
        const message = document.getElementById('chatInput').value.trim();
        if (!message) return;

        this.addChatMessage(message, 'user');
        document.getElementById('chatInput').value = '';
        this.showLoading(true);

        try {
            const response = await this.callOpenRouterAPI(message);
            this.addChatMessage(response, 'ai');
            await this.processAIResponse(response);
        } catch (error) {
            console.error('Chat error:', error);
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'ai');
        } finally {
            this.showLoading(false);
        }
    }

    async callOpenRouterAPI(message) {
        console.log('=== Calling Secure Backend API ===');
        console.log('Endpoint:', this.apiEndpoint);
        console.log('Message:', message);
        
        try {
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message
                })
            });

            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);

            // Get response text once
            const responseText = await response.text();
            console.log('Raw response text:', responseText);
            console.log('Response length:', responseText.length);

            // Parse JSON
            let data;
            try {
                data = JSON.parse(responseText);
                console.log('Parsed JSON successfully:', data);
            } catch (e) {
                console.error('JSON parse error:', e);
                console.error('Failed to parse:', responseText.substring(0, 500));
                return `Error: Could not parse server response. Server returned: ${responseText.substring(0, 100)}`;
            }

            // Handle error responses
            if (!response.ok) {
                console.error('Backend API Error:', response.status, data);
                
                if (response.status === 401) {
                    return "Invalid API key on server";
                } else if (response.status === 402) {
                    return "Insufficient credits. Please add credits to your OpenRouter account.";
                } else if (response.status === 429) {
                    return "Rate limit exceeded. Please try again in a moment.";
                } else if (response.status === 500) {
                    return data.error || "Server error. Please check server logs.";
                } else {
                    return data.error || `API Error (${response.status}): Please try again later.`;
                }
            }
            
            // Handle success response
            console.log('Success response structure:', {
                hasSuccess: 'success' in data,
                hasResponse: 'response' in data,
                responseType: typeof data.response,
                responseKeys: data.response ? Object.keys(data.response) : null
            });
            
            if (!data.response) {
                console.error('No response field in data:', data);
                return "Error: Server response missing 'response' field.";
            }
            
            // Extract content from response
            if (typeof data.response === 'string') {
                console.log('Response is string, returning directly');
                return data.response;
            } else if (data.response.content) {
                console.log('Extracted content from response.content');
                return data.response.content;
            } else if (data.response.message && data.response.message.content) {
                console.log('Extracted content from response.message.content');
                return data.response.message.content;
            } else {
                console.error('Cannot extract content from response:', data.response);
                return "Error: Could not extract AI response content. Response structure: " + JSON.stringify(data.response).substring(0, 100);
            }
            
        } catch (error) {
            console.error('Network error calling backend API:', error);
            console.error('Error stack:', error.stack);
            return "Network error: " + error.message;
        }
    }

    addMarker(lat, lng, title = 'Location') {
        const marker = L.marker([lat, lng]).addTo(this.map);
        marker.bindPopup(`<strong>${title}</strong><br>Lat: ${lat.toFixed(6)}<br>Lng: ${lng.toFixed(6)}`);
        
        this.markers.push(marker);
        return marker;
    }

    addChatMessage(message, type) {
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        if (type === 'ai') {
            // Format AI messages with better structure
            messageDiv.innerHTML = this.formatAIMessage(message);
        } else {
            messageDiv.textContent = message;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    formatAIMessage(text) {
        // Convert markdown-style formatting to HTML
        let formatted = text;
        
        // Split into lines for processing
        const lines = formatted.split('\n');
        let result = [];
        let inBulletSection = false;
        let bulletContent = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Main numbered sections (1. **Title:** content)
            if (/^\d+\.\s+\*\*([^*]+)\*\*:/.test(line)) {
                // Close previous bullet section if open
                if (inBulletSection) {
                    result.push(`<div class="ai-bullet-group">${bulletContent.join('')}</div>`);
                    bulletContent = [];
                    inBulletSection = false;
                }
                
                const match = line.match(/^(\d+)\.\s+\*\*([^*]+)\*\*:\s*(.*)/);
                if (match) {
                    result.push(`
                        <div class="ai-section">
                            <div class="ai-section-header">
                                <span class="ai-section-number">${match[1]}</span>
                                <span class="ai-section-title">${match[2]}</span>
                            </div>
                            ${match[3] ? `<div class="ai-section-content">${match[3]}</div>` : ''}
                        </div>
                    `);
                }
            }
            // Bullet points with bold title (* **Title:** content)
            else if (/^\*\s+\*\*([^*]+)\*\*:/.test(line)) {
                const match = line.match(/^\*\s+\*\*([^*]+)\*\*:\s*(.*)/);
                if (match) {
                    inBulletSection = true;
                    bulletContent.push(`
                        <div class="ai-bullet">
                            <div class="ai-bullet-title">${match[1]}</div>
                            <div class="ai-bullet-content">${match[2]}</div>
                        </div>
                    `);
                }
            }
            // Regular bullet points (* content)
            else if (/^\*\s+/.test(line) && !line.includes('**')) {
                const content = line.replace(/^\*\s+/, '');
                if (inBulletSection && bulletContent.length > 0) {
                    // Add to last bullet's content
                    bulletContent[bulletContent.length - 1] = bulletContent[bulletContent.length - 1].replace(
                        '</div>\n                        </div>',
                        `<div class="ai-bullet-item">• ${content}</div></div>\n                        </div>`
                    );
                } else {
                    result.push(`<div class="ai-simple-bullet">• ${content}</div>`);
                }
            }
            // Regular text with bold/italic
            else if (line.length > 0) {
                // Close bullet section if open
                if (inBulletSection) {
                    result.push(`<div class="ai-bullet-group">${bulletContent.join('')}</div>`);
                    bulletContent = [];
                    inBulletSection = false;
                }
                
                let processedLine = line;
                // Convert **bold** to <strong>
                processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
                // Convert *italic* to <em>
                processedLine = processedLine.replace(/\*([^*]+)\*/g, '<em>$1</em>');
                
                result.push(`<div class="ai-text">${processedLine}</div>`);
            }
            // Empty line
            else if (line.length === 0 && result.length > 0) {
                result.push('<div class="ai-spacer"></div>');
            }
        }
        
        // Close any remaining bullet section
        if (inBulletSection) {
            result.push(`<div class="ai-bullet-group">${bulletContent.join('')}</div>`);
        }
        
        return result.join('');
    }

    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    requestLocation() {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.userLocation = {
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        };
                        this.map.setView([this.userLocation.lat, this.userLocation.lng], 13);
                        this.updateUserLocationMarker(position);
                        
                        // Refresh nearby places after getting location
                        this.showNearbyPlaces();
                        resolve(this.userLocation);
                    },
                    (error) => {
                        console.log('Location access denied or unavailable');
                        reject(error);
                    }
                );
            } else {
                reject(new Error('Geolocation not supported'));
            }
        });
    }
    
    updateUserLocationMarker(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (this.userMarker) {
            // Update existing marker
            this.userMarker.setLatLng([lat, lng]);
        } else {
            // Create new marker with arrow for direction
            this.userMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: `<div class="user-location-container">
                        <div class="user-location-pulse"></div>
                        <div class="user-location-dot">
                            <div class="user-location-arrow">
                                <i class="fas fa-navigation"></i>
                            </div>
                        </div>
                    </div>`,
                    iconSize: [40, 40],
                    iconAnchor: [20, 20]
                }),
                zIndexOffset: 1000
            }).addTo(this.map);
            
            this.userMarker.bindPopup('📍 Your Location');
        }
        
        this.userLocation = { lat, lng };
        
        // If in navigation mode, check progress
        if (this.navigationMode) {
            this.checkNavigationProgress();
        }
    }
    
    startLiveNavigation() {
        if (!this.routeSteps || this.routeSteps.length === 0) {
            alert('Please set a route first to start navigation.');
            return;
        }
        
        // Request orientation permission if needed
        if (this.orientationSupported) {
            this.requestOrientationPermission();
        }
        
        this.navigationMode = true;
        this.currentStepIndex = 0;
        
        // Keep route visible - don't remove it
        // Route polyline and markers stay on map
        
        // Start watching position
        if (navigator.geolocation) {
            this.watchId = navigator.geolocation.watchPosition(
                (position) => {
                    this.updateUserLocationMarker(position);
                    // Center on user but keep route visible
                    this.map.setView([position.coords.latitude, position.coords.longitude], 16, {
                        animate: true,
                        duration: 0.5
                    });
                },
                (error) => {
                    console.error('Navigation error:', error);
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 5000
                }
            );
        }
        
        // Show navigation UI
        this.showNavigationUI();
        
        // Fetch and show petrol pumps along route
        this.showPetrolPumpsAlongRoute();
        
        console.log('Live navigation started');
    }
    
    stopLiveNavigation() {
        this.navigationMode = false;
        
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
        }
        
        this.hideNavigationUI();
        
        console.log('Live navigation stopped');
    }
    
    checkNavigationProgress() {
        if (!this.userLocation || !this.routeSteps || this.currentStepIndex >= this.routeSteps.length) {
            return;
        }
        
        const currentStep = this.routeSteps[this.currentStepIndex];
        const stepLocation = currentStep.maneuver.location;
        const stepLat = stepLocation[1];
        const stepLng = stepLocation[0];
        
        // Calculate distance to next step
        const distance = this.map.distance(
            [this.userLocation.lat, this.userLocation.lng],
            [stepLat, stepLng]
        );
        
        // If within 30 meters of step, move to next
        if (distance < 30) {
            this.currentStepIndex++;
            this.updateNavigationUI();
            
            // Speak instruction if available
            if ('speechSynthesis' in window) {
                const instruction = this.formatInstruction(currentStep.maneuver);
                const utterance = new SpeechSynthesisUtterance(instruction);
                speechSynthesis.speak(utterance);
            }
        }
    }
    
    showNavigationUI() {
        // Add navigation panel to UI
        const navPanel = document.createElement('div');
        navPanel.id = 'navigationPanel';
        navPanel.className = 'navigation-panel';
        navPanel.innerHTML = `
            <div class="nav-header">
                <h3><i class="fas fa-route"></i> Live Navigation</h3>
                <button id="stopNavBtn" class="stop-nav-btn">
                    <i class="fas fa-stop"></i> Stop
                </button>
            </div>
            <div class="nav-current-step" id="navCurrentStep">
                <div class="nav-step-icon">
                    <i class="fas fa-arrow-up"></i>
                </div>
                <div class="nav-step-text">
                    <div class="nav-instruction">Starting navigation...</div>
                    <div class="nav-distance">Calculating...</div>
                </div>
            </div>
            <div class="nav-next-step" id="navNextStep">
                <div class="next-step-header">
                    <i class="fas fa-arrow-right"></i>
                    <span>Then:</span>
                </div>
                <div class="next-step-content">Calculating next step...</div>
            </div>
            <div class="nav-route-info" id="navRouteInfo">
                <div class="nav-eta">
                    <i class="fas fa-clock"></i>
                    <span id="navETA">--</span>
                </div>
                <div class="nav-remaining">
                    <i class="fas fa-road"></i>
                    <span id="navRemaining">--</span>
                </div>
            </div>
        `;
        
        document.body.appendChild(navPanel);
        
        document.getElementById('stopNavBtn').addEventListener('click', () => {
            this.stopLiveNavigation();
        });
        
        this.updateNavigationUI();
    }
    
    hideNavigationUI() {
        const navPanel = document.getElementById('navigationPanel');
        if (navPanel) {
            navPanel.remove();
        }
    }
    
    updateNavigationUI() {
        if (!this.navigationMode || this.currentStepIndex >= this.routeSteps.length) {
            return;
        }
        
        const currentStep = this.routeSteps[this.currentStepIndex];
        const instruction = this.formatInstruction(currentStep.maneuver);
        const distance = (currentStep.distance / 1000).toFixed(2);
        const distanceM = currentStep.distance < 1000 ? `${Math.round(currentStep.distance)} m` : `${distance} km`;
        const icon = this.getDirectionIcon(currentStep.maneuver.type, currentStep.maneuver.modifier);
        
        const currentStepEl = document.getElementById('navCurrentStep');
        if (currentStepEl) {
            currentStepEl.innerHTML = `
                <div class="nav-step-icon">
                    <i class="fas fa-${icon}"></i>
                </div>
                <div class="nav-step-text">
                    <div class="nav-instruction">${instruction}</div>
                    <div class="nav-distance">${distanceM}</div>
                </div>
            `;
        }
        
        // Show next step with better formatting
        const nextStepEl = document.getElementById('navNextStep');
        if (nextStepEl && this.currentStepIndex + 1 < this.routeSteps.length) {
            const nextStep = this.routeSteps[this.currentStepIndex + 1];
            const nextInstruction = this.formatInstruction(nextStep.maneuver);
            const nextDistance = (nextStep.distance / 1000).toFixed(1);
            const nextIcon = this.getDirectionIcon(nextStep.maneuver.type, nextStep.maneuver.modifier);
            
            nextStepEl.innerHTML = `
                <div class="next-step-header">
                    <i class="fas fa-arrow-right"></i>
                    <span>Then in ${nextDistance} km:</span>
                </div>
                <div class="next-step-content">
                    <i class="fas fa-${nextIcon}"></i>
                    ${nextInstruction}
                </div>
            `;
        } else if (nextStepEl) {
            nextStepEl.innerHTML = `
                <div class="next-step-header">
                    <i class="fas fa-flag-checkered"></i>
                    <span>Final step</span>
                </div>
                <div class="next-step-content">
                    You're almost at your destination!
                </div>
            `;
        }
        
        // Update route info (ETA and remaining distance)
        this.updateRouteInfo();
    }
    
    updateRouteInfo() {
        // Calculate remaining distance and time
        let remainingDistance = 0;
        let remainingTime = 0;
        
        for (let i = this.currentStepIndex; i < this.routeSteps.length; i++) {
            remainingDistance += this.routeSteps[i].distance;
            remainingTime += this.routeSteps[i].duration;
        }
        
        const distanceKm = (remainingDistance / 1000).toFixed(1);
        const timeMin = Math.round(remainingTime / 60);
        const hours = Math.floor(timeMin / 60);
        const minutes = timeMin % 60;
        
        const etaEl = document.getElementById('navETA');
        const remainingEl = document.getElementById('navRemaining');
        
        if (etaEl) {
            etaEl.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
        }
        
        if (remainingEl) {
            remainingEl.textContent = `${distanceKm} km`;
        }
    }

    goToUserLocation() {
        if (this.userLocation) {
            this.map.setView([this.userLocation.lat, this.userLocation.lng], 15);
        } else {
            this.requestLocation();
        }
    }

    showMessage(message) {
        // Simple alert for now - could be enhanced with a toast notification
        alert(message);
    }

    // Carbon Calculator Methods
    toggleCarbonCalculator() {
        const calculator = document.getElementById('carbonCalculator');
        const isVisible = calculator.style.display !== 'none';
        
        if (isVisible) {
            calculator.style.display = 'none';
            calculator.classList.remove('active');
        } else {
            calculator.style.display = 'block';
            
            // On mobile, start collapsed
            if (window.innerWidth <= 768) {
                calculator.classList.remove('active');
                
                // Add click handler to header to expand/collapse
                const header = calculator.querySelector('h3');
                if (header && !header.hasAttribute('data-mobile-handler')) {
                    header.setAttribute('data-mobile-handler', 'true');
                    header.addEventListener('click', () => {
                        calculator.classList.toggle('active');
                    });
                }
            } else {
                calculator.classList.add('active');
            }
            
            // If route exists, enable calculation and show distance
            if (this.routeDistance > 0) {
                document.getElementById('distanceDisplay').textContent = `${this.routeDistance.toFixed(2)} km`;
                document.getElementById('calculateBtn').disabled = false;
            } else {
                document.getElementById('distanceDisplay').textContent = 'Set route first';
                document.getElementById('calculateBtn').disabled = true;
            }
        }
    }

    enableCarbonMode() {
        // Add temporary click handler for carbon calculation
        const carbonClickHandler = (e) => {
            if (this.carbonPoints.length < 2) {
                this.carbonPoints.push(e.latlng);
                
                // Add marker
                const marker = L.marker(e.latlng, {
                    icon: L.divIcon({
                        className: 'carbon-marker',
                        html: `<div style="background: #16a085; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">${this.carbonPoints.length}</div>`
                    })
                }).addTo(this.map);
                
                this.markers.push(marker);
                
                if (this.carbonPoints.length === 2) {
                    this.drawCarbonRoute();
                    this.map.off('click', carbonClickHandler);
                }
            }
        };
        
        this.map.on('click', carbonClickHandler);
    }

    drawCarbonRoute() {
        if (this.carbonPoints.length === 2) {
            // Draw line between points
            this.carbonPolyline = L.polyline(this.carbonPoints, {
                color: '#16a085',
                weight: 4,
                opacity: 0.7,
                dashArray: '10, 10'
            }).addTo(this.map);
            
            // Calculate distance
            const distance = this.map.distance(this.carbonPoints[0], this.carbonPoints[1]) / 1000; // in km
            
            // Update UI
            document.getElementById('distanceDisplay').textContent = `${distance.toFixed(2)} km`;
            document.getElementById('calculateBtn').disabled = false;
            
            // Fit map to show both points
            this.map.fitBounds([this.carbonPoints[0], this.carbonPoints[1]], { padding: [50, 50] });
        }
    }

    clearCarbonRoute() {
        if (this.carbonPolyline) {
            this.map.removeLayer(this.carbonPolyline);
            this.carbonPolyline = null;
        }
        document.getElementById('distanceDisplay').textContent = 'Click 2 points on map';
        document.getElementById('calculateBtn').disabled = true;
        document.getElementById('carbonResult').style.display = 'none';
    }

    calculateCarbon() {
        if (this.routeDistance <= 0) {
            this.showMessage('Please set a route first');
            return;
        }
        
        const distance = this.routeDistance; // Use actual route distance
        const vehicleType = document.getElementById('vehicleType').value;
        const customMileage = parseFloat(document.getElementById('vehicleMileage').value);
        
        // Emission factors (kg CO2 per km) and average mileage (km/L)
        const vehicleData = {
            'car-petrol': { co2: 0.192, avgMileage: 12, fuel: 'petrol', unit: 'L' },
            'car-diesel': { co2: 0.171, avgMileage: 15, fuel: 'diesel', unit: 'L' },
            'car-electric': { co2: 0.053, avgMileage: null, fuel: 'electricity', unit: 'kWh' },
            'car-hybrid': { co2: 0.109, avgMileage: 20, fuel: 'petrol', unit: 'L' },
            'motorcycle': { co2: 0.103, avgMileage: 25, fuel: 'petrol', unit: 'L' },
            'bus': { co2: 0.089, avgMileage: 6, fuel: 'diesel', unit: 'L' },
            'train': { co2: 0.041, avgMileage: null, fuel: 'electricity', unit: 'kWh' },
            'flight': { co2: 0.255, avgMileage: null, fuel: 'jet fuel', unit: 'L' }
        };
        
        const vehicle = vehicleData[vehicleType];
        let co2Emissions = distance * vehicle.co2;
        let fuelUsed = 0;
        let mileageUsed = vehicle.avgMileage;
        
        // Calculate fuel consumption
        if (vehicle.avgMileage) {
            // Use custom mileage if provided, otherwise use average
            if (customMileage && customMileage > 0) {
                mileageUsed = customMileage;
                fuelUsed = distance / customMileage;
                
                // Adjust CO2 based on actual mileage (inverse relationship)
                // Better mileage = less fuel = less CO2
                const mileageRatio = vehicle.avgMileage / customMileage;
                co2Emissions = co2Emissions * mileageRatio;
            } else {
                fuelUsed = distance / vehicle.avgMileage;
            }
        }
        
        // Display results
        document.getElementById('resultDistance').textContent = `${distance.toFixed(2)} km`;
        
        if (mileageUsed) {
            document.getElementById('resultMileage').textContent = `${mileageUsed.toFixed(1)} km/${vehicle.unit}`;
        } else {
            document.getElementById('resultMileage').textContent = 'N/A';
        }
        
        if (fuelUsed > 0) {
            document.getElementById('resultFuel').textContent = `${fuelUsed.toFixed(2)} ${vehicle.unit}`;
        } else {
            document.getElementById('resultFuel').textContent = 'N/A';
        }
        
        document.getElementById('resultEmissions').textContent = `${co2Emissions.toFixed(2)} kg`;
        
        // Comparison text
        const trees = (co2Emissions / 21).toFixed(1);
        const comparison = this.getComparisonText(vehicleType, co2Emissions, distance);
        document.getElementById('comparisonText').textContent = `${comparison} ${trees} trees needed for 1 year to offset.`;
        
        document.getElementById('carbonResult').style.display = 'block';
    }

    getComparisonText(vehicleType, emissions, distance) {
        const alternatives = {
            'car-petrol': `🚆 Taking a train would save ${(emissions * 0.79).toFixed(2)} kg CO₂.`,
            'car-diesel': `🚆 Taking a train would save ${(emissions * 0.76).toFixed(2)} kg CO₂.`,
            'car-electric': `⚡ Great choice! Electric vehicles produce 72% less emissions than petrol cars.`,
            'car-hybrid': `🔋 Good choice! Hybrid cars produce 43% less emissions than petrol cars.`,
            'motorcycle': `🚆 Taking a train would save ${(emissions * 0.60).toFixed(2)} kg CO₂.`,
            'bus': `🚌 Good choice! Buses are one of the most eco-friendly options.`,
            'train': `🌟 Excellent! Trains are one of the greenest transport options.`,
            'flight': `🚆 Taking a train would save ${(emissions * 0.84).toFixed(2)} kg CO₂.`
        };
        
        return alternatives[vehicleType] || '';
    }

    // Direction icon and instruction helpers (used by navigation)
    getDirectionIcon(maneuverType, modifier = '') {
        // More specific icons based on maneuver type and modifier
        const icons = {
            'turn': modifier.includes('left') ? 'arrow-left' : modifier.includes('right') ? 'arrow-right' : 'arrow-up',
            'new name': 'arrow-up',
            'depart': 'play',
            'arrive': 'location-dot',
            'merge': 'code-merge',
            'on ramp': 'arrow-turn-up',
            'off ramp': 'arrow-turn-down',
            'fork': 'code-branch',
            'end of road': modifier.includes('left') ? 'arrow-left' : 'arrow-right',
            'continue': 'arrow-up',
            'roundabout': 'circle-notch',
            'rotary': 'circle-notch',
            'roundabout turn': 'arrow-right-from-arc',
            'exit roundabout': 'arrow-right-from-arc',
            'notification': 'info-circle',
            'use lane': 'road'
        };
        
        // Handle sharp turns
        if (maneuverType === 'turn' && modifier) {
            if (modifier.includes('sharp left')) return 'arrow-turn-down';
            if (modifier.includes('sharp right')) return 'arrow-turn-down';
            if (modifier.includes('slight left')) return 'arrow-up-left';
            if (modifier.includes('slight right')) return 'arrow-up-right';
        }
        
        return icons[maneuverType] || 'arrow-up';
    }

    formatInstruction(maneuver) {
        const type = maneuver.type;
        const modifier = maneuver.modifier || '';
        
        // Create human-readable instruction
        let instruction = '';
        
        if (type === 'turn') {
            instruction = `Turn ${modifier}`;
        } else if (type === 'new name') {
            instruction = 'Continue straight';
        } else if (type === 'depart') {
            instruction = `Head ${modifier}`;
        } else if (type === 'arrive') {
            instruction = 'Arrive at destination';
        } else if (type === 'merge') {
            instruction = `Merge ${modifier}`;
        } else if (type === 'on ramp') {
            instruction = `Take the ramp ${modifier}`;
        } else if (type === 'off ramp') {
            instruction = `Take the exit ${modifier}`;
        } else if (type === 'fork') {
            instruction = `At the fork, go ${modifier}`;
        } else if (type === 'end of road') {
            instruction = `At the end of the road, turn ${modifier}`;
        } else if (type === 'roundabout' || type === 'rotary') {
            instruction = `Enter the roundabout`;
        } else if (type === 'exit roundabout') {
            instruction = `Exit the roundabout`;
        } else if (type === 'continue') {
            instruction = 'Continue straight';
        } else {
            instruction = `${type} ${modifier}`.trim();
        }
        
        // Add street name if available
        if (maneuver.name) {
            instruction += ` onto ${maneuver.name}`;
        }
        
        return instruction.charAt(0).toUpperCase() + instruction.slice(1);
    }

    // Mobile Sidebar Toggle Methods
    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const expandBtn = document.getElementById('expandMapBtn');
        
        if (sidebar.classList.contains('minimized')) {
            this.expandSidebar();
        } else {
            this.minimizeSidebar();
        }
    }

    minimizeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const expandBtn = document.getElementById('expandMapBtn');
        
        sidebar.classList.add('minimized');
        expandBtn.style.display = 'flex';
        
        // Invalidate map size after animation
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 300);
    }

    expandSidebar() {
        const sidebar = document.getElementById('sidebar');
        const expandBtn = document.getElementById('expandMapBtn');
        
        sidebar.classList.remove('minimized');
        expandBtn.style.display = 'none';
        
        // Invalidate map size after animation
        setTimeout(() => {
            if (this.map) {
                this.map.invalidateSize();
            }
        }, 300);
    }

    // Traffic Methods
    showTrafficAlongRoute() {
        this.trafficEnabled = true;
        
        // Only fetch traffic incidents along the route
        if (this.routePolyline) {
            this.fetchTrafficIncidentsAlongRoute();
        }
    }
    
    toggleTraffic() {
        const trafficBtn = document.getElementById('trafficBtn');
        
        if (this.trafficEnabled) {
            this.hideTraffic();
            trafficBtn.classList.remove('active');
        } else {
            this.showTraffic();
            trafficBtn.classList.add('active');
        }
    }

    showTraffic() {
        this.trafficEnabled = true;
        
        // Only fetch traffic incidents along the route, not the whole map
        if (this.routePolyline) {
            this.fetchTrafficIncidentsAlongRoute();
        } else {
            alert('Please set a route first to see traffic information.');
            const trafficBtn = document.getElementById('trafficBtn');
            if (trafficBtn) {
                trafficBtn.classList.remove('active');
            }
            this.trafficEnabled = false;
        }
    }

    hideTraffic() {
        if (this.trafficLayer && this.map.hasLayer(this.trafficLayer)) {
            this.map.removeLayer(this.trafficLayer);
        }
        
        // Remove traffic incident markers
        if (this.trafficMarkers) {
            this.trafficMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
            this.trafficMarkers = [];
        }
        
        this.trafficEnabled = false;
    }

    async fetchTrafficIncidentsAlongRoute() {
        if (!this.routePolyline) return;
        
        const bounds = this.routePolyline.getBounds();
        
        try {
            const response = await fetch('traffic-api.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'incidents',
                    bbox: {
                        minLat: bounds.getSouth(),
                        minLng: bounds.getWest(),
                        maxLat: bounds.getNorth(),
                        maxLng: bounds.getEast()
                    }
                })
            });
            
            if (!response.ok) {
                console.error('Traffic incidents API error:', response.status);
                return;
            }
            
            const data = await response.json();
            console.log('Traffic incidents:', data);
            
            // Filter incidents to only show those near the route
            this.displayTrafficIncidentsNearRoute(data);
            
        } catch (error) {
            console.error('Error fetching traffic incidents:', error);
        }
    }
    
    displayTrafficIncidentsNearRoute(data) {
        // Clear existing markers
        if (this.trafficMarkers) {
            this.trafficMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
        }
        this.trafficMarkers = [];
        
        if (!data.incidents || data.incidents.length === 0) {
            console.log('No traffic incidents found');
            return;
        }
        
        // Get route coordinates
        const routeCoords = this.routePolyline.getLatLngs();
        const maxDistance = 500; // Only show incidents within 500m of route
        
        data.incidents.forEach(incident => {
            if (!incident.geometry || !incident.geometry.coordinates) return;
            
            const coords = incident.geometry.coordinates;
            let lat, lng;
            
            // Handle different geometry types
            if (incident.geometry.type === 'Point') {
                lng = coords[0];
                lat = coords[1];
            } else if (incident.geometry.type === 'LineString') {
                lng = coords[0][0];
                lat = coords[0][1];
            } else {
                return;
            }
            
            // Check if incident is near the route
            let nearRoute = false;
            for (let routePoint of routeCoords) {
                const distance = this.map.distance([lat, lng], routePoint);
                if (distance < maxDistance) {
                    nearRoute = true;
                    break;
                }
            }
            
            if (!nearRoute) return; // Skip incidents not near route
            
            const props = incident.properties || {};
            const iconCategory = props.iconCategory || 0;
            const delay = props.magnitudeOfDelay || 0;
            const description = props.events && props.events[0] ? props.events[0].description : 'Traffic incident';
            
            // Get icon and color based on incident type
            const incidentInfo = this.getIncidentInfo(iconCategory, delay);
            
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'traffic-incident-marker',
                    html: `<div class="traffic-marker-container">
                        <div class="traffic-marker-icon" style="background: ${incidentInfo.color};">
                            <i class="fas fa-${incidentInfo.icon}"></i>
                        </div>
                        <div class="traffic-marker-shadow"></div>
                    </div>`,
                    iconSize: [36, 36],
                    iconAnchor: [18, 36]
                }),
                zIndexOffset: 500
            }).addTo(this.map);
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <strong style="color: ${incidentInfo.color};">
                        <i class="fas fa-${incidentInfo.icon}"></i> ${incidentInfo.label}
                    </strong><br>
                    <p style="margin: 8px 0;">${description}</p>
                    ${delay > 0 ? `<small><i class="fas fa-clock"></i> Delay: ${delay} min</small>` : ''}
                </div>
            `);
            
            this.trafficMarkers.push(marker);
        });
        
        console.log(`Displayed ${this.trafficMarkers.length} traffic incidents along route`);
    }

    getIncidentInfo(iconCategory, delay) {
        // TomTom icon categories
        const categories = {
            0: { icon: 'exclamation-triangle', label: 'Unknown', color: '#5f6368' },
            1: { icon: 'car-crash', label: 'Accident', color: '#d93025' },
            2: { icon: 'smog', label: 'Fog', color: '#f9ab00' },
            3: { icon: 'exclamation-circle', label: 'Dangerous Conditions', color: '#e37400' },
            4: { icon: 'cloud-rain', label: 'Rain', color: '#1a73e8' },
            5: { icon: 'snowflake', label: 'Ice', color: '#1a73e8' },
            6: { icon: 'traffic-light', label: 'Jam', color: '#d93025' },
            7: { icon: 'road', label: 'Lane Closed', color: '#e37400' },
            8: { icon: 'ban', label: 'Road Closed', color: '#d93025' },
            9: { icon: 'tools', label: 'Road Works', color: '#f9ab00' },
            10: { icon: 'wind', label: 'Wind', color: '#1a73e8' },
            11: { icon: 'water', label: 'Flooding', color: '#1a73e8' },
            14: { icon: 'car', label: 'Broken Down Vehicle', color: '#e37400' }
        };
        
        const info = categories[iconCategory] || categories[0];
        
        // Adjust color based on delay severity
        if (delay > 30) {
            info.color = '#d93025'; // Red for major delays
        } else if (delay > 10) {
            info.color = '#e37400'; // Orange for moderate delays
        }
        
        return info;
    }

    addTrafficFlowLayer() {
        // This method is now replaced by TomTom tile layer
        // Kept for backward compatibility
        console.log('Using TomTom traffic tile layer');
    }

    getTrafficColor(status) {
        const colors = {
            'light': '#1e8e3e',      // Green - free flow
            'moderate': '#f9ab00',   // Yellow - moderate
            'heavy': '#e37400',      // Orange - slow
            'congested': '#d93025'   // Red - congested
        };
        return colors[status] || '#5f6368';
    }

    async showPetrolPumpsAlongRoute() {
        if (!this.routePolyline) return;
        
        console.log('Fetching petrol pumps along route...');
        
        // Get route bounds
        const bounds = this.routePolyline.getBounds();
        const center = bounds.getCenter();
        
        // Use Overpass API to find petrol stations
        const query = `
            [out:json][timeout:25];
            (
                node["amenity"="fuel"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
                way["amenity"="fuel"](${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()});
            );
            out center;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            
            const data = await response.json();
            console.log('Found petrol pumps:', data.elements.length);
            
            this.displayPetrolPumps(data.elements);
        } catch (error) {
            console.error('Error fetching petrol pumps:', error);
        }
    }
    
    displayPetrolPumps(pumps) {
        // Clear existing petrol pump markers
        if (this.petrolPumpMarkers) {
            this.petrolPumpMarkers.forEach(marker => {
                this.map.removeLayer(marker);
            });
        }
        this.petrolPumpMarkers = [];
        
        if (!pumps || pumps.length === 0) {
            console.log('No petrol pumps found');
            return;
        }
        
        // Get route coordinates for proximity check
        const routeCoords = this.routePolyline.getLatLngs();
        const maxDistance = 1000; // Show pumps within 1km of route
        
        pumps.forEach(pump => {
            let lat, lng;
            
            if (pump.type === 'node') {
                lat = pump.lat;
                lng = pump.lon;
            } else if (pump.center) {
                lat = pump.center.lat;
                lng = pump.center.lon;
            } else {
                return;
            }
            
            // Check if pump is near the route
            let nearRoute = false;
            for (let routePoint of routeCoords) {
                const distance = this.map.distance([lat, lng], routePoint);
                if (distance < maxDistance) {
                    nearRoute = true;
                    break;
                }
            }
            
            if (!nearRoute) return;
            
            // Get pump details
            const name = pump.tags?.name || pump.tags?.brand || 'Petrol Pump';
            const brand = pump.tags?.brand || '';
            const operator = pump.tags?.operator || '';
            
            // Create marker
            const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'petrol-pump-marker',
                    html: `<div class="pump-marker-container">
                        <div class="pump-marker-icon">
                            <i class="fas fa-gas-pump"></i>
                        </div>
                        <div class="pump-marker-shadow"></div>
                    </div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32]
                }),
                zIndexOffset: 400
            }).addTo(this.map);
            
            // Create popup
            let popupContent = `
                <div style="min-width: 180px;">
                    <strong style="color: #f9ab00;">
                        <i class="fas fa-gas-pump"></i> ${name}
                    </strong><br>
            `;
            
            if (brand) {
                popupContent += `<small><strong>Brand:</strong> ${brand}</small><br>`;
            }
            if (operator) {
                popupContent += `<small><strong>Operator:</strong> ${operator}</small><br>`;
            }
            
            popupContent += `</div>`;
            
            marker.bindPopup(popupContent);
            this.petrolPumpMarkers.push(marker);
        });
        
        console.log(`Displayed ${this.petrolPumpMarkers.length} petrol pumps along route`);
    }
    openAIModal() {
        console.log('=== Opening AI Modal ===');
        const modal = document.getElementById('aiModal');
        modal.style.display = 'flex';
        document.getElementById('aiModalInput').focus();
        
        const messages = document.getElementById('aiModalMessages');
        console.log('Current messages count:', messages.children.length);
        console.log('Cached destination info:', this.destinationInfo ? 'Available' : 'Not available');
        
        // If we have preloaded destination info, show it
        if (this.destinationInfo && messages.children.length === 0) {
            const destination = document.getElementById('endInput').value.trim();
            console.log('Displaying preloaded info for:', destination);
            this.addAIModalMessage(`Tell me about ${destination}`, 'user');
            this.addAIModalMessage(this.destinationInfo, 'ai');
        }
        // Otherwise show welcome message if empty
        else if (messages.children.length === 0) {
            console.log('No preloaded info, showing welcome message');
            this.addAIModalMessage('Hello! I can help you with route planning, destination information, travel tips, and more. What would you like to know?', 'ai');
        } else {
            console.log('Modal already has messages, keeping them');
        }
    }

    closeAIModal() {
        const modal = document.getElementById('aiModal');
        modal.style.display = 'none';
    }

    async sendAIModalMessage() {
        const input = document.getElementById('aiModalInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        this.addAIModalMessage(message, 'user');
        input.value = '';
        this.showLoading(true);
        
        try {
            const response = await this.callOpenRouterAPI(message);
            this.addAIModalMessage(response, 'ai');
        } catch (error) {
            console.error('AI Modal error:', error);
            this.addAIModalMessage('Sorry, I encountered an error. Please try again.', 'ai');
        } finally {
            this.showLoading(false);
        }
    }

    addAIModalMessage(message, type) {
        const messagesContainer = document.getElementById('aiModalMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}-message`;
        
        if (type === 'ai') {
            messageDiv.innerHTML = this.formatAIMessage(message);
        } else {
            messageDiv.textContent = message;
        }
        
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // New Search Functionality
    handleSearchInput(query) {
        const clearBtn = document.getElementById('clearSearchBtn');
        clearBtn.style.display = query ? 'block' : 'none';
        
        if (!query.trim()) {
            document.getElementById('searchSuggestions').style.display = 'none';
            return;
        }
        
        // Debounce search
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.searchPlaces(query);
        }, 300);
    }
    
    async searchPlaces(query) {
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`
            );
            const results = await response.json();
            
            this.showSearchSuggestions(results);
        } catch (error) {
            console.error('Search error:', error);
        }
    }
    
    showSearchSuggestions(results) {
        const suggestionsDiv = document.getElementById('searchSuggestions');
        
        if (!results || results.length === 0) {
            suggestionsDiv.style.display = 'none';
            return;
        }
        
        suggestionsDiv.innerHTML = results.map(place => `
            <div class="suggestion-item" data-lat="${place.lat}" data-lng="${place.lon}" data-name="${place.display_name}">
                <i class="fas fa-map-marker-alt suggestion-icon"></i>
                <div class="suggestion-content">
                    <div class="suggestion-name">${place.display_name.split(',')[0]}</div>
                    <div class="suggestion-address">${place.display_name}</div>
                </div>
            </div>
        `).join('');
        
        suggestionsDiv.style.display = 'block';
        
        // Add click handlers
        suggestionsDiv.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lng = parseFloat(item.dataset.lng);
                const name = item.dataset.name;
                
                this.selectPlace({ lat, lng, name });
            });
        });
    }
    
    selectPlace(place) {
        this.selectedPlace = place;
        document.getElementById('searchSuggestions').style.display = 'none';
        document.getElementById('mainSearchInput').value = place.name.split(',')[0];
        
        // Show route options
        this.showRouteOptions(place);
        
        // Center map on place
        this.map.setView([place.lat, place.lng], 15);
        
        // Add marker
        if (this.markers.length > 0) {
            this.markers.forEach(m => this.map.removeLayer(m));
            this.markers = [];
        }
        
        const marker = L.marker([place.lat, place.lng]).addTo(this.map);
        this.markers.push(marker);
    }
    
    showRouteOptions(place) {
        const contentArea = document.getElementById('contentArea');
        const userLocationText = this.userLocation 
            ? 'Your Location' 
            : 'Current Location (click to enable)';
        
        contentArea.innerHTML = `
            <div class="route-options">
                <div class="route-option-header">
                    <h3>Get Directions</h3>
                    <button class="back-btn" onclick="mapApp.showNearbyPlaces()">
                        <i class="fas fa-arrow-left"></i> Back
                    </button>
                </div>
                
                <div class="route-from-to">
                    <div class="route-point">
                        <div class="route-point-icon start">
                            <i class="fas fa-circle"></i>
                        </div>
                        <div class="route-point-text">${userLocationText}</div>
                    </div>
                    <div class="route-point">
                        <div class="route-point-icon end">
                            <i class="fas fa-location-dot"></i>
                        </div>
                        <div class="route-point-text">${place.name.split(',').slice(0, 2).join(',')}</div>
                    </div>
                </div>
                
                <div class="route-actions">
                    <button class="route-action-btn primary" onclick="mapApp.getDirectionsToPlace()">
                        <i class="fas fa-route"></i>
                        Get Directions
                    </button>
                </div>
            </div>
        `;
    }
    
    async getDirectionsToPlace() {
        console.log('Getting directions to place:', this.selectedPlace);
        
        if (!this.selectedPlace) {
            console.error('No place selected');
            return;
        }
        
        // Get user location first if not available
        if (!this.userLocation) {
            console.log('User location not available, requesting...');
            try {
                await this.requestLocation();
            } catch (error) {
                console.error('Failed to get location:', error);
                alert('Please enable location access to get directions');
                return;
            }
        }
        
        console.log('User location:', this.userLocation);
        
        this.startPoint = {
            lat: this.userLocation.lat,
            lng: this.userLocation.lng,
            name: 'Your Location'
        };
        
        this.endPoint = {
            lat: this.selectedPlace.lat,
            lng: this.selectedPlace.lng,
            name: this.selectedPlace.name
        };
        
        console.log('Drawing route from', this.startPoint, 'to', this.endPoint);
        
        try {
            await this.drawRoute();
            console.log('Route drawn successfully');
        } catch (error) {
            console.error('Error drawing route:', error);
            alert('Error calculating route. Please try again.');
        }
    }
    
    async showNearbyPlaces() {
        const contentArea = document.getElementById('contentArea');
        
        if (!this.userLocation) {
            contentArea.innerHTML = `
                <div class="nearby-places-header">
                    <h3><i class="fas fa-location-arrow"></i> Enable Location</h3>
                </div>
                <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-map-marked-alt" style="font-size: 48px; margin-bottom: 16px; opacity: 0.3;"></i>
                    <p>Enable location access to see nearby places and get directions</p>
                    <button class="route-action-btn primary" onclick="mapApp.requestLocation()" style="margin-top: 12px;">
                        <i class="fas fa-location-crosshairs"></i>
                        Enable Location
                    </button>
                </div>
            `;
            return;
        }
        
        contentArea.innerHTML = `
            <div class="nearby-places-header">
                <h3><i class="fas fa-compass"></i> Nearby Places</h3>
                <button class="refresh-btn" onclick="mapApp.fetchNearbyPlaces()">
                    <i class="fas fa-sync-alt"></i> Refresh
                </button>
            </div>
            <div id="nearbyPlacesList">
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fas fa-spinner fa-spin"></i> Loading nearby places...
                </div>
            </div>
        `;
        
        this.fetchNearbyPlaces();
    }
    
    async fetchNearbyPlaces() {
        if (!this.userLocation) return;
        
        try {
            // Search for interesting places nearby
            const categories = ['restaurant', 'cafe', 'park', 'museum', 'hospital', 'bank'];
            const randomCategory = categories[Math.floor(Math.random() * categories.length)];
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${randomCategory}&limit=10&lat=${this.userLocation.lat}&lon=${this.userLocation.lng}&bounded=1&viewbox=${this.userLocation.lng-0.05},${this.userLocation.lat-0.05},${this.userLocation.lng+0.05},${this.userLocation.lat+0.05}`
            );
            const places = await response.json();
            
            this.displayNearbyPlaces(places);
        } catch (error) {
            console.error('Error fetching nearby places:', error);
            document.getElementById('nearbyPlacesList').innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fas fa-exclamation-circle"></i> Error loading places
                </div>
            `;
        }
    }
    
    displayNearbyPlaces(places) {
        const listDiv = document.getElementById('nearbyPlacesList');
        
        if (!places || places.length === 0) {
            listDiv.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                    <i class="fas fa-map-marked-alt"></i> No nearby places found
                </div>
            `;
            return;
        }
        
        listDiv.innerHTML = places.slice(0, 8).map(place => {
            const distance = this.calculateDistance(
                this.userLocation.lat,
                this.userLocation.lng,
                parseFloat(place.lat),
                parseFloat(place.lon)
            );
            
            return `
                <div class="place-card" data-lat="${place.lat}" data-lng="${place.lon}" data-name="${place.display_name}">
                    <div class="place-icon">
                        <i class="fas fa-map-marker-alt"></i>
                    </div>
                    <div class="place-info">
                        <div class="place-name">${place.display_name.split(',')[0]}</div>
                        <div class="place-distance">${distance.toFixed(1)} km away</div>
                    </div>
                    <div class="place-actions">
                        <button class="place-action-btn">
                            <i class="fas fa-route"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add click handlers
        listDiv.querySelectorAll('.place-card').forEach(card => {
            card.addEventListener('click', () => {
                const lat = parseFloat(card.dataset.lat);
                const lng = parseFloat(card.dataset.lng);
                const name = card.dataset.name;
                
                this.selectPlace({ lat, lng, name });
            });
        });
    }
    
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

// Make mapApp globally accessible and initialize
let mapApp;

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing MapApp...');
    try {
        mapApp = new MapApp();
        console.log('MapApp initialized successfully:', mapApp);
    } catch (error) {
        console.error('Error initializing MapApp:', error);
    }
});

console.log('Script.js loaded successfully');
