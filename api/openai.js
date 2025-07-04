export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
    }

    try {
        const { messages, model = 'gpt-3.5-turbo', maxTokens = 150, temperature = 0.7 } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        // Make request to OpenAI API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: maxTokens,
                temperature,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenAI API Error:', errorData);
            
            // Handle specific OpenAI errors
            if (response.status === 401) {
                return res.status(401).json({ error: 'Invalid OpenAI API key' });
            } else if (response.status === 429) {
                return res.status(429).json({ error: 'OpenAI rate limit exceeded' });
            } else if (errorData.error?.code === 'insufficient_quota') {
                return res.status(402).json({ error: 'OpenAI quota exceeded' });
            } else {
                return res.status(response.status).json({ error: errorData.error?.message || 'OpenAI API error' });
            }
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error) {
        console.error('Server Error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
