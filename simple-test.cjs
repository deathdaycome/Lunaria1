const https = require('https');

const data = JSON.stringify({
  model: 'meta-llama/llama-3.2-3b-instruct:free',
  messages: [{ role: 'user', content: 'Hello! Test from CommonJS' }],
  max_tokens: 20
});

console.log('🤖 Тестируем OpenRouter через CommonJS...');

const req = https.request({
  hostname: 'openrouter.ai', 
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': 'Bearer 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',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, res => {
  console.log('📡 Status Code:', res.statusCode);
  console.log('📄 Headers:', JSON.stringify(res.headers, null, 2));
  
  let result = '';
  
  res.on('data', chunk => {
    result += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Raw Response:', result);
    try {
      const jsonResult = JSON.parse(result);
      if (jsonResult.choices && jsonResult.choices[0]) {
        console.log('✅ SUCCESS! Ответ:', jsonResult.choices[0].message.content);
        console.log('📊 Usage:', jsonResult.usage);
      } else if (jsonResult.error) {
        console.log('❌ API Error:', jsonResult.error.message);
      } else {
        console.log('❌ Unexpected response structure');
      }
    } catch (error) {
      console.log('❌ JSON Parse Error:', error.message);
    }
  });
});

req.on('error', err => {
  console.error('❌ Request Error:', err.message);
  console.error('❌ Error Code:', err.code);
});

req.on('timeout', () => {
  console.error('❌ Request Timeout');
  req.destroy();
});

req.setTimeout(30000);

console.log('📤 Отправляем запрос...');
req.write(data);
req.end();