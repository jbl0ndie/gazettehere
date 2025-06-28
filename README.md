# GazetteHere 🗺️

*Your AI Travel Companion*

A web app that answers "Where am I?" with rich geographical and contextual information in the style of a traditional gazetteer or travel guide.

## 🎯 Project Vision

**User Story**: As a traveller driving through an unfamiliar area, I want to ask "where am I?" and be given contextual information about the area, so that I can learn interesting facts about my current location and enhance my journey by providing discussion points for my travelling companions.

## ✨ Features

- **📍 Location Detection**: Automatic geolocation or manual location search
- **🗺️ Interactive Maps**: Visual representation of your current location using Leaflet.js
- **💬 Conversational Interface**: Chat-based interaction for follow-up questions
- **🌍 Rich Context**: Information about local history, agriculture, culture, and traditions
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🎨 Beautiful UI**: Travel-inspired design with smooth animations

## 🚀 Quick Start

1. Clone this repository
2. Open `index.html` in your web browser
3. Click "📍 Where Am I?" to get your current location
4. Or manually enter a location in the search box
5. Start chatting to learn about your area!

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Maps**: Leaflet.js with OpenStreetMap tiles
- **Geolocation**: Browser Geolocation API
- **Geocoding**: OpenStreetMap Nominatim API (free, no API key required)
- **Design**: CSS Grid, Flexbox, CSS animations

## 📁 Project Structure

```
gazettehere/
├── index.html          # Main HTML structure
├── style.css           # Styling and responsive design
├── script.js           # Core JavaScript functionality
└── README.md           # Project documentation
```

## 🎨 Design Philosophy

The app combines the charm of old-fashioned gazetteers with modern web technology:

- **Typography**: Georgia serif font for a literary, travel guide aesthetic
- **Colors**: Calming blues and greens with warm accent colors
- **Layout**: Clean, focused interface that doesn't distract from content
- **Interactions**: Smooth animations and transitions for a polished feel

## 🔮 Current Prototype Features

This is a **prototype version** with simulated AI responses. The current implementation includes:

- ✅ Real geolocation and mapping
- ✅ Location search and reverse geocoding
- ✅ Interactive chat interface
- ✅ Keyword-based contextual responses
- ✅ Responsive design
- ✅ Beautiful animations and UI

## 🚧 Future Enhancements

### Phase 1: Enhanced AI Integration
- [ ] Integrate with OpenAI API or similar for dynamic responses
- [ ] Add Wikipedia API integration for factual information
- [ ] Implement weather data integration
- [ ] Add local points of interest from Overpass API

### Phase 2: Advanced Features
- [ ] Offline support with cached data
- [ ] Multiple language support
- [ ] Audio narration capabilities
- [ ] Photo integration with local landmarks
- [ ] Social sharing features

### Phase 3: Personalization
- [ ] User preferences and interests
- [ ] Travel history and favorite locations
- [ ] Personalized content recommendations
- [ ] Route planning integration

## 💡 Implementation Notes

### Location Detection
The app uses the browser's Geolocation API with fallback to manual location entry. Coordinates are reverse-geocoded using the free Nominatim service.

### Chat System
Currently uses keyword-based responses for demonstration. In a production version, this would be replaced with:
- AI service integration (OpenAI, Anthropic, etc.)
- Knowledge base APIs (Wikipedia, local tourism databases)
- Real-time data sources (weather, events, etc.)

### Map Integration
Uses Leaflet.js with OpenStreetMap tiles for a clean, fast mapping experience without API keys or usage limits.

## 🤝 Contributing

This is a prototype project! Ideas for enhancement:

1. **Content Sources**: Integration with tourism APIs, Wikipedia, local databases
2. **AI Enhancement**: Better natural language processing and response generation
3. **User Experience**: Voice input, better mobile experience, accessibility improvements
4. **Data Sources**: Weather, events, historical data, local business information

## 📝 Development Notes

### Running Locally
Simply open `index.html` in a modern web browser. No build process or server required for basic functionality.

### API Considerations
- OpenStreetMap Nominatim: Free, no API key required, but rate-limited
- Future AI integration will require API keys and careful rate limiting
- Consider caching strategies for better performance

### Browser Compatibility
- Modern browsers with geolocation support
- ES6+ JavaScript features used
- CSS Grid and Flexbox for layout

## 🎉 Example Usage

```
User: "Where am I?"
App: "You are currently in Bayeux, France. This historic town is famous for the Bayeux Tapestry, a remarkable 70-meter embroidered cloth depicting the Norman conquest of England in 1066..."

User: "Tell me about local agriculture"
App: "This area of Normandy is renowned for its dairy farming. The lush pastures support cattle that produce milk for famous cheeses like Camembert and Calvados..."

User: "What about calvados?"
App: "Calvados is a traditional apple brandy from this region..."
```

---

*Built with ❤️ for curious travelers and local explorers*