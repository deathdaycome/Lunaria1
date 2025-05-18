import OpenAI from "openai";
import { InsertApiUsage } from "@shared/schema";
import { storage } from "./storage";

// Заглушка для OpenAI API
console.log('=== RUNNING WITH MOCK OPENAI API ===');
let openai: any;

// Проверяем наличие API-ключа
if (!process.env.OPENAI_API_KEY) {
  console.log('OPENAI_API_KEY is not set, using mock OpenAI client');
  // Создаем заглушку для OpenAI
  openai = {
    chat: {
      completions: {
        create: async () => ({
          choices: [
            {
              message: {
                content: "Это ответ от заглушки OpenAI API. Настоящий API не используется в данный момент."
              }
            }
          ],
        })
      }
    }
  };
} else {
  // Используем модель gpt-4o-mini согласно требованиям
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// Track OpenAI API usage with a database entry
async function trackApiUsage(userId: number, requestSource: string, requestText: string, responseText: string, tokensIn: number, tokensOut: number) {
  const apiUsage: InsertApiUsage = {
    userId,
    requestSource,
    requestText,
    responseText,
    tokensIn,
    tokensOut,
  };
  
  await storage.createApiUsage(apiUsage);
}

// Generate horoscope text
export async function generateHoroscope(userId: number, zodiacSign: string, period: string, category: string): Promise<string> {
  try {
    const prompt = `Создай гороскоп для знака зодиака ${zodiacSign} на период "${period}" в категории "${category}". 
    Текст должен быть персонализированным, позитивным и вдохновляющим, примерно на 3-4 предложения. 
    Используй мистический и духовный тон. Пиши на русском языке.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    const content = response.choices[0].message.content || "Не удалось создать гороскоп. Пожалуйста, попробуйте позже.";
    
    // Track API usage
    await trackApiUsage(
      userId,
      `horoscope/${period}/${category}`,
      prompt,
      content,
      prompt.length,
      content.length
    );
    
    return content;
  } catch (error) {
    console.error("Error generating horoscope:", error);
    throw new Error("Не удалось создать гороскоп. Пожалуйста, попробуйте позже.");
  }
}

// Generate tarot reading
export async function generateTarotReading(userId: number, question: string, cardCount: number, category: string): Promise<string> {
  try {
    const prompt = `Произведи чтение ${cardCount} карт Таро по вопросу пользователя. 
    Тема вопроса: ${category}. 
    Вопрос пользователя: "${question}". 
    Дай детальную интерпретацию раскладки карт со смыслом каждой карты и общим выводом. 
    Используй мистический и духовный тон. Пиши на русском языке.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const content = response.choices[0].message.content || "Не удалось создать чтение карт. Пожалуйста, попробуйте позже.";
    
    // Track API usage
    await trackApiUsage(
      userId,
      `tarot/${cardCount}/${category}`,
      prompt,
      content,
      prompt.length,
      content.length
    );
    
    return content;
  } catch (error) {
    console.error("Error generating tarot reading:", error);
    throw new Error("Не удалось создать чтение карт. Пожалуйста, попробуйте позже.");
  }
}

// Generate natal chart analysis
export async function generateNatalChartAnalysis(userId: number, name: string, birthDate: string, birthTime?: string, birthPlace?: string): Promise<string> {
  try {
    const prompt = `Создай анализ натальной карты для человека с именем ${name}, 
    родившегося ${birthDate}${birthTime ? ` в ${birthTime}` : ""}${birthPlace ? ` в ${birthPlace}` : ""}. 
    Включи информацию о положении планет, домах, аспектах и основных темах жизни. 
    Используй мистический и духовный тон. Пиши на русском языке.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const content = response.choices[0].message.content || "Не удалось создать анализ натальной карты. Пожалуйста, попробуйте позже.";
    
    // Track API usage
    await trackApiUsage(
      userId,
      "natal-chart",
      prompt,
      content,
      prompt.length,
      content.length
    );
    
    return content;
  } catch (error) {
    console.error("Error generating natal chart analysis:", error);
    throw new Error("Не удалось создать анализ натальной карты. Пожалуйста, попробуйте позже.");
  }
}

// Generate compatibility analysis
export async function generateCompatibilityAnalysis(
  userId: number,
  person1: { name: string; zodiacSign: string; birthDate: string },
  person2: { name: string; zodiacSign: string; birthDate: string },
  compatibilityScore: number
): Promise<string> {
  try {
    // Сначала получаем процент совместимости если он не был передан
    if (compatibilityScore === undefined || compatibilityScore === null) {
      const scorePrompt = `Ты профессионально анализируешь совместимость людей. Посчитай мне процент совместимости для ${person1.name} день рождения ${person1.birthDate} знак зодиака ${person1.zodiacSign} и ${person2.name} день рождения ${person2.birthDate} знак зодиака ${person2.zodiacSign}. В ответе покажи только процент`;
      
      const scoreResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: scorePrompt }],
        max_tokens: 50,
      });
      
      const scoreText = scoreResponse.choices[0].message.content || "";
      // Извлекаем число из ответа
      const match = scoreText.match(/\d+/);
      if (match) {
        compatibilityScore = parseInt(match[0]);
        if (compatibilityScore > 100) compatibilityScore = 100;
        if (compatibilityScore < 0) compatibilityScore = 0;
      }
    }
    
    // Теперь получаем детальный анализ совместимости
    const prompt = `Ты профессионально анализируешь совместимость людей, просчитай мне астрологическую, нумерологическую и психологическую любовную (дружескую, партнерскую) совместимость ${person1.name} день рождения ${person1.birthDate} знак зодиака ${person1.zodiacSign} и ${person2.name} день рождения ${person2.birthDate} знак зодиака ${person2.zodiacSign}. Сделай это понятным анализом с фактами и точками роста. В конце своего ответа не задавай вопросов`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    const content = response.choices[0].message.content || "Не удалось создать анализ совместимости. Пожалуйста, попробуйте позже.";
    
    // Track API usage
    await trackApiUsage(
      userId,
      "compatibility",
      prompt,
      content,
      prompt.length,
      content.length
    );
    
    return content;
  } catch (error) {
    console.error("Error generating compatibility analysis:", error);
    throw new Error("Не удалось создать анализ совместимости. Пожалуйста, попробуйте позже.");
  }
}
