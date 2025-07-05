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
                timeout: 15000,
                maximumAge: 60000  // Allow 1 minute old location
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
        
        // Clear chat and start fresh
        this.clearChatForNewLocation();
        this.conversationHistory = []; // Reset AI conversation
        
        // Generate initial gazetteer response
        await this.generateInitialResponse();
    }

    clearChatForNewLocation() {
        // Clear existing chat messages except system messages
        const chatMessages = this.elements.chatContainer.querySelectorAll('.chat-message:not(.system)');
        chatMessages.forEach(msg => msg.remove());
        
        // Add a separator for new location
        this.addChatMessage('system', '🆕 New location detected! Starting fresh exploration...');
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
            await this.generateAIResponse("Provide a brief factual description of this location, including its most notable specific features, architecture, history, or unique characteristics. Be concise and factual.");
        } else {
            // Fallback to simulated responses
            const responses = this.getSimulatedResponses(locationName);
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            this.addChatMessage('assistant', randomResponse);
        }
    }

    getSimulatedResponses(locationName) {
        // Factual, gazetteer-style responses
        return [
            `This is ${locationName}. Regional architecture dates to medieval period. Local economy based on agriculture and small-scale manufacturing.`,
            
            `${locationName}. Population varies seasonally. Traditional building materials include local stone and timber. Agricultural focus on dairy and grain production.`,
            
            `This is ${locationName}. Settlement history spans several centuries. Notable features include historic church and traditional market square. Primary industries: agriculture and livestock.`
        ];
    }

    async simulateTyping() {
        // Add typing indicator
        const typingMessage = document.createElement('div');
        typingMessage.className = 'chat-message assistant typing';
        typingMessage.innerHTML = '<em>GazetteHere is thinking...</em>';
        this.elements.chatContainer.appendChild(typingMessage);
        
        // Scroll to show the typing indicator
        requestAnimationFrame(() => {
            typingMessage.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        });

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
        
        // Factual, gazetteer-style responses
        if (message.includes('history') || message.includes('historical')) {
            return `Historical records for ${locationName} show continuous settlement from medieval period. Primary historical markers include church foundations, market charters, and agricultural land grants. Local archives contain records dating to 12th-15th centuries.`;
        }
        
        if (message.includes('agriculture') || message.includes('farming') || message.includes('crops')) {
            return `Agricultural production in ${locationName}: dairy cattle, grain crops (wheat, barley), root vegetables. Average farm size 15-50 hectares. Soil type: clay-limestone. Growing season April-October.`;
        }
        
        if (message.includes('food') || message.includes('cuisine') || message.includes('local dishes')) {
            return `Local food production: dairy products (cheese, butter), baked goods using regional grain. Traditional preservation methods include smoking, salting. Seasonal specialties based on harvest calendar.`;
        }
        
        if (message.includes('culture') || message.includes('traditions') || message.includes('customs')) {
            return `Cultural traditions in ${locationName}: annual harvest festivals, religious observances, craft guilds. Traditional skills include woodworking, textile production, metalworking. Community gatherings center on church calendar.`;
        }
        
        if (message.includes('nature') || message.includes('wildlife') || message.includes('landscape')) {
            return `Geographic features: elevation varies 50-200m above sea level. Native flora includes deciduous forest species, grassland plants. Wildlife: small mammals, songbirds, agricultural pest species. Climate: temperate oceanic.`;
        }
        
        // Default response
        return `${locationName} characteristics: mixed agricultural-residential area. Local information sources include municipal records, regional museums, historical societies. Specific data requires consultation of local archives.`;
    }

    addChatMessage(type, message) {
        const messageElement = document.createElement('div');
        messageElement.className = `chat-message ${type}`;
        messageElement.textContent = message;
        
        this.elements.chatContainer.appendChild(messageElement);
        
        // Use requestAnimationFrame to ensure the element is rendered before scrolling
        // and scroll to show the start of the new message
        requestAnimationFrame(() => {
            // Scroll to show the start of the new message
            messageElement.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        });
        
        // Store in chat history
        this.chatHistory.push({ type, message, timestamp: new Date() });
    }
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GazetteHere();
});
