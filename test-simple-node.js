import https from 'https';

const API_KEY = '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';

console.log('🔑 API Key length:', API_KEY.length);
console.log('🔑 API Key first 20 chars:', API_KEY.substring(0, 20));

const data = JSON.stringify({
  model: 'meta-llama/llama-3.2-3b-instruct:free',
  messages: [{ role: 'user', content: 'Hello!' }],
  max_tokens: 20
});

const options = {
  hostname: 'openrouter.ai',
  port: 443,
  path: '/api/v1/chat/completions',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    'User-Agent': 'curl/7.68.0',
    'Accept': '*/*',
    'Host': 'openrouter.ai'
  }
};

console.log('🤖 Тестируем OpenRouter с упрощенными заголовками...');
console.log('📤 Отправляем запрос...');

const req = https.request(options, (res) => {
  console.log('📡 Status Code:', res.statusCode);
  
  let result = '';
  
  res.on('data', (chunk) => {
    result += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Полный ответ:', result);
    try {
      const jsonResult = JSON.parse(result);
      if (jsonResult.choices && jsonResult.choices[0]) {
        console.log('✅ SUCCESS! Ответ:', jsonResult.choices[0].message.content);
      } else {
        console.log('❌ Неожиданная структура ответа');
      }
    } catch (error) {
      console.log('❌ Ошибка парсинга JSON:', error.message);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Ошибка запроса:', error.message);
});

req.write(data);
req.end();