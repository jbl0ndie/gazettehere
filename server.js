// Simple Express server for development
// This handles OpenAI API calls securely with environment variables

const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// OpenAI API route
app.post('/api/openai', async (req, res) => {
    try {
        // Check for API key
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({ 
                error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' 
            });
        }

        const { messages, model = 'gpt-3.5-turbo', maxTokens = 500, temperature = 0.7 } = req.body;

        // Make request to OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API error:', errorData);
            
            // Provide more helpful error messages
            let userMessage = 'OpenAI API error';
            if (errorData.error?.code === 'insufficient_quota') {
                userMessage = 'OpenAI quota exceeded. Please check your billing at https://platform.openai.com/account/billing';
            } else if (errorData.error?.code === 'invalid_api_key') {
                userMessage = 'Invalid OpenAI API key. Please check your .env file';
            }
            
            return res.status(response.status).json({ 
                error: userMessage, 
                details: errorData 
            });
        }

        const data = await response.json();
        res.json(data);

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            error: 'Internal server error', 
            message: error.message 
        });
    }
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🌍 GazetteHere server running on http://localhost:${PORT}`);
    console.log(`📍 Ready to explore the world!`);
    
    if (!process.env.OPENAI_API_KEY) {
        console.log('⚠️  Warning: OPENAI_API_KEY not set. Create a .env file with your API key.');
    }
});

module.exports = app;
