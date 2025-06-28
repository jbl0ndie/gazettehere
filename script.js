class GazetteHere {
    constructor() {
        this.map = null;
        this.currentLocation = null;
        this.currentMarker = null;
        this.chatHistory = [];
        this.locationContext = null;
        this.config = window.AppConfig;
        this.conversationHistory = []; // For OpenAI context
        
        this.initializeElements();
        this.attachEventListeners();
        this.initializeMap();
        this.checkAIAvailability();
    }

    initializeElements() {
        this.elements = {
            getCurrentLocationBtn: document.getElementById('getCurrentLocation'),
            manualLocationInput: document.getElementById('manualLocation'),
            searchLocationBtn: document.getElementById('searchLocation'),
            locationInfo: document.getElementById('locationInfo'),
            currentLocationDisplay: document.getElementById('currentLocation'),
            coordinatesDisplay: document.getElementById('coordinates'),
            chatContainer: document.getElementById('chatContainer'),
            chatInput: document.getElementById('chatInput'),
            sendChatBtn: document.getElementById('sendChat'),
            loadingOverlay: document.getElementById('loadingOverlay'),
            mapContainer: document.getElementById('map')
        };
    }

    attachEventListeners() {
        this.elements.getCurrentLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });

        this.elements.searchLocationBtn.addEventListener('click', () => {
            this.searchLocation();
        });

        this.elements.manualLocationInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.searchLocation();
            }
        });

        this.elements.sendChatBtn.addEventListener('click', () => {
            this.sendChatMessage();
        });

        this.elements.chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendChatMessage();
            }
        });
    }

    initializeMap() {
        // Initialize map centered on world view
        this.map = L.map('map').setView([48.8566, 2.3522], 2); // Paris as default center

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);
    }

    checkAIAvailability() {
        if (this.config.isOpenAIAvailable()) {
            console.log('🤖 OpenAI integration available');
        } else {
            console.log('📝 Using simulated responses (OpenAI not available)');
            // You could show a notice to users here if desired
        }
    }

    showLoading() {
        this.elements.loadingOverlay.classList.remove('hidden');
    }

    hideLoading() {
        this.elements.loadingOverlay.classList.add('hidden');
    }

    async getCurrentLocation() {
        if (!navigator.geolocation) {
            this.addChatMessage('system', 'Geolocation is not supported by your browser.');
            return;
        }

        this.showLoading();

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                await this.processLocation(lat, lng);
                this.hideLoading();
            },
            (error) => {
                this.hideLoading();
                let errorMessage = 'Unable to retrieve your location.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMessage = 'Location access denied by user.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMessage = 'Location information is unavailable.';
                        break;
                    case error.TIMEOUT:
                        errorMessage = 'Location request timed out.';
                        break;
                }
                this.addChatMessage('system', errorMessage);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 60000
            }
        );
    }

    async searchLocation() {
        const locationQuery = this.elements.manualLocationInput.value.trim();
        if (!locationQuery) {
            this.addChatMessage('system', 'Please enter a location to search.');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationQuery)}&limit=1`);
            const data = await response.json();

            if (data && data.length > 0) {
                const lat = parseFloat(data[0].lat);
                const lng = parseFloat(data[0].lon);
                await this.processLocation(lat, lng);
            } else {
                this.addChatMessage('system', 'Location not found. Please try a different search term.');
            }
        } catch (error) {
            this.addChatMessage('system', 'Error searching for location. Please try again.');
            console.error('Search error:', error);
        }

        this.hideLoading();
    }

    async processLocation(lat, lng) {
        this.currentLocation = { lat, lng };
        
        // Update map
        this.updateMap(lat, lng);
        
        // Get location information
        await this.getLocationInfo(lat, lng);
        
        // Enable chat
        this.enableChat();
        
        // Generate initial gazetteer response
        await this.generateInitialResponse();
    }

    updateMap(lat, lng) {
        // Clear existing marker
        if (this.currentMarker) {
            this.map.removeLayer(this.currentMarker);
        }

        // Add new marker
        this.currentMarker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup('You are here!')
            .openPopup();

        // Center map on location
        this.map.setView([lat, lng], 13);
    }

    async getLocationInfo(lat, lng) {
        try {
            // Reverse geocoding to get location details
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
            const data = await response.json();

            if (data && data.display_name) {
                this.locationContext = {
                    displayName: data.display_name,
                    address: data.address || {},
                    coordinates: { lat, lng }
                };

                // Update UI
                this.elements.locationInfo.classList.remove('hidden');
                this.elements.currentLocationDisplay.textContent = this.getFormattedLocationName(data);
                this.elements.coordinatesDisplay.textContent = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
            }
        } catch (error) {
            console.error('Error getting location info:', error);
            this.locationContext = {
                displayName: `Location at ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
                coordinates: { lat, lng }
            };
        }
    }

    getFormattedLocationName(data) {
        const address = data.address || {};
        const parts = [];

        if (address.village || address.town || address.city) {
            parts.push(address.village || address.town || address.city);
        }
        if (address.county || address.state_district) {
            parts.push(address.county || address.state_district);
        }
        if (address.state) {
            parts.push(address.state);
        }
        if (address.country) {
            parts.push(address.country);
        }

        return parts.length > 0 ? parts.join(', ') : data.display_name;
    }

    enableChat() {
        this.elements.chatInput.disabled = false;
        this.elements.sendChatBtn.disabled = false;
        this.elements.chatInput.placeholder = "Ask me about this area...";
        
        // Clear welcome message
        const welcomeMessage = document.querySelector('.welcome-message');
        if (welcomeMessage) {
            welcomeMessage.style.display = 'none';
        }
    }

    async generateInitialResponse() {
        const locationName = this.locationContext?.displayName || 'this location';
        
        // Simulate AI response for prototype
        await this.simulateTyping();
        
        if (this.config.isOpenAIAvailable()) {
            // Use OpenAI for dynamic responses
            await this.generateAIResponse("Please provide an engaging introduction to this location, highlighting its most interesting features, history, or cultural significance.");
        } else {
            // Fallback to simulated responses
            const responses = this.getSimulatedResponses(locationName);
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addChatMessage('assistant', randomResponse);
        }
    }

    getSimulatedResponses(locationName) {
        // This would be replaced with actual AI API calls in a real implementation
        return [
            `You are currently in the area of ${locationName}. This region has a rich history dating back centuries, with fascinating stories of local culture, agriculture, and notable landmarks. The area is known for its unique geographical features and traditional practices that have been passed down through generations. Would you like to know more about the local history, agriculture, or cultural traditions?`,
            
            `Welcome to ${locationName}! This area is characterized by its distinctive landscape and local heritage. The region has been shaped by both natural forces and human activity over many centuries. Local industries and agriculture have played important roles in the community's development. What aspect of this area interests you most - perhaps the local cuisine, historical significance, or natural features?`,
            
            `You've arrived in ${locationName}, a location with its own unique character and story. This area has been home to various communities throughout history, each leaving their mark on the local culture and landscape. The region is known for specific agricultural practices, local crafts, or geographical features that make it distinctive. Would you like to explore the area's history, learn about local traditions, or discover what makes this place special?`
        ];
    }

    async simulateTyping() {
        // Add typing indicator
        const typingMessage = document.createElement('div');
        typingMessage.className = 'chat-message assistant typing';
        typingMessage.innerHTML = '<em>GazetteHere is thinking...</em>';
        this.elements.chatContainer.appendChild(typingMessage);
        this.scrollToBottom();

        // Wait for a moment
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Remove typing indicator
        typingMessage.remove();
    }

    sendChatMessage() {
        const message = this.elements.chatInput.value.trim();
        if (!message) return;

        // Add user message
        this.addChatMessage('user', message);
        
        // Clear input
        this.elements.chatInput.value = '';
        
        // Generate response
        this.handleChatResponse(message);
    }

    async handleChatResponse(userMessage) {
        await this.simulateTyping();
        
        if (this.config.isOpenAIAvailable()) {
            // Use OpenAI for dynamic responses
            await this.generateAIResponse(userMessage);
        } else {
            // Fallback to simulated responses
            const response = this.generateContextualResponse(userMessage);
            this.addChatMessage('assistant', response);
        }
    }

    async generateAIResponse(userMessage) {
        try {
            // Prepare conversation history
            if (this.conversationHistory.length === 0) {
                // Add system prompt on first message
                this.conversationHistory.push({
                    role: 'system',
                    content: this.config.getSystemPrompt(this.locationContext)
                });
            }

            // Add user message
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Make API call to our server
            const response = await fetch(this.config.getOpenAIEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: this.conversationHistory,
                    model: this.config.openai.model,
                    maxTokens: this.config.openai.maxTokens,
                    temperature: this.config.openai.temperature
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${errorData.error || 'Unknown error'}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Add AI response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: aiResponse
            });

            // Display the response
            this.addChatMessage('assistant', aiResponse);

        } catch (error) {
            console.error('AI Response Error:', error);
            
            // Check for specific quota error
            if (error.message.includes('quota') || error.message.includes('insufficient_quota')) {
                this.addChatMessage('system', '💳 OpenAI quota exceeded. Using offline responses while you add billing at platform.openai.com/account/billing');
            } else if (error.message.includes('invalid_api_key')) {
                this.addChatMessage('system', '🔑 Invalid API key. Please check your .env file and restart the server.');
            } else {
                this.addChatMessage('system', 'Note: Using offline responses. Full AI features may be unavailable.');
            }
            
            // Fallback to simulated response
            const fallbackResponse = this.generateContextualResponse(userMessage);
            this.addChatMessage('assistant', fallbackResponse);
        }
    }

    generateContextualResponse(userMessage) {
        const message = userMessage.toLowerCase();
        const locationName = this.locationContext?.address?.country || 'this region';
        
        // Simple keyword-based responses for prototype
        if (message.includes('history') || message.includes('historical')) {
            return `The history of ${locationName} is fascinating! This area has seen many changes over the centuries. Ancient settlements, medieval developments, and modern transformations have all shaped what you see today. Local museums and historical societies often preserve artifacts and stories from different eras. Archaeological evidence suggests continuous human habitation in this region, with each period leaving its own cultural fingerprint.`;
        }
        
        if (message.includes('agriculture') || message.includes('farming') || message.includes('crops')) {
            return `Agriculture in this region has been the backbone of the local economy for generations. The climate and soil conditions make it particularly suitable for certain crops and livestock. Traditional farming methods have evolved with modern technology, but many local farms still maintain sustainable practices passed down through families. Local markets often feature seasonal produce that reflects the agricultural calendar of the area.`;
        }
        
        if (message.includes('food') || message.includes('cuisine') || message.includes('local dishes')) {
            return `The local cuisine reflects the agricultural abundance and cultural heritage of this area. Traditional recipes often feature locally sourced ingredients and cooking methods that have been refined over generations. Seasonal specialties showcase the best of what the land produces, while local restaurants and markets offer both traditional and modern interpretations of regional flavors.`;
        }
        
        if (message.includes('culture') || message.includes('traditions') || message.includes('customs')) {
            return `The cultural traditions of this area are deeply rooted in its geography and history. Local festivals, crafts, and customs often celebrate the changing seasons and community milestones. Traditional arts and crafts reflect both practical needs and artistic expression, with techniques often passed down through generations. Community gatherings and celebrations maintain strong social bonds and cultural continuity.`;
        }
        
        if (message.includes('nature') || message.includes('wildlife') || message.includes('landscape')) {
            return `The natural landscape here offers a diverse ecosystem with unique flora and fauna. The geographical features have been shaped by natural processes over thousands of years, creating habitats that support various species. Conservation efforts help maintain the delicate balance between human activity and natural preservation. The changing seasons bring different opportunities to observe wildlife and appreciate the natural beauty of the region.`;
        }
        
        // Default response
        return `That's an interesting question about this area! While I'd love to provide more specific details, I can tell you that ${locationName} has many fascinating aspects to explore. Local visitor centers, museums, and community resources are excellent sources for detailed information about the unique characteristics that make this place special. Is there a particular aspect of the area you'd like to explore further?`;
    }

    addChatMessage(type, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.textContent = message;
        
        this.elements.chatContainer.appendChild(messageElement);
        this.scrollToBottom();
        
        // Store in chat history
        this.chatHistory.push({ type, message, timestamp: new Date() });
    }

    scrollToBottom() {
        this.elements.chatContainer.scrollTop = this.elements.chatContainer.scrollHeight;
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GazetteHere();
});
