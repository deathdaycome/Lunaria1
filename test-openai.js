import OpenAI from 'openai';

// Настройка для OpenRouter с вшитым API ключом
const openai = new OpenAI({
  apiKey: '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',
  baseURL: 'https://openrouter.ai/api/v1',
  timeout: 30000,
  defaultHeaders: {
    'HTTP-Referer': 'http://89.169.47.164:5000',
    'X-Title': 'Lunaria AI Test'
  }
});

async function testOpenRouter() {
  try {
    console.log('🤖 Тестируем OpenRouter API с вшитым ключом...');
    
    const response = await openai.chat.completions.create({
      model: 'meta-llama/llama-3.2-3b-instruct:free',
      messages: [{ role: 'user', content: 'Привет! Как дела?' }],
      max_tokens: 50,
    });
    
    console.log('✅ SUCCESS! OpenRouter работает!');
    console.log('🤖 Ответ:', response.choices[0].message.content);
    console.log('📊 Использовано токенов:', response.usage);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('❌ Status:', error.status);
    if (error.response) {
      console.error('❌ Response:', error.response.data);
    }
  }
}

testOpenRouter();