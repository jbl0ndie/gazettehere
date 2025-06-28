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
            refreshLocationBtn: document.getElementById('refreshLocation'),
            forceLocationBtn: document.getElementById('forceLocation'),
            travelModeBtn: document.getElementById('travelMode'),
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

        this.elements.refreshLocationBtn.addEventListener('click', () => {
            this.getCurrentLocation();
        });

        this.elements.forceLocationBtn.addEventListener('click', () => {
            this.forceLocationUpdate();
        });

        this.elements.travelModeBtn.addEventListener('click', () => {
            if (this.watchId) {
                this.stopLocationTracking();
                this.elements.travelModeBtn.textContent = '🚗 Travel Mode';
                this.elements.travelModeBtn.classList.remove('btn-active');
            } else {
                this.startLocationTracking();
                this.elements.travelModeBtn.textContent = '⏹️ Stop Tracking';
                this.elements.travelModeBtn.classList.add('btn-active');
            }
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
        
        // Clear any existing watch to avoid interference
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        console.log('🔍 Requesting fresh location...');
        
        // Try multiple approaches to get fresh location
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryGetLocation = () => {
            attempts++;
            console.log(`📍 Location attempt ${attempts}/${maxAttempts}`);
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    const timestamp = new Date(position.timestamp);
                    
                    console.log(`📍 Location received: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    console.log(`⏰ Location timestamp: ${timestamp.toLocaleString()}`);
                    console.log(`🎯 Accuracy: ±${accuracy}m`);
                    
                    // Check if this is the old cached location (49.0712, -0.6490)
                    if (Math.abs(lat - 49.0712) < 0.001 && Math.abs(lng - (-0.6490)) < 0.001) {
                        console.log('⚠️ Detected potentially cached location');
                        
                        // Check timestamp - if it's more than 30 seconds old, it's likely cached
                        const ageSeconds = (Date.now() - position.timestamp) / 1000;
                        console.log(`📅 Location age: ${ageSeconds.toFixed(1)} seconds`);
                        
                        if (ageSeconds > 30 && attempts < maxAttempts) {
                            console.log('🔄 Retrying for fresh location...');
                            setTimeout(tryGetLocation, 1000);
                            return;
                        }
                    }
                    
                    // Check if this is significantly different from last location
                    if (this.currentLocation) {
                        const distance = this.calculateDistance(
                            this.currentLocation.lat, 
                            this.currentLocation.lng, 
                            lat, 
                            lng
                        );
                        console.log(`📏 Distance from last location: ${distance.toFixed(0)}m`);
                        
                        if (distance < 50) {
                            this.hideLoading();
                            this.addChatMessage('system', `📍 Still in the same area (${distance.toFixed(0)}m from last check). If you've moved, the GPS might need more time to update.`);
                            return;
                        }
                    }
                    
                    await this.processLocation(lat, lng);
                    this.hideLoading();
                },
                (error) => {
                    console.error('Location error:', error);
                    
                    if (attempts < maxAttempts) {
                        console.log('🔄 Retrying after error...');
                        setTimeout(tryGetLocation, 2000);
                        return;
                    }
                    
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
                    timeout: 20000,
                    maximumAge: 0  // Force fresh location, no cache
                }
            );
        };
        
        tryGetLocation();
    }

    // Force location update by ignoring cache and distance checks
    async forceLocationUpdate() {
        if (!navigator.geolocation) {
            this.addChatMessage('system', 'Geolocation is not supported by your browser.');
            return;
        }

        this.showLoading();
        this.addChatMessage('system', '🚨 Forcing location update - ignoring all cached data...');

        // Clear any existing watch
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        // Use watchPosition for a few seconds to get the most recent location
        let bestPosition = null;
        let watchCount = 0;
        const maxWatches = 5;

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                watchCount++;
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                const timestamp = new Date(position.timestamp);
                
                console.log(`🎯 Watch update ${watchCount}: ${lat.toFixed(6)}, ${lng.toFixed(6)} (±${accuracy}m) at ${timestamp.toLocaleTimeString()}`);
                
                // Keep the most accurate position
                if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
                    bestPosition = position;
                    console.log('🏆 New best position found');
                }
                
                // Stop after getting several positions or if we get very accurate data
                if (watchCount >= maxWatches || accuracy < 10) {
                    navigator.geolocation.clearWatch(watchId);
                    this.processForcedLocation(bestPosition);
                }
            },
            (error) => {
                navigator.geolocation.clearWatch(watchId);
                console.error('Force location error:', error);
                this.hideLoading();
                this.addChatMessage('system', '❌ Force location update failed. Try manual location search.');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0
            }
        );

        // Stop watching after 10 seconds regardless
        setTimeout(() => {
            navigator.geolocation.clearWatch(watchId);
            if (bestPosition) {
                this.processForcedLocation(bestPosition);
            } else {
                this.hideLoading();
                this.addChatMessage('system', '⏰ Force location update timed out. Try manual location search.');
            }
        }, 10000);
    }

    async processForcedLocation(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        
        console.log(`🚨 Forced location: ${lat.toFixed(6)}, ${lng.toFixed(6)} (±${accuracy}m)`);
        
        // Force process regardless of distance
        this.currentLocation = null; // Reset to force new location processing
        await this.processLocation(lat, lng);
        this.hideLoading();
        
        this.addChatMessage('system', `✅ Force update complete! New location: ${lat.toFixed(4)}, ${lng.toFixed(4)} (±${accuracy.toFixed(0)}m)`);
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
        
        // Clear any existing watch to avoid interference
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        console.log('🔍 Requesting fresh location...');
        
        // Try multiple approaches to get fresh location
        let attempts = 0;
        const maxAttempts = 3;
        
        const tryGetLocation = () => {
            attempts++;
            console.log(`📍 Location attempt ${attempts}/${maxAttempts}`);
            
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    const timestamp = new Date(position.timestamp);
                    
                    console.log(`📍 Location received: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
                    console.log(`⏰ Location timestamp: ${timestamp.toLocaleString()}`);
                    console.log(`🎯 Accuracy: ±${accuracy}m`);
                    
                    // Check if this is the old cached location (49.0712, -0.6490)
                    if (Math.abs(lat - 49.0712) < 0.001 && Math.abs(lng - (-0.6490)) < 0.001) {
                        console.log('⚠️ Detected potentially cached location');
                        
                        // Check timestamp - if it's more than 30 seconds old, it's likely cached
                        const ageSeconds = (Date.now() - position.timestamp) / 1000;
                        console.log(`📅 Location age: ${ageSeconds.toFixed(1)} seconds`);
                        
                        if (ageSeconds > 30 && attempts < maxAttempts) {
                            console.log('🔄 Retrying for fresh location...');
                            setTimeout(tryGetLocation, 1000);
                            return;
                        }
                    }
                    
                    // Check if this is significantly different from last location
                    if (this.currentLocation) {
                        const distance = this.calculateDistance(
                            this.currentLocation.lat, 
                            this.currentLocation.lng, 
                            lat, 
                            lng
                        );
                        console.log(`📏 Distance from last location: ${distance.toFixed(0)}m`);
                        
                        if (distance < 50) {
                            this.hideLoading();
                            this.addChatMessage('system', `📍 Still in the same area (${distance.toFixed(0)}m from last check). If you've moved, the GPS might need more time to update.`);
                            return;
                        }
                    }
                    
                    await this.processLocation(lat, lng);
                    this.hideLoading();
                },
                (error) => {
                    console.error('Location error:', error);
                    
                    if (attempts < maxAttempts) {
                        console.log('🔄 Retrying after error...');
                        setTimeout(tryGetLocation, 2000);
                        return;
                    }
                    
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
                    timeout: 20000,
                    maximumAge: 0  // Force fresh location, no cache
                }
            );
        };
        
        tryGetLocation();
    }

    // Add continuous location tracking for travel mode
    startLocationTracking() {
        if (!navigator.geolocation) {
            this.addChatMessage('system', 'Geolocation is not supported by your browser.');
            return;
        }

        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
        }

        this.addChatMessage('system', '🚗 Travel mode enabled - tracking your location...');

        this.watchId = navigator.geolocation.watchPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                const accuracy = position.coords.accuracy;
                
                console.log(`🔄 Position update: ${lat.toFixed(6)}, ${lng.toFixed(6)} (±${accuracy}m)`);
                
                // Only process if significantly moved (>200m)
                if (this.currentLocation) {
                    const distance = this.calculateDistance(
                        this.currentLocation.lat, 
                        this.currentLocation.lng, 
                        lat, 
                        lng
                    );
                    
                    if (distance > 200) {
                        console.log(`📍 Significant movement detected: ${distance.toFixed(0)}m`);
                        await this.processLocation(lat, lng);
                    }
                } else {
                    await this.processLocation(lat, lng);
                }
            },
            (error) => {
                console.error('Location tracking error:', error);
                this.addChatMessage('system', '❌ Location tracking stopped due to error.');
                this.stopLocationTracking();
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000 // Allow 10 second old positions for tracking
            }
        );
    }

    stopLocationTracking() {
        if (this.watchId) {
            navigator.geolocation.clearWatch(this.watchId);
            this.watchId = null;
            this.addChatMessage('system', '⏹️ Location tracking stopped.');
        }
    }

    // Calculate distance between two coordinates in meters
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371000; // Earth's radius in meters
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
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
        const isNewLocation = !this.currentLocation || 
            this.calculateDistance(this.currentLocation.lat, this.currentLocation.lng, lat, lng) > 100;
        
        this.currentLocation = { lat, lng };
        
        // Update map
        this.updateMap(lat, lng);
        
        // Get location information
        await this.getLocationInfo(lat, lng);
        
        // Show refresh, force, and travel mode buttons after first location
        this.elements.refreshLocationBtn.classList.remove('hidden');
        this.elements.forceLocationBtn.classList.remove('hidden');
        this.elements.travelModeBtn.classList.remove('hidden');
        
        // Enable chat
        this.enableChat();
        
        // If it's a significantly new location, clear chat and start fresh
        if (isNewLocation) {
            this.clearChatForNewLocation();
            this.conversationHistory = []; // Reset AI conversation
            
            // Generate initial gazetteer response
            await this.generateInitialResponse();
        } else {
            this.addChatMessage('system', '📍 Location updated, but you\'re still in the same general area.');
        }
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
