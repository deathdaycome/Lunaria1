const fetch = require('node-fetch');
require('dotenv').config();

async function testOpenRouter() {
    const API_KEY = process.env.OPENROUTER_API_KEY;
    
    console.log('API Key (first 10 chars):', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NOT FOUND');
    
    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'http://localhost:5000',
                'X-Title': 'Lunaria AI Test'
            },
            body: JSON.stringify({
                model: 'meta-llama/llama-3.2-3b-instruct:free',
                messages: [
                    {
                        role: 'user',
                        content: 'Test message'
                    }
                ],
                max_tokens: 100
            })
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testOpenRouter();