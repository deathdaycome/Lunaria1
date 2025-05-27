// server/setup-proxy.ts
import { HttpsProxyAgent } from 'https-proxy-agent';
import { HttpProxyAgent } from 'http-proxy-agent';
import { bootstrap } from 'global-agent';

// Настройка глобального прокси для всех HTTP/HTTPS запросов
export function setupProxy() {
  if (process.env.NODE_ENV === 'development') {
    const proxyUrl = 'http://127.0.0.1:12334';
    
    console.log('🔧 Setting up global proxy:', proxyUrl);
    
    // Устанавливаем переменные окружения для прокси
    process.env.GLOBAL_AGENT_HTTPS_PROXY = proxyUrl;
    process.env.GLOBAL_AGENT_HTTP_PROXY = proxyUrl;
    
    // Инициализируем глобальный агент
    bootstrap();
    
    console.log('✅ Global proxy configured');
  }
}