# GreenPath - Smart Route Planning with Carbon Tracking

🗺️ **A modern, Google Maps-inspired web application for eco-conscious navigation**

## 📝 Short Description (for GitHub About)
Smart route planning application with real-time navigation, carbon footprint tracking, and AI-powered travel insights. Built with vanilla JavaScript, Leaflet.js, and OpenStreetMap.

## 🌟 Key Features

### 🔍 Smart Search & Discovery
- **Intelligent Search** - Real-time autocomplete suggestions as you type
- **Nearby Places** - Automatically discover restaurants, cafes, parks, and more near your location
- **One-Click Directions** - Tap any place to instantly see route options

### 🧭 Advanced Navigation
- **Live Turn-by-Turn Navigation** - Real-time GPS tracking with voice guidance
- **Compass Integration** - Device orientation support for accurate heading
- **Route Visualization** - Beautiful route display with custom markers
- **Traffic Information** - Real-time traffic incidents along your route
- **Petrol Stations** - Automatic display of fuel stations along your route

### 🌱 Environmental Impact
- **Carbon Footprint Calculator** - Calculate CO₂ emissions for your journey
- **8 Vehicle Types** - Support for petrol, diesel, electric, hybrid, motorcycle, bus, train, and flight
- **Custom Mileage** - Enter your vehicle's actual fuel efficiency
- **Tree Offset Calculation** - See how many trees needed to offset your emissions

### 🤖 AI-Powered Insights
- **Destination Information** - AI-generated travel tips and local insights
- **Interactive Chat** - Ask questions about places, routes, and travel
- **Background Preloading** - Destination info loads automatically for instant access

### 📱 Modern UI/UX
- **Google Maps-Style Interface** - Clean, professional, and intuitive design
- **Fully Responsive** - Optimized for desktop, tablet, and mobile devices
- **Progressive Web App (PWA)** - Install on your device for offline access
- **Touch-Optimized** - Smooth interactions on mobile devices

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Mapping**: Leaflet.js, OpenStreetMap
- **Routing**: OSRM (Open Source Routing Machine)
- **Geocoding**: Nominatim API
- **AI**: OpenRouter API (DeepSeek R1)
- **Backend**: PHP (for secure API key management)
- **PWA**: Service Worker for offline functionality

## 🚀 Quick Start

### Prerequisites
- Web server with PHP support (Apache, Nginx, etc.)
- OpenRouter API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/greenpath.git
   cd greenpath
   ```

2. **Configure API Key**
   - Copy `config.php.example` to `config.php`
   - Add your OpenRouter API key:
     ```php
     define('OPENROUTER_API_KEY', 'your-api-key-here');
     ```

3. **Start your web server**
   ```bash
   # Using PHP built-in server
   php -S localhost:8000
   
   # Or use any web server (Apache, Nginx, etc.)
   ```

4. **Open in browser**
   ```
   http://localhost:8000
   ```

## 📖 Usage

1. **Enable Location** - Allow browser location access to see nearby places
2. **Search Places** - Type in the search bar to find destinations
3. **Get Directions** - Click any place and tap "Get Directions"
4. **Start Navigation** - Begin live turn-by-turn navigation
5. **Calculate Carbon** - Use the Carbon button to see environmental impact

## 🎨 Features in Detail

### Search & Discovery
- Type-ahead search with instant suggestions
- Nearby places automatically loaded on app start
- Distance calculation to all nearby locations
- One-tap route planning

### Navigation
- Real-time GPS tracking
- Device compass integration
- Voice-guided turn-by-turn directions
- Live route updates
- Traffic incident warnings
- Petrol station markers

### Carbon Calculator
- Accurate CO₂ emission calculations
- Support for multiple vehicle types
- Custom fuel efficiency input
- Tree offset recommendations
- Comparison with public transport

### AI Assistant
- Destination insights and recommendations
- Local cuisine and attractions
- Best time to visit information
- Interactive Q&A about your route

## 🔒 Security

- API keys stored server-side (PHP backend)
- No sensitive data exposed to client
- Secure HTTPS recommended for production
- CORS headers properly configured

## 📱 PWA Features

- **Installable** - Add to home screen on mobile devices
- **Offline Support** - Core functionality works without internet
- **Fast Loading** - Service worker caching for instant startup
- **Native Feel** - Full-screen mode on mobile

## 🌍 Browser Support

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari (iOS 13+)
- ✅ Opera
- ⚠️ IE11 (limited support)

## 📊 Performance

- **Lightweight** - No heavy frameworks, pure vanilla JS
- **Fast** - Optimized for quick load times
- **Efficient** - Minimal API calls with smart caching
- **Responsive** - Smooth 60fps animations

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenStreetMap** - Free, open-source map data
- **Leaflet.js** - Interactive map library
- **OSRM** - Open Source Routing Machine
- **Nominatim** - Geocoding service
- **OpenRouter** - AI API platform
- **Font Awesome** - Icon library

## 📧 Contact

Project Link: [https://github.com/yourusername/greenpath](https://github.com/yourusername/greenpath)

## 🎯 Roadmap

- [ ] Multi-language support
- [ ] Route alternatives comparison
- [ ] Public transport integration
- [ ] Bike and walking routes
- [ ] Weather integration
- [ ] Save favorite places
- [ ] Route history
- [ ] Share routes with friends

---

**Made with 💚 for a sustainable future**

*Navigate sustainably, always.*
