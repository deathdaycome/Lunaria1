
import OpenAI from "openai";
import { InsertApiUsage } from "../shared/schema";
import { storage } from "./storage";

// Простой OpenAI клиент для production (без прокси)
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 30000,
  maxRetries: 3,
  defaultHeaders: {
    'User-Agent': 'Lunaria-AI/1.0'
  }
});

// Track OpenAI API usage with a database entry
async function trackApiUsage(userId: number, requestSource: string, requestText: string, responseText: string, tokensIn: number, tokensOut: number) {
  try {
    const apiUsage: InsertApiUsage = {
      userId,
      requestSource,
      requestText,
      responseText,
      tokensIn,
      tokensOut,
    };
    
    await storage.createApiUsage(apiUsage);
  } catch (error) {
    console.error('❌ Failed to track API usage:', error);
    // Не бросаем ошибку, чтобы не прерывать основной процесс
  }
}

// Generate horoscope text
export async function generateHoroscope(userId: number, zodiacSign: string, period: string, category: string): Promise<string> {
  try {
    console.log(`🔮 Generating horoscope for ${zodiacSign} (${period}, ${category})`);
    
    const prompt = `Создай гороскоп для знака зодиака ${zodiacSign} на период "${period}" в категории "${category}". 
    Текст должен быть персонализированным, позитивным и вдохновляющим, примерно на 3-4 предложения. 
    Используй мистический и духовный тон. Пиши на русском языке.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || "Не удалось создать гороскоп. Пожалуйста, попробуйте позже.";
    
    console.log(`✅ Horoscope generated successfully for ${zodiacSign}`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      `horoscope/${period}/${category}`,
      prompt,
      content,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || content.length
    );
    
    return content;
  } catch (error: any) {
    console.error("❌ Error generating horoscope:", error);
    
    if (error.status === 429) {
      throw new Error("Слишком много запросов. Попробуйте позже.");
    } else if (error.status === 401) {
      throw new Error("Ошибка авторизации API.");
    } else if (error.status >= 500) {
      throw new Error("Временные проблемы с сервисом. Попробуйте позже.");
    }
    
    throw new Error("Не удалось создать гороскоп. Пожалуйста, попробуйте позже.");
  }
}

// Generate tarot reading
export async function generateTarotReading(userId: number, question: string, cardCount: number, category: string): Promise<string> {
  try {
    console.log(`🔮 Generating tarot reading: ${cardCount} cards, category: ${category}`);
    
    const prompt = `Произведи чтение ${cardCount} карт Таро по вопросу пользователя. 
    Тема вопроса: ${category}. 
    Вопрос пользователя: "${question}". 
    Дай детальную интерпретацию раскладки карт со смыслом каждой карты и общим выводом. 
    Используй мистический и духовный тон. Пиши на русском языке.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
    });

    const content = response.choices[0].message.content || "Не удалось создать чтение карт. Пожалуйста, попробуйте позже.";
    
    console.log(`✅ Tarot reading generated successfully`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      `tarot/${cardCount}/${category}`,
      prompt,
      content,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || content.length
    );
    
    return content;
  } catch (error: any) {
    console.error("❌ Error generating tarot reading:", error);
    
    if (error.status === 429) {
      throw new Error("Слишком много запросов. Попробуйте позже.");
    } else if (error.status === 401) {
      throw new Error("Ошибка авторизации API.");
    } else if (error.status >= 500) {
      throw new Error("Временные проблемы с сервисом. Попробуйте позже.");
    }
    
    throw new Error("Не удалось создать чтение карт. Пожалуйста, попробуйте позже.");
  }
}

// Generate natal chart analysis
export async function generateNatalChartAnalysis(userId: number, name: string, birthDate: string, birthTime?: string, birthPlace?: string): Promise<string> {
  try {
    console.log(`🔮 Generating natal chart analysis for ${name}`);
    
    const prompt = `Создай анализ натальной карты для человека с именем ${name}, 
    родившегося ${birthDate}${birthTime ? ` в ${birthTime}` : ""}${birthPlace ? ` в ${birthPlace}` : ""}. 
    Включи информацию о положении планет, домах, аспектах и основных темах жизни. 
    Используй мистический и духовный тон. Пиши на русском языке.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "Не удалось создать анализ натальной карты. Пожалуйста, попробуйте позже.";
    
    console.log(`✅ Natal chart analysis generated successfully for ${name}`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "natal-chart",
      prompt,
      content,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || content.length
    );
    
    return content;
  } catch (error: any) {
    console.error("❌ Error generating natal chart analysis:", error);
    
    if (error.status === 429) {
      throw new Error("Слишком много запросов. Попробуйте позже.");
    } else if (error.status === 401) {
      throw new Error("Ошибка авторизации API.");
    } else if (error.status >= 500) {
      throw new Error("Временные проблемы с сервисом. Попробуйте позже.");
    }
    
    throw new Error("Не удалось создать анализ натальной карты. Пожалуйста, попробуйте позже.");
  }
}

// Generate compatibility analysis
export async function generateCompatibilityAnalysis(
  userId: number,
  person1: { name: string; zodiacSign: string; birthDate: string },
  person2: { name: string; zodiacSign: string; birthDate: string },
  compatibilityScore?: number
): Promise<string> {
  try {
    console.log(`🔮 Generating compatibility analysis for ${person1.name} and ${person2.name}`);
    
    // Генерируем детальный анализ совместимости
    const prompt = `Ты профессиональный астролог. Проведи детальный анализ совместимости между двумя людьми:

    Человек 1: ${person1.name}, дата рождения ${person1.birthDate}, знак зодиака ${person1.zodiacSign}
    Человек 2: ${person2.name}, дата рождения ${person2.birthDate}, знак зодиака ${person2.zodiacSign}

    Проанализируй:
    1. Астрологическую совместимость знаков зодиака
    2. Нумерологическую совместимость по датам рождения
    3. Психологическую совместимость
    4. Области гармонии и потенциальные точки роста
    5. Рекомендации для укрепления отношений

    Напиши анализ в духовном и мистическом тоне, но с практическими советами. Используй русский язык.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 600,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content || "Не удалось создать анализ совместимости. Пожалуйста, попробуйте позже.";
    
    console.log(`✅ Compatibility analysis generated successfully`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "compatibility",
      prompt,
      content,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || content.length
    );
    
    return content;
  } catch (error: any) {
    console.error("❌ Error generating compatibility analysis:", error);
    
    if (error.status === 429) {
      throw new Error("Слишком много запросов. Попробуйте позже.");
    } else if (error.status === 401) {
      throw new Error("Ошибка авторизации API.");
    } else if (error.status >= 500) {
      throw new Error("Временные проблемы с сервисом. Попробуйте позже.");
    }
    
    throw new Error("Не удалось создать анализ совместимости. Пожалуйста, попробуйте позже.");
  }
}

// Test OpenAI connection (без прокси для production)
export async function testOpenAIConnection(): Promise<boolean> {
  try {
    console.log('🔧 Testing OpenAI connection...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Test' }],
      max_tokens: 5,
    });
    
    console.log('✅ OpenAI connection test successful!');
    return true;
  } catch (error: any) {
    console.error('❌ OpenAI connection test failed:', error.message);
    return false;
  }
}

// Health check function for monitoring
export async function healthCheck(): Promise<{ status: string; openai: boolean; timestamp: string }> {
  const isOpenAIWorking = await testOpenAIConnection();
  
  return {
    status: isOpenAIWorking ? 'healthy' : 'degraded',
    openai: isOpenAIWorking,
    timestamp: new Date().toISOString()
  };
}