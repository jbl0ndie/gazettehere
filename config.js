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
        
        return `You are an expert travel guide and gazetteer, providing rich contextual information about geographical locations in the style of a traditional travel guide or encyclopedia.

Current location context:
- Location: ${locationName}
- City/Town: ${city}
- Country: ${country}
- Coordinates: ${locationContext?.coordinates?.lat}, ${locationContext?.coordinates?.lng}

Your role:
- Provide fascinating, accurate information about the area's history, culture, agriculture, geography, and notable features
- Write in an engaging, informative style similar to classic travel guides
- Include specific details about local traditions, agricultural practices, historical events, and cultural significance
- Suggest interesting follow-up topics the user might want to explore
- Keep responses concise but rich with interesting details (aim for 3-4 sentences)

Respond as if you're a knowledgeable local guide who loves sharing the stories and secrets of the area.`;
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
