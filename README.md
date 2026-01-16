# AI Map Application

A mobile-compatible map application built with HTML, CSS, and JavaScript, featuring OpenStreetMap integration and AI-powered location assistance via OpenRouter.

## Features

- 📱 **Mobile-responsive design** - Works seamlessly on desktop and mobile devices
- 🗺️ **OpenStreetMap integration** - Free, open-source mapping
- 🤖 **AI-powered assistance** - Ask questions about locations using OpenRouter API
- 📍 **Location search** - Search for any location worldwide
- 🎯 **User location** - Get your current location (with permission)
- 📌 **Interactive markers** - Click on map to add markers
- 💬 **Chat interface** - Conversational AI for location queries

## Setup Instructions

1. **Get an OpenRouter API Key**
   - Visit [OpenRouter.ai](https://openrouter.ai/)
   - Sign up for an account
   - Generate an API key

2. **Configure the API Key**
   - Open `script.js`
   - Replace `'YOUR_OPENROUTER_API_KEY'` with your actual API key:
   ```javascript
   this.openRouterApiKey = 'your-actual-api-key-here';
   ```

3. **Run the Application**
   - Open `index.html` in a web browser
   - Or serve it using a local web server for better performance

## Usage

### Basic Map Operations
- **Search**: Enter a location in the search box and click the search button
- **Add Markers**: Click anywhere on the map to add a marker
- **Your Location**: Click the "📍 My Location" button to center on your location
- **Clear Markers**: Remove all markers with the "🗑️ Clear Markers" button

### AI Features
- **Quick AI Query**: Enter a question in the search box and click the "🤖" button
- **Chat Interface**: Use the chat panel for ongoing conversations about locations
- **Smart Location Detection**: AI responses automatically trigger map updates when locations are mentioned

### Mobile Features
- **Responsive Design**: Automatically adapts to mobile screens
- **Touch-friendly**: All buttons and interactions work with touch
- **Collapsible Sidebar**: Menu toggles sidebar on mobile devices

## Example AI Queries

- "Show me the best restaurants in Paris"
- "What are some tourist attractions in Tokyo?"
- "Find me a quiet beach in California"
- "Where is the Eiffel Tower?"
- "Recommend hiking spots near Denver"

## Technologies Used

- **HTML5** - Structure and semantics
- **CSS3** - Styling and responsive design
- **JavaScript (ES6+)** - Application logic
- **Leaflet.js** - Interactive maps
- **OpenStreetMap** - Map tiles and data
- **Nominatim API** - Geocoding service
- **OpenRouter API** - AI language model access

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- Mobile browsers (iOS Safari, Chrome Mobile)

## API Costs

- **OpenStreetMap**: Free
- **Nominatim**: Free (with usage limits)
- **OpenRouter**: Pay-per-use (check their pricing)

## Privacy & Permissions

- **Location Access**: Optional - only requested when using location features
- **No Data Storage**: All data stays in your browser session
- **API Calls**: Only made when using AI features

## Customization

You can easily customize:
- Map center and zoom level in `initMap()`
- AI model in `callOpenRouterAPI()` (default: GPT-3.5-turbo)
- Styling in `styles.css`
- Map tile provider in `initMap()`

## Troubleshooting

**Map not loading**: Check internet connection and browser console for errors
**AI not working**: Verify your OpenRouter API key is correctly set
**Location not found**: Try more specific search terms
**Mobile issues**: Ensure you're using HTTPS for location features