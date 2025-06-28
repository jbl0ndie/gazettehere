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

### Option 1: Static Version (No AI)
1. Clone this repository
2. Open `index.html` in your web browser
3. Click "📍 Where Am I?" to get your current location
4. Chat with simulated responses

### Option 2: Full AI Integration
1. Clone this repository
2. Install dependencies: `npm install`
3. Create environment file: `cp .env.example .env`
4. Add your OpenAI API key to `.env`:
   ```
   OPENAI_API_KEY=your_actual_openai_api_key_here
   ```
5. Start the server: `npm start`
6. Open `http://localhost:3000` in your browser
7. Enjoy intelligent, context-aware responses!

## 🔑 Getting OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign up or log in
3. Create a new API key
4. Copy it to your `.env` file

**Cost**: GPT-3.5-turbo is very affordable (~$0.002 per 1K tokens)

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
├── config.js           # API configuration and settings
├── server.js           # Express server for AI integration
├── package.json        # Node.js dependencies
├── .env.example        # Environment variables template
├── .env                # Your actual environment variables (ignored by git)
├── .gitignore          # Git ignore patterns
└── README.md           # Project documentation
```

## 🎨 Design Philosophy

The app combines the charm of old-fashioned gazetteers with modern web technology:

- **Typography**: Georgia serif font for a literary, travel guide aesthetic
- **Colors**: Calming blues and greens with warm accent colors
- **Layout**: Clean, focused interface that doesn't distract from content
- **Interactions**: Smooth animations and transitions for a polished feel

## 🔮 Features

### ✅ Current Features
- **📍 Real geolocation and mapping** with Leaflet.js
- **🔍 Location search** and reverse geocoding  
- **🤖 AI-Powered Responses** with OpenAI integration
- **💬 Intelligent chat interface** with conversation context
- **📱 Responsive design** for all devices
- **🎨 Beautiful animations** and polished UI
- **🔒 Secure API handling** with environment variables
- **🌐 Graceful fallbacks** when AI is unavailable

### 🎯 Dual Mode Operation
- **Static Mode**: Works offline with simulated responses
- **AI Mode**: Dynamic, intelligent responses using OpenAI GPT-3.5-turbo

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

## 🔒 Security Features

### API Key Protection
- **Environment Variables**: API keys stored in `.env` file (not committed to git)
- **Server-Side Proxy**: Browser never sees your OpenAI API key
- **CORS Protection**: Configured for secure cross-origin requests
- **Error Handling**: Graceful fallbacks when API is unavailable

### Development vs Production
- **Development**: Local Express server handles API calls
- **Production**: Deploy to Vercel, Netlify, or similar with environment variables
- **Static Fallback**: App works completely offline without server

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