import OpenAI from 'openai';
import 'dotenv/config';
import { HttpsProxyAgent } from 'https-proxy-agent';

// Используем смешанный порт из Hiddify
const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:12334');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  httpAgent: proxyAgent,
  timeout: 30000,
  defaultHeaders: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  }
});

async function testOpenAI() {
  try {
    console.log('🔧 Using Hiddify proxy: 127.0.0.1:12334');
    console.log('🤖 Тестируем OpenAI через системный прокси...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Привет из России через VPN!' }],
      max_tokens: 30,
    });
    
    console.log('✅ SUCCESS! OpenAI работает через прокси!');
    console.log('🤖 Ответ:', response.choices[0].message.content);
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    console.error('❌ Status:', error.status);
  }
}

testOpenAI();