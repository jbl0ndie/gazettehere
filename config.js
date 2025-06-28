// Configuration for API integrations
// This file handles environment variables and API configuration

class Config {
    constructor() {
        // Check if we're in a development environment with a local server
        this.isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        
        // API endpoints
        this.endpoints = {
            // For development with local server
            openai: this.isDevelopment ? '/api/openai' : null,
            
            // Public APIs (no auth required)
            nominatim: 'https://nominatim.openstreetmap.org'
        };
        
        // OpenAI configuration
        this.openai = {
            model: 'gpt-3.5-turbo',
            maxTokens: 500,
            temperature: 0.7
        };
    }

    // Check if OpenAI integration is available
    isOpenAIAvailable() {
        return this.endpoints.openai !== null;
    }

    // Get OpenAI endpoint
    getOpenAIEndpoint() {
        return this.endpoints.openai;
    }

    // Get system prompt for the AI
    getSystemPrompt(locationContext) {
        const locationName = locationContext?.displayName || 'the current location';
        const address = locationContext?.address || {};
        const country = address.country || 'this region';
        const city = address.city || address.town || address.village || '';
        
        return `You are a factual geographical reference, like a traditional gazetteer or encyclopedia entry. Provide concise, specific, factual information about locations.

Current location context:
- Location: ${locationName}
- City/Town: ${city}
- Country: ${country}
- Coordinates: ${locationContext?.coordinates?.lat}, ${locationContext?.coordinates?.lng}

Writing style requirements:
- Write in a dry, factual tone like an encyclopedia or gazetteer
- Start responses with "This is [location name]" (omit country unless specifically relevant)
- Focus on specific, unique facts rather than general descriptions
- Avoid flowery language, marketing speak, or subjective adjectives like "charming," "picturesque," "nestled"
- Include specific details: dates, numbers, measurements, historical facts
- Mention concrete features: architecture styles, geographical features, economic activities
- Keep responses concise (2-3 sentences maximum for initial responses)
- Provide factual information that makes this location distinct from others

Examples of good responses:
- "This is Saint-Aubin-de-Terregatte, Normandy. Medieval architecture with cobblestone streets. Population approximately 400."
- "This is Bayeux. Known for the 70-meter Bayeux Tapestry depicting the 1066 Norman Conquest. Cathedral dates to 1077."

Avoid:
- "Welcome to..." or "charming," "nestled," "picturesque"
- General statements that could apply to many places
- Tourist marketing language
- Overly enthusiastic tone`;
    }

    // Get user message with location context
    formatUserMessage(userMessage, locationContext) {
        return {
            role: 'user',
            content: userMessage
        };
    }
}

// Export for use in main application
window.AppConfig = new Config();
