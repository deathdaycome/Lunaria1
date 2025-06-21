import OpenAI from "openai";
import { InsertApiUsage } from "../shared/schema";
import { storage } from "./storage";
// ✨ ДОБАВЛЯЕМ ИМПОРТ ФУНКЦИЙ ОЧИСТКИ ТЕКСТА
import { cleanMarkdownText, cleanRussianText, cleanStructuredRussianText } from "./utils/textCleaner";
import callPythonNatalChart from "./utils/natal-chart-calculator";
// ✨ ДОБАВЛЯЕМ ИМПОРТ ДЛЯ РАБОТЫ С PYTHON


// OpenRouter клиент с использованием GPT-4o-mini
const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  timeout: 30000,
  maxRetries: 3,
  defaultHeaders: {
    'HTTP-Referer': 'https://lunaria-app.com',
    'X-Title': 'Lunaria Astrology App',
    'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`
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

// ✨ ДОБАВЛЯЕМ ФУНКЦИЮ ДЛЯ ПОЛУЧЕНИЯ АКТУАЛЬНОЙ ДАТЫ
function getCurrentDateInfo() {
  const now = new Date();
  
  // Получаем день недели на русском
  const daysOfWeek = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
  const dayOfWeek = daysOfWeek[now.getDay()];
  
  // Получаем месяц на русском
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  const month = months[now.getMonth()];
  
  // Форматируем дату
  const day = now.getDate();
  const year = now.getFullYear();
  
  return {
    dayOfWeek,
    formattedDate: `${dayOfWeek}, ${day} ${month} ${year} года`,
    day,
    month: month,
    year,
    fullDate: now
  };
}

// ✨ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАТЫ ПЕРИОДА
// ✅ ИСПРАВЛЕННАЯ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ДАТЫ ПЕРИОДА
function getPeriodDateInfo(period: string) {
  const currentDate = getCurrentDateInfo();
  const now = currentDate.fullDate;
  
  switch (period) {
    case "today":
      return {
        periodText: `на сегодня, ${currentDate.formattedDate}`,
        periodDescription: "дневной гороскоп"
      };
      
    case "week":
      // Получаем начало и конец недели
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay() + 1); // понедельник
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // воскресенье
      
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      const startMonth = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][startOfWeek.getMonth()];
      const endMonth = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][endOfWeek.getMonth()];
      
      if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
        return {
          periodText: `на неделю с ${startDay} по ${endDay} ${startMonth} ${startOfWeek.getFullYear()} года`,
          periodDescription: "недельный гороскоп"
        };
      } else {
        return {
          periodText: `на неделю с ${startDay} ${startMonth} по ${endDay} ${endMonth} ${startOfWeek.getFullYear()} года`,
          periodDescription: "недельный гороскоп"
        };
      }
      
    case "month":
      const monthName = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'][now.getMonth()];
      const fullMonthName = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
        'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'][now.getMonth()];
      return {
        periodText: `на ${fullMonthName} ${now.getFullYear()} года`,
        periodDescription: "месячный гороскоп"
      };
      
    default:
      return {
        periodText: `на ${currentDate.formattedDate}`,
        periodDescription: "дневной гороскоп"
      };
  }
}

export async function generateHoroscope(userId: number, zodiacSign: string, period: string, category: string): Promise<string> {
 try {
   console.log(`🔮 Generating horoscope for ${zodiacSign} (${period}, ${category})`);
   
   // 🔍 ДИАГНОСТИКА API КЛЮЧА
   console.log('🔑 OPENROUTER_API_KEY exists:', !!process.env.OPENROUTER_API_KEY);
   console.log('🔑 API key length:', process.env.OPENROUTER_API_KEY?.length || 0);
   console.log('🔑 API key first 20 chars:', process.env.OPENROUTER_API_KEY?.substring(0, 20) || 'UNDEFINED');
   console.log('🔑 Full API key:', process.env.OPENROUTER_API_KEY); // ВРЕМЕННО для диагностики
   
   // Получаем данные пользователя для персонализации
   const user = await getUserData(userId);
   const userName = user?.name || "Дорогой друг";
   const birthDate = user?.birthDate || "неизвестна";
   
   // ✅ ПОЛУЧАЕМ АКТУАЛЬНУЮ ДАТУ С ПРАВИЛЬНЫМ ОПИСАНИЕМ ПЕРИОДА
   const currentDate = getCurrentDateInfo();
   const periodInfo = getPeriodDateInfo(period);
   
   // Выбираем случайный тип промпта согласно ТЗ
   let promptType: string;
   if (period === "today") {
     // Для дневного гороскопа - случайный выбор между 3 вариантами
     const types = ["negative", "neutral", "positive"];
     promptType = types[Math.floor(Math.random() * types.length)];
   } else {
     // Для недельного и месячного - только нейтральный и позитивный
     const types = ["neutral", "positive"];
     promptType = types[Math.floor(Math.random() * types.length)];
   }
   
   console.log(`🎯 Selected prompt type: ${promptType} for period: ${period}`);
   console.log(`📅 Period info:`, periodInfo);
   
   // ✅ ИСПРАВЛЕННЫЕ ПРОМПТЫ С ПРАВИЛЬНЫМ УКАЗАНИЕМ ПЕРИОДА
   let prompt: string = "";
   
   switch (promptType) {
     case "negative":
       prompt = `Ты профессиональный астролог. Напиши подробный ${periodInfo.periodDescription} ${periodInfo.periodText} на тему ${category}. Знак зодиака -- ${zodiacSign}. Имя -- ${userName}. День рождения ${birthDate}. Сделай его немного негативным, но дай надежду. Учти специфику периода: ${period === "today" ? "для дневного гороскопа - конкретные советы на день" : period === "week" ? "для недельного гороскопа - тенденции недели" : "для месячного гороскопа - общие направления месяца"}. НЕ ИСПОЛЬЗУЙ markdown-форматирование (звездочки, решетки, подчеркивания). Пиши обычным текстом без специальных символов.`;
       break;
     case "neutral":
       prompt = `Ты профессиональный астролог. Напиши подробный ${periodInfo.periodDescription} ${periodInfo.periodText} на тему ${category}. Знак зодиака -- ${zodiacSign}. Имя -- ${userName}. День рождения ${birthDate}. Сделай его сбалансированным с практическими советами. Учти специфику периода: ${period === "today" ? "для дневного гороскопа - конкретные действия" : period === "week" ? "для недельного гороскопа - планирование недели" : "для месячного гороскопа - стратегические цели"}. НЕ ИСПОЛЬЗУЙ markdown-форматирование (звездочки, решетки, подчеркивания). Пиши обычным текстом без специальных символов.`;
       break;
     case "positive":
       prompt = `Ты профессиональный астролог. Напиши подробный ${periodInfo.periodDescription} ${periodInfo.periodText} на тему ${category}. Знак зодиака -- ${zodiacSign}. Имя -- ${userName}. День рождения ${birthDate}. Сделай его позитивным с предупреждениями о возможных сложностях. Учти специфику периода: ${period === "today" ? "для дневного гороскопа - вдохновение на день" : period === "week" ? "для недельного гороскопа - перспективы недели" : "для месячного гороскопа - долгосрочные возможности"}. НЕ ИСПОЛЬЗУЙ markdown-форматирование (звездочки, решетки, подчеркивания). Пиши обычным текстом без специальных символов.`;
       break;
     default:
       prompt = `Ты профессиональный астролог. Напиши подробный ${periodInfo.periodDescription} ${periodInfo.periodText} на тему ${category}. Знак зодиака -- ${zodiacSign}. Имя -- ${userName}. День рождения ${birthDate}. Сделай его сбалансированным и полезным. Учти специфику периода: ${period === "today" ? "для дневного гороскопа - конкретные советы" : period === "week" ? "для недельного гороскопа - планирование" : "для месячного гороскопа - стратегические цели"}. НЕ ИСПОЛЬЗУЙ markdown-форматирование (звездочки, решетки, подчеркивания). Пиши обычным текстом без специальных символов.`;
   }

   console.log('🚀 Sending request to OpenRouter...');
   console.log('🔗 Base URL:', openai.baseURL);
   console.log('📝 Model:', "openai/gpt-4o-mini");

   const response = await openai.chat.completions.create({
     model: "openai/gpt-4o-mini",
     messages: [{ role: "user", content: prompt }],
     max_tokens: period === "today" ? 2000 : period === "week" ? 3000 : 4000, // ✅ Больше токенов для длинных периодов
     temperature: 0.8,
   });

   console.log('✅ OpenRouter response received successfully!');

   const rawContent = response.choices[0].message.content || "Не удалось создать гороскоп. Пожалуйста, попробуйте позже.";
   
   // ✨ ПРИМЕНЯЕМ ОЧИСТКУ ТЕКСТА ОТ MARKDOWN-СИМВОЛОВ
   const cleanedContent = cleanRussianText(rawContent);
   
   console.log(`✅ Horoscope generated successfully for ${zodiacSign} (${promptType}) - ${periodInfo.periodDescription}`);
   console.log(`🧹 Text cleaned from markdown symbols`);
   
   // Track API usage
   try {
     await trackApiUsage(
       userId,
       `horoscope/${period}/${category}/${promptType}`,
       prompt,
       cleanedContent,
       response.usage?.prompt_tokens || prompt.length,
       response.usage?.completion_tokens || cleanedContent.length
     );
   } catch (trackingError) {
     console.log('⚠️ API usage tracking failed (non-critical):', (trackingError as Error).message);
   }
   
   return cleanedContent;
 } catch (error: any) {
   console.error("❌ Error generating horoscope:", error);
   console.error("❌ Error details:", {
     status: error.status,
     message: error.message,
     code: error.code,
     headers: error.headers
   });
   
   if (error.status === 429) {
     throw new Error("Слишком много запросов. Попробуйте позже.");
   } else if (error.status === 401 || error.status === 403) {
     console.error("🚨 AUTHENTICATION ERROR - API key issue detected!");
     console.error("🔑 Current API key:", process.env.OPENROUTER_API_KEY);
     throw new Error("Ошибка авторизации API.");
   } else if (error.status >= 500) {
     throw new Error("Временные проблемы с сервисом. Попробуйте позже.");
   } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
     throw new Error("Проблемы с подключением к сервису.");
   }
   
   throw new Error("Не удалось создать гороскоп. Пожалуйста, попробуйте позже.");
 }
}

// =====================================================
// ПРОМПТЫ ДЛЯ ГОРОСКОПОВ (СОГЛАСНО ТЗ)
// =====================================================

// Получить пользователя для персонализации
async function getUserData(userId: number) {
  try {
    const user = await storage.getUser(userId);
    return user;
  } catch (error) {
    console.error('❌ Failed to get user data:', error);
    return null;
  }
}



// =====================================================
// СЧАСТЛИВЫЕ ЧИСЛА (СОГЛАСНО ТЗ)
// =====================================================

export async function generateLuckyNumbers(userId: number): Promise<number[]> {
  try {
    console.log(`🔮 Generating lucky numbers for user ${userId}`);
    
    const user = await getUserData(userId);
    const userName = user?.name || "Друг";
    const birthDate = user?.birthDate || "неизвестна";
    
    // ✨ ИСПРАВЛЕННЫЙ ПРОМПТ - ЧЕТКО УКАЗЫВАЕМ ДИАПАЗОН 1-10
    const prompt = `Ты профессиональный астролог. Определи 3 счастливых числа от 1 до 10 включительно. Имя -- ${userName}. Дата рождения - ${birthDate}. В ответе покажи только 3 числа от 1 до 10, разделенных пробелами. НЕ ИСПОЛЬЗУЙ никакие символы кроме цифр и пробелов.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 50,
      temperature: 0.7,
    });

    const rawContent = response.choices[0].message.content || "7 3 9";
    
    // ✨ ОЧИЩАЕМ ТЕКСТ ОТ MARKDOWN-СИМВОЛОВ
    const cleanedContent = cleanMarkdownText(rawContent);
    
    // ✨ УЛУЧШЕННАЯ ЛОГИКА ИЗВЛЕЧЕНИЯ ЧИСЕЛ
    let numbers = cleanedContent.match(/\d+/g)?.slice(0, 3).map(n => {
      let num = parseInt(n);
      // Приводим к диапазону 1-10
      if (num < 1) num = 1;
      if (num > 10) num = (num % 10) + 1;
      return num;
    }) || [];
    
    // Если получили меньше 3 чисел, добавляем случайные из диапазона 1-10
    while (numbers.length < 3) {
      const randomNum = Math.floor(Math.random() * 10) + 1;
      if (!numbers.includes(randomNum)) {
        numbers.push(randomNum);
      }
    }
    
    // Убираем дубликаты и оставляем только первые 3
    numbers = Array.from(new Set(numbers)).slice(0, 3);
    
    // Если после удаления дубликатов стало меньше 3, добавляем недостающие
    while (numbers.length < 3) {
      const randomNum = Math.floor(Math.random() * 10) + 1;
      if (!numbers.includes(randomNum)) {
        numbers.push(randomNum);
      }
    }
    
    console.log(`✅ Lucky numbers generated: ${numbers.join(', ')}`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "lucky-numbers",
      prompt,
      cleanedContent,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || cleanedContent.length
    );
    
    return numbers;
  } catch (error: any) {
    console.error("❌ Error generating lucky numbers:", error);
    // ✨ FALLBACK ТОЖЕ ИСПРАВЛЕН - ЧИСЛА ОТ 1 ДО 10
    return [
      Math.floor(Math.random() * 10) + 1,
      Math.floor(Math.random() * 10) + 1,
      Math.floor(Math.random() * 10) + 1
    ].filter((num, index, arr) => arr.indexOf(num) === index); // убираем дубликаты
  }
}

// =====================================================
// СОВМЕСТИМОСТЬ СО ЗНАКАМИ ЗОДИАКА (СОГЛАСНО ТЗ)
// =====================================================

export async function generateCompatibleSigns(userId: number): Promise<Array<{name: string, compatibility: number}>> {
  try {
    console.log(`🔮 Generating compatible signs for user ${userId}`);
    
    const user = await getUserData(userId);
    const userName = user?.name || "Друг";
    const birthDate = user?.birthDate || "неизвестна";
    
    // Промпт согласно ТЗ
    const prompt = `Ты профессиональный астролог. Определи 3 знака зодиака, наиболее совместимых с: имя -- ${userName}, дата рождения - ${birthDate}. В ответе покажи только названия знаков зодиака и процент совместимости. НЕ ИСПОЛЬЗУЙ markdown-форматирование (звездочки, решетки, подчеркивания).`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7,
    });

    const rawContent = response.choices[0].message.content || "Телец 85%, Дева 80%, Рыбы 75%";
    
    // ✨ ОЧИЩАЕМ ТЕКСТ ОТ MARKDOWN-СИМВОЛОВ
    const cleanedContent = cleanMarkdownText(rawContent);
    
    // Парсим ответ для извлечения знаков и процентов
    const signs = [];
    const lines = cleanedContent.split(/[,\n]/);
    
    for (const line of lines) {
      const match = line.match(/(\w+)\s*(\d+)%/);
      if (match && signs.length < 3) {
        signs.push({
          name: match[1],
          compatibility: parseInt(match[2])
        });
      }
    }
    
    // Fallback если парсинг не удался
    if (signs.length === 0) {
      signs.push(
        { name: "Телец", compatibility: 85 },
        { name: "Дева", compatibility: 80 },
        { name: "Рыбы", compatibility: 75 }
      );
    }
    
    console.log(`✅ Compatible signs generated: ${signs.map(s => `${s.name} ${s.compatibility}%`).join(', ')}`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "compatible-signs",
      prompt,
      cleanedContent,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || cleanedContent.length
    );
    
    return signs;
  } catch (error: any) {
    console.error("❌ Error generating compatible signs:", error);
    return [
      { name: "Телец", compatibility: 85 },
      { name: "Дева", compatibility: 80 }, 
      { name: "Рыбы", compatibility: 75 }
    ];
  }
}

// =====================================================
// PROGRESS BAR ТЕСТА НА СОВМЕСТИМОСТЬ (СОГЛАСНО ТЗ)
// =====================================================

export async function generateCompatibilityPercentage(
  userId: number,
  person1: { name: string; birthDate: string; zodiacSign: string },
  person2: { name: string; birthDate: string; zodiacSign: string }
): Promise<number> {
  try {
    console.log(`🔮 Generating compatibility percentage for ${person1.name} and ${person2.name}`);
    
    // Промпт согласно ТЗ
    const prompt = `Ты профессионально анализируешь совместимость людей. Посчитай мне процент совместимости для ${person1.name} день рождения ${person1.birthDate} знак зодиака ${person1.zodiacSign} и ${person2.name} день рождения ${person2.birthDate} знак зодиака ${person2.zodiacSign}. В ответе покажи только процент без дополнительных символов.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 20,
      temperature: 0.5,
    });

    const rawContent = response.choices[0].message.content || "85%";
    
    // ✨ ОЧИЩАЕМ ТЕКСТ ОТ MARKDOWN-СИМВОЛОВ
    const cleanedContent = cleanMarkdownText(rawContent);
    
    // Извлекаем процент из ответа
    const percentMatch = cleanedContent.match(/(\d+)%?/);
    const percentage = percentMatch ? parseInt(percentMatch[1]) : Math.floor(Math.random() * 31) + 70; // 70-100%
    
    console.log(`✅ Compatibility percentage generated: ${percentage}%`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "compatibility-percentage",
      prompt,
      cleanedContent,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || cleanedContent.length
    );
    
    return Math.min(Math.max(percentage, 0), 100); // Ограничиваем 0-100%
  } catch (error: any) {
    console.error("❌ Error generating compatibility percentage:", error);
    return Math.floor(Math.random() * 31) + 70; // Fallback: 70-100%
  }
}

// =====================================================
// ТЕСТ НА СОВМЕСТИМОСТЬ (СОГЛАСНО ТЗ)
// =====================================================

export async function generateCompatibilityAnalysis(
  userId: number,
  person1: { name: string; zodiacSign: string; birthDate: string },
  person2: { name: string; zodiacSign: string; birthDate: string },
  compatibilityScore?: number
): Promise<Array<{title: string, content: string}>> {
  try {
    console.log(`🔮 Generating compatibility analysis for ${person1.name} and ${person2.name}`);
    
    // Промпт согласно ТЗ
    const prompt = `Ты профессионально анализируешь совместимость людей, просчитай мне астрологическую, нумерологическую и психологическую любовную (дружескую, партнерскую) совместимость ${person1.name} день рождения ${person1.birthDate} знак зодиака ${person1.zodiacSign} и ${person2.name} день рождения ${person2.birthDate} знак зодиака ${person2.zodiacSign}. Сделай это понятным анализом с фактами и точками роста. В конце своего ответа не задавай вопросов. Структурируй ответ по разделам: сначала «Астрологическая совместимость», затем «Нумерологическая совместимость», затем «Психологическая совместимость». Каждый раздел начинай с названия раздела. Внутри разделов используй подзаголовки и списки для лучшей читаемости.`;

    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 5000,
      temperature: 0.7,
    });

    const rawContent = response.choices[0].message.content || "Не удалось создать анализ совместимости. Пожалуйста, попробуйте позже.";
    
    // ✨ СТРУКТУРИРУЕМ ТЕКСТ В СЕКЦИИ (КАК В ТАРО)
    const structuredSections = cleanStructuredRussianText(rawContent);
    
    console.log(`✅ Compatibility analysis generated successfully`);
    console.log(`🧹 Text structured into ${structuredSections.length} sections`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "compatibility-analysis",
      prompt,
      rawContent,
      response.usage?.prompt_tokens || prompt.length,
      response.usage?.completion_tokens || rawContent.length
    );
    
    return structuredSections;
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

// =====================================================
// ПРЕСЕТЫ ДЛЯ ТАРО (СОГЛАСНО ТЗ)
// =====================================================

interface TarotPreset {
  id: string;
  name: string;
  cards3: string[];
  cards5: string[];
}

const TAROT_PRESETS: Record<string, TarotPreset[]> = {
  "love": [
    {
      id: "love-1",
      name: "Прошлое-Настоящее-Будущее",
      cards3: ["Прошлое", "Настоящее", "Будущее"],
      cards5: ["Мои желания", "Что я даю", "Что получаю", "Препятствия", "Итог"]
    },
    {
      id: "love-2", 
      name: "Чувства партнеров",
      cards3: ["Мои чувства", "Чувства партнёра", "Совет"],
      cards5: ["Настоящая ситуация", "Взгляд партнёра", "Взгляд меня", "Совет", "Будущее"]
    },
    {
      id: "love-3",
      name: "Ожидания vs Реальность",
      cards3: ["Мои ожидания", "Реальность", "Итог"],
      cards5: ["Мои эмоции", "Эмоции партнёра", "Что между нами", "Что мешает", "Итог"]
    },
    {
      id: "love-4",
      name: "Конфликт и решение",
      cards3: ["Причина конфликта", "Что помогает", "Совет"],
      cards5: ["Любовь сейчас", "Что стоит развивать", "Что отпустить", "Чего боюсь", "Перспективы"]
    },
    {
      id: "love-5",
      name: "Взаимный обмен",
      cards3: ["Что я даю", "Что я получаю", "Что нужно изменить"],
      cards5: ["Начало отношений", "Их развитие", "Текущее состояние", "Что скрыто", "Совет"]
    }
  ],
  "career": [
    {
      id: "career-1",
      name: "Прошлое-Настоящее-Будущее",
      cards3: ["Прошлое", "Настоящее", "Будущее карьеры"],
      cards5: ["Цель", "Ресурсы", "Препятствия", "Действия", "Итог"]
    },
    {
      id: "career-2",
      name: "Силы и слабности",
      cards3: ["Мои силы", "Мои слабости", "Совет для роста"],
      cards5: ["Мои способности", "Мотивация", "Влияние окружения", "Что мешает", "Совет"]
    },
    {
      id: "career-3",
      name: "Цели и возможности",
      cards3: ["Мои цели", "Препятствия", "Возможности"],
      cards5: ["Текущая ситуация", "Что я контролирую", "Что не контролирую", "Что улучшить", "Будущее развитие"]
    },
    {
      id: "career-4",
      name: "Взгляд окружения",
      cards3: ["Ситуация сейчас", "Как меня видят коллеги/руководство", "Влияние со стороны"],
      cards5: ["Мои цели", "Планы", "Вызовы", "Поддержка", "Итог"]
    },
    {
      id: "career-5",
      name: "Движение вперед",
      cards3: ["Что я должен отпустить", "Что держит меня", "Что поможет двигаться вперёд"],
      cards5: ["Ключевая компетенция", "Личный потенциал", "Внешние возможности", "Риски", "Совет для укрепления позиции"]
    }
  ],
  "spirituality": [
    {
      id: "spirituality-1",
      name: "Духовное состояние",
      cards3: ["Текущее духовное состояние", "Вызов", "Совет"],
      cards5: ["Настоящее состояние", "Истоки", "Вызовы", "Поддержка", "Путь"]
    },
    {
      id: "spirituality-2",
      name: "Осознание",
      cards3: ["Что я осознаю", "Что скрыто", "Что нужно принять"],
      cards5: ["Осознанность", "Подсознание", "Внешние влияния", "Внутренний учитель", "Совет"]
    },
    {
      id: "spirituality-3",
      name: "Внутренний мир",
      cards3: ["Внутренний мир", "Внешние влияния", "Путь вперед"],
      cards5: ["Мои сомнения", "Моя вера", "Что держит меня", "Что освобождает", "Итог духовного пути"]
    },
    {
      id: "spirituality-4",
      name: "Баланс",
      cards3: ["Что мне помогает", "Что мешает", "Путь к балансу"],
      cards5: ["Внутренний конфликт", "Причина", "Путь исцеления", "Новые возможности", "Советы для гармонии"]
    },
    {
      id: "spirituality-5",
      name: "Духовный путь",
      cards3: ["Что я могу отпустить", "Что мне важно сохранить", "Что открыть для себя"],
      cards5: ["Прошлое", "Настоящее", "Будущее", "Урок", "Благодарность"]
    }
  ],
  "money": [
    {
      id: "finances-1",
      name: "Финансовое состояние",
      cards3: ["Текущее состояние", "Препятствия", "Совет"],
      cards5: ["Текущая ситуация", "Источники дохода", "Области расхода", "Препятствия", "Совет"]
    },
    {
      id: "finances-2",
      name: "Доходы и расходы",
      cards3: ["Доходы", "Расходы", "Перспективы"],
      cards5: ["Мои ресурсы", "Что нужно отпустить", "Риски", "Новый путь", "Результат"]
    },
    {
      id: "finances-3",
      name: "Контроль финансов",
      cards3: ["Что контролирую", "Что не контролирую", "Что изменить"],
      cards5: ["Цели", "Планы", "Поддержка", "Препятствия", "Итог"]
    },
    {
      id: "finances-4",
      name: "Риски и возможности",
      cards3: ["Риски", "Возможности", "Действия"],
      cards5: ["Влияние прошлого", "Настоящее состояние", "Будущее", "Влияние окружения", "Совет"]
   },
   {
     id: "finances-5",
     name: "Финансовые привычки",
     cards3: ["Финансовые привычки", "Что мешает", "Что помогает"],
     cards5: ["Мои сильные стороны", "Ограничения", "Возможности", "Угрозы", "Как действовать"]
   }
 ],
 "health": [
   {
     id: "health-1",
     name: "Здоровье",
     cards3: ["Текущее состояние", "Основная проблема", "Совет"],
     cards5: ["Физическое состояние", "Эмоциональное состояние", "Психическое состояние", "Внешние факторы", "Совет для баланса"]
   },
   {
     id: "health-2",
     name: "Тело-Эмоции-Дух",
     cards3: ["Тело", "Эмоции", "Дух"],
     cards5: ["Симптом", "Причина", "Что я делаю", "Что нужно сделать", "Итог"]
   },
   {
     id: "health-3",
     name: "Что помогает",
     cards3: ["Что помогает", "Что мешает", "Что изменить"],
     cards5: ["Мой ресурс", "Что истощает", "Помощь извне", "Внутренние барьеры", "Путь к исцелению"]
   },
   {
     id: "health-4",
     name: "Причины симптомов",
     cards3: ["Причина симптомов", "Текущие действия", "Итог"],
     cards5: ["Настоящее состояние", "Влияние прошлого", "Текущие ограничения", "Что важно развивать", "Итог выздоровления"]
   },
   {
     id: "health-5",
     name: "Энергия и стресс",
     cards3: ["Уровень энергии", "Источники стресса", "Способы восстановления"],
     cards5: ["Телесные ощущения", "Эмоции", "Мышление", "Внешнее воздействие", "Совет по балансу"]
   }
 ],
 "friendship": [
   {
     id: "friendship-1",
     name: "Я и друг",
     cards3: ["Я", "Друг", "Суть отношений"],
     cards5: ["Я", "Друг", "Наши общие качества", "Вызовы", "Итог"]
   },
   {
     id: "friendship-2",
     name: "Взаимный обмен",
     cards3: ["Что я даю", "Что получаю", "Что нужно изменить"],
     cards5: ["Позитивные стороны", "Препятствия", "Внимание", "Советы", "Перспективы"]
   },
   {
     id: "friendship-3",
     name: "Конфликт в дружбе",
     cards3: ["Причина конфликта", "Что помогает", "Совет"],
     cards5: ["Мои ожидания", "Ожидания друга", "Что нас соединяет", "Что нас разделяет", "Итог"]
   },
   {
     id: "friendship-4",
     name: "Ожидания",
     cards3: ["Мои ожидания", "Реальность", "Итог"],
     cards5: ["Истоки дружбы", "Настоящее состояние", "Влияние внешних обстоятельств", "Что улучшить", "Совет"]
   },
   {
     id: "friendship-5",
     name: "Будущее дружбы",
     cards3: ["Настоящее состояние", "Влияние прошлого", "Будущее дружбы"],
     cards5: ["Я", "Друг", "Наши настоящие чувства", "Барьеры", "Как двигаться вперёд"]
   }
 ]
};

// 22 карты старших арканов
const MAJOR_ARCANA = [
 "Дурак", "Маг", "Верховная Жрица", "Императрица", "Император", "Иерофант",
 "Влюбленные", "Колесница", "Сила", "Отшельник", "Колесо Фортуны", "Справедливость",
 "Повешенный", "Смерть", "Умеренность", "Дьявол", "Башня", "Звезда", 
 "Луна", "Солнце", "Суд", "Мир"
];

/**
 * Функция для работы с Python скриптом натальной карты
 * ИСПРАВЛЕННАЯ ВЕРСИЯ с поддержкой UTF-8 кодировки
 */
// ✅ ЗАМЕНА PYTHON ФУНКЦИИ НА TYPESCRIPT

/**
 * Конвертация кода страны в код для библиотеки
 */
function getCountryCode(birthCountry?: string): string {
  const countryMap: Record<string, string> = {
    'Россия': 'RU',
    'США': 'US', 
    'Германия': 'DE',
    'Франция': 'FR',
    'Италия': 'IT',
    'Испания': 'ES',
    'Великобритания': 'GB',
    'Канада': 'CA',
    'Австралия': 'AU',
    'Япония': 'JP',
    'Китай': 'CN',
    'Индия': 'IN',
    'Бразилия': 'BR',
    'Мексика': 'MX',
    'Аргентина': 'AR',
    'Турция': 'TR',
    'Южная Корея': 'KR',
    'Польша': 'PL',
    'Нидерланды': 'NL',
    'Швеция': 'SE',
    'Норвегия': 'NO',
    'Дания': 'DK',
    'Финляндия': 'FI',
    'Чехия': 'CZ',
    'Венгрия': 'HU',
    'Португалия': 'PT',
    'Греция': 'GR',
    'Швейцария': 'CH',
    'Австрия': 'AT',
    'Бельгия': 'BE',
    'Украина': 'UA',
    'Беларусь': 'BY',
    'Казахстан': 'KZ'
  };
  
  return countryMap[birthCountry || 'Россия'] || 'RU';
}

// 🌍 БАЗА КООРДИНАТ РОССИЙСКИХ И МИРОВЫХ ГОРОДОВ
const CITY_COORDINATES: Record<string, {lat: number, lng: number, timezone: string}> = {
  // Российские города (по популярности)
  'Москва': { lat: 55.7558, lng: 37.6173, timezone: 'Europe/Moscow' },
  'Санкт-Петербург': { lat: 59.9311, lng: 30.3609, timezone: 'Europe/Moscow' },
  'Новосибирск': { lat: 55.0084, lng: 82.9357, timezone: 'Asia/Novosibirsk' },
  'Екатеринбург': { lat: 56.8431, lng: 60.6454, timezone: 'Asia/Yekaterinburg' },
  'Казань': { lat: 55.8304, lng: 49.0661, timezone: 'Europe/Moscow' },
  'Нижний Новгород': { lat: 56.2965, lng: 43.9361, timezone: 'Europe/Moscow' },
  'Челябинск': { lat: 55.1644, lng: 61.4368, timezone: 'Asia/Yekaterinburg' },
  'Самара': { lat: 53.2001, lng: 50.1500, timezone: 'Europe/Samara' },
  'Омск': { lat: 54.9884, lng: 73.3242, timezone: 'Asia/Omsk' },
  'Ростов-на-Дону': { lat: 47.2357, lng: 39.7015, timezone: 'Europe/Moscow' },
  'Уфа': { lat: 54.7388, lng: 55.9721, timezone: 'Asia/Yekaterinburg' },
  'Красноярск': { lat: 56.0184, lng: 92.8672, timezone: 'Asia/Krasnoyarsk' },
  'Воронеж': { lat: 51.6720, lng: 39.1843, timezone: 'Europe/Moscow' },
  'Пермь': { lat: 58.0105, lng: 56.2502, timezone: 'Asia/Yekaterinburg' },
  'Волгоград': { lat: 48.7080, lng: 44.5133, timezone: 'Europe/Moscow' },
  'Краснодар': { lat: 45.0355, lng: 38.9753, timezone: 'Europe/Moscow' },
  'Саратов': { lat: 51.5924, lng: 46.0086, timezone: 'Europe/Saratov' },
  'Тюмень': { lat: 57.1522, lng: 65.5272, timezone: 'Asia/Yekaterinburg' },
  'Тольятти': { lat: 53.5303, lng: 49.3461, timezone: 'Europe/Samara' },
  'Ижевск': { lat: 56.8431, lng: 53.2045, timezone: 'Europe/Samara' },
  'Барнаул': { lat: 53.3606, lng: 83.7636, timezone: 'Asia/Barnaul' },
  'Ульяновск': { lat: 54.3142, lng: 48.4031, timezone: 'Europe/Ulyanovsk' },
  'Иркутск': { lat: 52.2978, lng: 104.2964, timezone: 'Asia/Irkutsk' },
  'Хабаровск': { lat: 48.4827, lng: 135.0841, timezone: 'Asia/Vladivostok' },
  'Ярославль': { lat: 57.6261, lng: 39.8845, timezone: 'Europe/Moscow' },
  'Владивосток': { lat: 43.1056, lng: 131.8735, timezone: 'Asia/Vladivostok' },
  'Махачкала': { lat: 42.9849, lng: 47.5047, timezone: 'Europe/Moscow' },
  'Томск': { lat: 56.4977, lng: 84.9744, timezone: 'Asia/Tomsk' },
  'Оренбург': { lat: 51.7727, lng: 55.0988, timezone: 'Asia/Yekaterinburg' },
  'Кемерово': { lat: 55.3331, lng: 86.0827, timezone: 'Asia/Novokuznetsk' },
  'Новокузнецк': { lat: 53.7557, lng: 87.1099, timezone: 'Asia/Novokuznetsk' },
  'Рязань': { lat: 54.6269, lng: 39.6916, timezone: 'Europe/Moscow' },
  'Астрахань': { lat: 46.3497, lng: 48.0408, timezone: 'Europe/Astrakhan' },
  'Пенза': { lat: 53.2001, lng: 45.0000, timezone: 'Europe/Moscow' },
  'Липецк': { lat: 52.6031, lng: 39.5708, timezone: 'Europe/Moscow' },
  'Тула': { lat: 54.1961, lng: 37.6182, timezone: 'Europe/Moscow' },
  'Киров': { lat: 58.6035, lng: 49.6679, timezone: 'Europe/Kirov' },
  'Чебоксары': { lat: 56.1439, lng: 47.2486, timezone: 'Europe/Moscow' },
  'Калининград': { lat: 54.7104, lng: 20.4522, timezone: 'Europe/Kaliningrad' },
  'Брянск': { lat: 53.2434, lng: 34.3656, timezone: 'Europe/Moscow' },
  'Курск': { lat: 51.7373, lng: 36.1873, timezone: 'Europe/Moscow' },
  'Иваново': { lat: 56.9719, lng: 40.9763, timezone: 'Europe/Moscow' },
  'Магнитогорск': { lat: 53.4078, lng: 59.0465, timezone: 'Asia/Yekaterinburg' },
  'Тверь': { lat: 56.8587, lng: 35.9176, timezone: 'Europe/Moscow' },
  'Ставрополь': { lat: 45.0428, lng: 41.9734, timezone: 'Europe/Moscow' },
  'Нижний Тагил': { lat: 57.9106, lng: 59.9686, timezone: 'Asia/Yekaterinburg' },
  'Белгород': { lat: 50.5953, lng: 36.5879, timezone: 'Europe/Moscow' },
  'Архангельск': { lat: 64.5401, lng: 40.5433, timezone: 'Europe/Moscow' },
  'Владимир': { lat: 56.1366, lng: 40.3966, timezone: 'Europe/Moscow' },
  'Сочи': { lat: 43.6028, lng: 39.7342, timezone: 'Europe/Moscow' },
  'Курган': { lat: 55.4500, lng: 65.3333, timezone: 'Asia/Yekaterinburg' },
  'Орёл': { lat: 52.9651, lng: 36.0785, timezone: 'Europe/Moscow' },
  'Смоленск': { lat: 54.7818, lng: 32.0401, timezone: 'Europe/Moscow' },
  'Калуга': { lat: 54.5293, lng: 36.2754, timezone: 'Europe/Moscow' },
  'Чита': { lat: 52.0315, lng: 113.5006, timezone: 'Asia/Chita' },
  'Волжский': { lat: 48.7854, lng: 44.7759, timezone: 'Europe/Volgograd' },
  'Череповец': { lat: 59.1374, lng: 37.9097, timezone: 'Europe/Moscow' },
  'Владикавказ': { lat: 43.0370, lng: 44.6830, timezone: 'Europe/Moscow' },
  'Мурманск': { lat: 68.9585, lng: 33.0827, timezone: 'Europe/Moscow' },
  'Сургут': { lat: 61.2501, lng: 73.3957, timezone: 'Asia/Yekaterinburg' },
  'Вологда': { lat: 59.2239, lng: 39.8843, timezone: 'Europe/Moscow' },
  'Тамбов': { lat: 52.7214, lng: 41.4528, timezone: 'Europe/Moscow' },
  'Стерлитамак': { lat: 53.6241, lng: 55.9500, timezone: 'Asia/Yekaterinburg' },
  'Грозный': { lat: 43.3181, lng: 45.6986, timezone: 'Europe/Moscow' },
  'Якутск': { lat: 62.0355, lng: 129.6755, timezone: 'Asia/Yakutsk' },
  'Кострома': { lat: 57.7665, lng: 40.9265, timezone: 'Europe/Moscow' },
  'Комсомольск-на-Амуре': { lat: 50.5496, lng: 137.0018, timezone: 'Asia/Vladivostok' },
  'Петрозаводск': { lat: 61.7849, lng: 34.3469, timezone: 'Europe/Moscow' },
  'Таганрог': { lat: 47.2362, lng: 38.8969, timezone: 'Europe/Moscow' },
  'Нижневартовск': { lat: 60.9344, lng: 76.5531, timezone: 'Asia/Yekaterinburg' },
  'Йошкар-Ола': { lat: 56.6372, lng: 47.8752, timezone: 'Europe/Moscow' },
  'Братск': { lat: 56.1326, lng: 101.6140, timezone: 'Asia/Irkutsk' },
  'Новороссийск': { lat: 44.7230, lng: 37.7681, timezone: 'Europe/Moscow' },
  'Дзержинск': { lat: 56.2431, lng: 43.4221, timezone: 'Europe/Moscow' },
  'Шахты': { lat: 47.7090, lng: 40.2141, timezone: 'Europe/Moscow' },
  'Орск': { lat: 51.2045, lng: 58.5596, timezone: 'Asia/Yekaterinburg' },
  'Сыктывкар': { lat: 61.6681, lng: 50.8372, timezone: 'Europe/Moscow' },
  'Нижнекамск': { lat: 55.6367, lng: 51.8206, timezone: 'Europe/Moscow' },
  'Ангарск': { lat: 52.5408, lng: 103.8886, timezone: 'Asia/Irkutsk' },
  'Балашиха': { lat: 55.7969, lng: 37.9381, timezone: 'Europe/Moscow' },
  'Благовещенск': { lat: 50.2754, lng: 127.5275, timezone: 'Asia/Yakutsk' },
  'Прокопьевск': { lat: 53.9058, lng: 86.7197, timezone: 'Asia/Novokuznetsk' },
  'Химки': { lat: 55.8970, lng: 37.4296, timezone: 'Europe/Moscow' },
  'Псков': { lat: 57.8136, lng: 28.3496, timezone: 'Europe/Moscow' },
  'Бийск': { lat: 52.5396, lng: 85.2072, timezone: 'Asia/Barnaul' },
  'Энгельс': { lat: 51.4827, lng: 46.1178, timezone: 'Europe/Saratov' },
  'Рыбинск': { lat: 58.0446, lng: 38.8580, timezone: 'Europe/Moscow' },
  'Балаково': { lat: 52.0262, lng: 47.8056, timezone: 'Europe/Saratov' },
  'Северодвинск': { lat: 64.5635, lng: 39.8302, timezone: 'Europe/Moscow' },
  'Армавир': { lat: 44.9892, lng: 41.1234, timezone: 'Europe/Moscow' },
  'Подольск': { lat: 55.4297, lng: 37.5441, timezone: 'Europe/Moscow' },
  'Королёв': { lat: 55.9138, lng: 37.8272, timezone: 'Europe/Moscow' },
  'Сызрань': { lat: 53.1585, lng: 48.4681, timezone: 'Europe/Samara' },
  'Петропавловск-Камчатский': { lat: 53.0445, lng: 158.6475, timezone: 'Asia/Kamchatka' },
  'Альметьевск': { lat: 54.9033, lng: 52.2977, timezone: 'Europe/Moscow' },
  'Люберцы': { lat: 55.6758, lng: 37.8939, timezone: 'Europe/Moscow' },
  'Южно-Сахалинск': { lat: 46.9588, lng: 142.7386, timezone: 'Asia/Sakhalin' },

  // Зарубежные города (основные)
  'Нью-Йорк': { lat: 40.7128, lng: -74.0060, timezone: 'America/New_York' },
  'Лондон': { lat: 51.5074, lng: -0.1278, timezone: 'Europe/London' },
  'Париж': { lat: 48.8566, lng: 2.3522, timezone: 'Europe/Paris' },
  'Берлин': { lat: 52.5200, lng: 13.4050, timezone: 'Europe/Berlin' },
  'Токио': { lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo' },
  'Пекин': { lat: 39.9042, lng: 116.4074, timezone: 'Asia/Shanghai' },
  'Лос-Анджелес': { lat: 34.0522, lng: -118.2437, timezone: 'America/Los_Angeles' },
  'Сидней': { lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney' },
  'Торонто': { lat: 43.6532, lng: -79.3832, timezone: 'America/Toronto' },
  'Дубай': { lat: 25.2048, lng: 55.2708, timezone: 'Asia/Dubai' },
  'Рим': { lat: 41.9028, lng: 12.4964, timezone: 'Europe/Rome' },
  'Мадрид': { lat: 40.4168, lng: -3.7038, timezone: 'Europe/Madrid' },
  'Амстердам': { lat: 52.3676, lng: 4.9041, timezone: 'Europe/Amsterdam' },
  'Стокгольм': { lat: 59.3293, lng: 18.0686, timezone: 'Europe/Stockholm' },
  'Вена': { lat: 48.2082, lng: 16.3738, timezone: 'Europe/Vienna' },
  'Прага': { lat: 50.0755, lng: 14.4378, timezone: 'Europe/Prague' },
  'Варшава': { lat: 52.2297, lng: 21.0122, timezone: 'Europe/Warsaw' },
  'Будапешт': { lat: 47.4979, lng: 19.0402, timezone: 'Europe/Budapest' },
  'Киев': { lat: 50.4501, lng: 30.5234, timezone: 'Europe/Kiev' },
  'Минск': { lat: 53.9006, lng: 27.5590, timezone: 'Europe/Minsk' },
  'Алматы': { lat: 43.2220, lng: 76.8512, timezone: 'Asia/Almaty' },
  'Ташкент': { lat: 41.2995, lng: 69.2401, timezone: 'Asia/Tashkent' },
  'Тбилиси': { lat: 41.7151, lng: 44.8271, timezone: 'Asia/Tbilisi' },
  'Ереван': { lat: 40.1792, lng: 44.4991, timezone: 'Asia/Yerevan' },
  'Баку': { lat: 40.4093, lng: 49.8671, timezone: 'Asia/Baku' }
};

// Функция для получения координат города
function getCityCoordinates(cityName: string) {
  if (!cityName) return CITY_COORDINATES['Москва'];
  
  // Ищем точное совпадение
  if (CITY_COORDINATES[cityName]) {
    return CITY_COORDINATES[cityName];
  }
  
  // Ищем частичное совпадение (без учета регистра)
  const normalizedInput = cityName.toLowerCase().trim();
  for (const [city, coords] of Object.entries(CITY_COORDINATES)) {
    if (city.toLowerCase().includes(normalizedInput) || 
        normalizedInput.includes(city.toLowerCase())) {
      return coords;
    }
  }
  
  // Особые случаи для сокращений
  const cityAliases: Record<string, string> = {
    'спб': 'Санкт-Петербург',
    'питер': 'Санкт-Петербург',
    'екб': 'Екатеринбург',
    'нск': 'Новосибирск',
    'мск': 'Москва',
    'нн': 'Нижний Новгород',
    'ростов': 'Ростов-на-Дону',
    'нижневартовск': 'Нижневартовск'
  };
  
  const alias = cityAliases[normalizedInput];
  if (alias && CITY_COORDINATES[alias]) {
    return CITY_COORDINATES[alias];
  }
  
  // По умолчанию - Москва
  return CITY_COORDINATES['Москва'];
}
// ✅ ДОЛЖНО БЫТЬ:
export async function generateNatalChartAnalysis(
  userId: number,
  name: string,
  birthDate: string,
  birthTime?: string,
  birthPlace?: string,
  birthCountry?: string
): Promise<{
  svgFileName?: string;
  analysis: Array<{title: string, content: string}>;
  success: boolean;
}> {
  try {
    console.log(`🌌 Generating natal chart for ${name}`);
    
    // Парсим дату рождения
    const birthDateObj = new Date(birthDate);
    const year = birthDateObj.getFullYear();
    const month = birthDateObj.getMonth() + 1;
    const day = birthDateObj.getDate();
    
    // Парсим время рождения
    let hour = 12;
    let minute = 0;
    if (birthTime) {
      const timeParts = birthTime.split(':');
      hour = parseInt(timeParts[0]) || 12;
      minute = parseInt(timeParts[1]) || 0;
    }
    
    // Подготавливаем данные для Python скрипта
    // Получаем координаты города
    const cityCoords = getCityCoordinates(birthPlace || "Москва");

    const pythonInput = {
      user_name: name,
      birth_year: year,
      birth_month: month,
      birth_day: day,
      birth_hour: hour,
      birth_minute: minute,
      birth_city: birthPlace || "Москва",
      birth_country_code: getCountryCode(birthCountry),
      birth_lat: cityCoords.lat,
      birth_lng: cityCoords.lng,
      birth_tz: cityCoords.timezone
    };
    
    console.log(`🌌 Python input prepared:`, pythonInput);
    
    // Вызываем Python скрипт
    const pythonResult = await callPythonNatalChart(pythonInput);
    
    if (!pythonResult.success || pythonResult.error) {
      console.error(`🌌 Python script failed: ${pythonResult.error}`);
      
      // Fallback: используем ИИ для создания базового анализа
      console.log(`🌌 Using AI fallback for natal chart analysis`);
      
      const prompt = `Ты профессиональный астролог. Создай подробный анализ натальной карты для человека с именем ${name}, родившегося ${birthDate}${birthTime ? ` в ${birthTime}` : ""}${birthPlace ? ` в городе ${birthPlace}` : ""}${birthCountry ? ` в стране ${birthCountry}` : ""}. 

Включи в анализ:
1. Характеристику личности по знаку зодиака
2. Влияние планет на характер и судьбу
3. Сильные и слабые стороны личности
4. Таланты и способности
5. Рекомендации для жизненного пути
6. Совместимость с другими знаками
7. Благоприятные периоды и числа

Используй мистический и духовный тон, но будь конкретным в рекомендациях. Пиши на русском языке. НЕ ИСПОЛЬЗУЙ markdown-форматирование (звездочки, решетки, подчеркивания). Пиши обычным текстом.`;

      const response = await openai.chat.completions.create({
        model: "openai/gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 6000,
        temperature: 0.7,
      });

      const rawContent = response.choices[0].message.content || "Не удалось создать анализ натальной карты. Пожалуйста, попробуйте позже.";
      
      // ✨ СТРУКТУРИРУЕМ ТЕКСТ В СЕКЦИИ
      const structuredSections = cleanStructuredRussianText(rawContent);
      
      // Track API usage
      await trackApiUsage(
        userId,
        "natal-chart-fallback",
        prompt,
        rawContent,
        response.usage?.prompt_tokens || prompt.length,
        response.usage?.completion_tokens || rawContent.length
      );
      
      return {
        analysis: structuredSections,
        success: false // Указываем что использовался fallback
      };
    }
    
    // Если Python скрипт отработал успешно
    console.log(`🌌 Python script successful, processing AI prompt`);
    
    // Передаем промт от Python в ИИ для анализа
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: pythonResult.ai_prompt! }],
      max_tokens: 8000,
      temperature: 0.7,
    });

    const rawContent = response.choices[0].message.content || "Не удалось создать анализ натальной карты. Пожалуйста, попробуйте позже.";
    
    // ✨ СТРУКТУРИРУЕМ ТЕКСТ В СЕКЦИИ
    const structuredSections = cleanStructuredRussianText(rawContent);
    
    console.log(`✅ Natal chart analysis generated successfully for ${name}`);
    console.log(`🧹 Text structured into ${structuredSections.length} sections`);
    console.log(`📁 SVG file: ${pythonResult.svg_name}`);
    
    // Track API usage
    await trackApiUsage(
      userId,
      "natal-chart",
      pythonResult.ai_prompt!,
      rawContent,
      response.usage?.prompt_tokens || (pythonResult.ai_prompt?.length || 0),
      response.usage?.completion_tokens || rawContent.length
    );
    
    return {
      svgFileName: pythonResult.svg_name,
      analysis: structuredSections,
      success: true
    };
    
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

// =====================================================
// РАСКЛАД ТАРО (СОГЛАСНО ТЗ)
// =====================================================

export async function generateTarotReading(
 userId: number, 
 question: string, 
 cardCount: number, 
 category: string, 
 preset: string,
 selectedCardNames?: string[]
): Promise<Array<{title: string, content: string}>> {
 try {
   console.log(`🔮 Generating tarot reading: ${cardCount} cards, category: ${category}, preset: ${preset}`);
   
   const user = await getUserData(userId);
   const userName = user?.name || "Друг";
   const userGender = user?.gender || "неизвестен";
   const birthDate = user?.birthDate || "неизвестна";
   
   const categoryPresets = TAROT_PRESETS[category] || TAROT_PRESETS["love"];
   const selectedPreset = categoryPresets.find(p => p.id === preset) || categoryPresets[0];
   
   const positions = cardCount === 3 ? selectedPreset.cards3 : selectedPreset.cards5;
   
   if (positions.length !== cardCount) {
     console.error(`❌ Mismatch: cardCount=${cardCount}, positions.length=${positions.length}`);
     throw new Error(`Несоответствие количества карт: запрошено ${cardCount}, позиций ${positions.length}`);
   }
   
   // ✅ ГЕНЕРИРУЕМ КАРТЫ НА БЭКЕНДЕ (НЕ НА ФРОНТЕНДЕ!)
   const drawnCards = selectedCardNames || [...MAJOR_ARCANA].sort(() => Math.random() - 0.5).slice(0, cardCount);
   
   console.log(`🎴 Selected preset: ${selectedPreset.name}`);
   console.log(`🎴 Positions (${positions.length}): ${positions.join(', ')}`);
   console.log(`🎴 Drawn cards (${drawnCards.length}): ${drawnCards.join(', ')}`);
   
   // ✅ СОЗДАЕМ СТРОГИЙ ПРОМПТ ДЛЯ ПРАВИЛЬНОЙ СТРУКТУРЫ
   let prompt: string;

   if (cardCount === 3) {
     prompt = `Представь, что ты опытный таролог с глубоким пониманием символизма и тонкостей карт Таро. Ты помогаешь людям обретать внутреннюю гармонию и находить ответы на важные вопросы своей жизни. Прежде чем начать, создавай спокойную и доверительную атмосферу, чтобы пользователь мог сосредоточиться на своем запросе.

   Человека, который к тебе обратился, зовут ${userName}, пол: ${userGender}, дата рождения: ${birthDate}. Тема расклада – ${category}.
   Проблема, которую ${userName} хочет решить: «${question}».

   Выпали следующие карты: карта 1 обозначает «${positions[0]}» - это карта ${drawnCards[0]}, карта 2 обозначает «${positions[1]}» - это карта ${drawnCards[1]}, карта 3 обозначает «${positions[2]}» - это карта ${drawnCards[2]}.

   Проанализируй карты в том же порядке, в котором они и написаны. Дай подробный ответ на описанную проблему и проведи полный анализ вытянутых карт. Дай рекомендации, на что нужно обратить внимание и чего стоит избегать.

   Сделай строго 5 разделов:

   РАЗДЕЛ1: Вводное слово (минимум 4-5 предложений)
   Создай атмосферу доверия и настрой на восприятие мудрости карт. Напиши подробное вступление, объясни важность момента.

   РАЗДЕЛ2: Анализ первой карты - ${positions[0]} (минимум 10-12 предложений)
   Подробно проанализируй карту ${drawnCards[0]} в контексте позиции ${positions[0]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

   РАЗДЕЛ3: Анализ второй карты - ${positions[1]} (минимум 10-12 предложений)
   Подробно проанализируй карту ${drawnCards[1]} в контексте позиции ${positions[1]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

   РАЗДЕЛ4: Анализ третьей карты - ${positions[2]} (минимум 10-12 предложений)
   Подробно проанализируй карту ${drawnCards[2]} в контексте позиции ${positions[2]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

   РАЗДЕЛ5: Общие рекомендации (минимум 8-10 предложений)
   Дай итоговые подробные советы и рекомендации на основе всех трех карт. Объедини их мудрость в целостную картину, дай конкретные шаги к действию, предупреди о возможных сложностях.

   НЕ используй markdown форматирование. Пиши обычным текстом.`;

 } else if (cardCount === 5) {
   prompt = `Представь, что ты опытный таролог с глубоким пониманием символизма и тонкостей карт Таро. Ты помогаешь людям обретать внутреннюю гармонию и находить ответы на важные вопросы своей жизни. Прежде чем начать, создавай спокойную и доверительную атмосферу, чтобы пользователь мог сосредоточиться на своем запросе.

 Человека, который к тебе обратился, зовут ${userName}, пол: ${userGender}, дата рождения: ${birthDate}. Тема расклада – ${category}.
 Проблема, которую ${userName} хочет решить: «${question}».

 Выпали следующие карты: карта 1 обозначает «${positions[0]}» - это карта ${drawnCards[0]}, карта 2 обозначает «${positions[1]}» - это карта ${drawnCards[1]}, карта 3 обозначает «${positions[2]}» - это карта ${drawnCards[2]}, карта 4 обозначает «${positions[3]}» - это карта ${drawnCards[3]}, карта 5 обозначает «${positions[4]}» - это карта ${drawnCards[4]}.

 Проанализируй карты в том же порядке, в котором они и написаны. Дай подробный ответ на описанную проблему и проведи полный анализ вытянутых карт. Дай рекомендации, на что нужно обратить внимание и чего стоит избегать.

 Сделай строго 7 разделов:

 РАЗДЕЛ1: Вводное слово (минимум 4-5 предложений)
 Создай атмосферу доверия и настрой на восприятие мудрости карт. Напиши подробное вступление, объясни важность момента.

 РАЗДЕЛ2: Анализ первой карты - ${positions[0]} (минимум 10-12 предложений)
 Подробно проанализируй карту ${drawnCards[0]} в контексте позиции ${positions[0]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

 РАЗДЕЛ3: Анализ второй карты - ${positions[1]} (минимум 10-12 предложений)
 Подробно проанализируй карту ${drawnCards[1]} в контексте позиции ${positions[1]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

 РАЗДЕЛ4: Анализ третьей карты - ${positions[2]} (минимум 10-12 предложений)
 Подробно проанализируй карту ${drawnCards[2]} в контексте позиции ${positions[2]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

 РАЗДЕЛ5: Анализ четвертой карты - ${positions[3]} (минимум 10-12 предложений)
 Подробно проанализируй карту ${drawnCards[3]} в контексте позиции ${positions[3]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

 РАЗДЕЛ6: Анализ пятой карты - ${positions[4]} (минимум 10-12 предложений)
 Подробно проанализируй карту ${drawnCards[4]} в контексте позиции ${positions[4]}. Опиши символизм карты, её глубинное значение, как она отвечает на вопрос, какие конкретные советы даёт, на что обратить внимание, чего избегать, как применить мудрость карты в жизни.

 РАЗДЕЛ7: Общие рекомендации (минимум 8-10 предложений)
 Дай итоговые подробные советы и рекомендации на основе всех пяти карт. Объедини их мудрость в целостную картину, дай конкретные шаги к действию, предупреди о возможных сложностях.

 НЕ используй markdown форматирование. Пиши обычным текстом.`;

   } else {
     throw new Error(`Неподдерживаемое количество карт: ${cardCount}`);
   }

   console.log(`🔍 Using ${cardCount}-card specific prompt`);

   const response = await openai.chat.completions.create({
     model: "openai/gpt-4o-mini",
     messages: [{ role: "user", content: prompt }],
     max_tokens: cardCount === 3 ? 8000 : 12000,
     temperature: 0.9,
   });

   const rawContent = response.choices[0].message.content || "Не удалось создать чтение карт. Пожалуйста, попробуйте позже.";

   console.log("🔍 ========== ДИАГНОСТИКА ОТВЕТА ИИ ==========");
   console.log("🔍 Длина ответа ИИ:", rawContent.length, "символов");
   console.log("🔍 Первые 500 символов ответа:");
   console.log(rawContent.substring(0, 500));
   console.log("🔍 Последние 300 символов ответа:");
   console.log(rawContent.substring(rawContent.length - 300));
   console.log("🔍 Ищем маркеры РАЗДЕЛ в ответе:");
   const sectionMarkers = rawContent.match(/РАЗДЕЛ\s*\d+:/g);
   console.log("🔍 Найденные маркеры:", sectionMarkers);
   console.log("🔍 ==========================================");

   // ✅ ПАРСИМ ОТВЕТ В ПРАВИЛЬНУЮ СТРУКТУРУ
   console.log("🔍 Начинаем парсинг ответа длиной:", rawContent.length);
   const structuredReading = parseStrictTarotResponse(rawContent, cardCount, positions, drawnCards);
   console.log("🔍 После парсинга получили секций:", structuredReading.length);

   console.log(`✅ Tarot reading generated: ${cardCount} cards, ${structuredReading.length} sections`);
   
   // Track API usage
   await trackApiUsage(
     userId,
     `tarot/${cardCount}/${category}/${preset}`,
     prompt,
     rawContent,
     response.usage?.prompt_tokens || prompt.length,
     response.usage?.completion_tokens || rawContent.length
   );
   
   // ✅ ВОЗВРАЩАЕМ МАССИВ СЕКЦИЙ КАК ОЖИДАЕТ ФРОНТЕНД
   console.log(`✅ Final result: ${structuredReading.length} sections returned`);
   
   return structuredReading;
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

// ✅ СТРОГАЯ ФУНКЦИЯ ПАРСИНГА ОТВЕТА ИИ
function parseStrictTarotResponse(
 rawContent: string, 
 expectedCardCount: number, 
 positions: string[], 
 drawnCards: string[]
): Array<{title: string, content: string}> {
 console.log("🔍 STRICT PARSING for EXACTLY " + expectedCardCount + " cards + 1 advice");
 
 const expectedSectionCount = expectedCardCount === 3 ? 5 : 7;
 
 if (!rawContent || typeof rawContent !== 'string') {
   console.log('❌ Invalid rawContent, creating fallback');
   return createStrictFallbackReading(expectedCardCount, positions, drawnCards, expectedSectionCount);
 }

 // Очищаем от markdown
 const cleanedText = cleanRussianText(rawContent);
 
 // Ищем разделы по маркеру "РАЗДЕЛ"
 const sectionMatches = cleanedText.match(/РАЗДЕЛ\s*\d+:[^]+?(?=РАЗДЕЛ\s*\d+:|$)/g);

 console.log("🔍 Найдено секций:", sectionMatches ? sectionMatches.length : 0);
 if (sectionMatches) {
   sectionMatches.forEach((section, index) => {
     console.log(`🔍 Секция ${index + 1} (длина ${section.length}):`, section.substring(0, 150) + "...");
   });
 }
 
 const sections: Array<{title: string, content: string}> = [];
 
 if (sectionMatches && sectionMatches.length >= expectedCardCount + 1) {
   console.log("✅ Found " + sectionMatches.length + " sections with РАЗДЕЛ markers");
   
   // Добавляем вводное слово (РАЗДЕЛ1)
   if (sectionMatches.length > 0) {
     const introSection = sectionMatches[0];
     let introContent = introSection.replace(/^РАЗДЕЛ\s*\d+:[^\n]*\n/, '').trim();
     sections.push({
       title: "Вводное слово",
       content: introContent || "Добро пожаловать в священное пространство таро."
     });
   }

   // Обрабатываем разделы карт (пропускаем РАЗДЕЛ1 - вводное слово)
   for (let i = 0; i < expectedCardCount; i++) {
     const sectionIndex = i + 1; // Пропускаем первый раздел (вводное слово)
     const positionName = (positions && positions.length > i && positions[i]) ? positions[i] : ("Позиция " + (i + 1));
     const cardName = (drawnCards && drawnCards.length > i && drawnCards[i]) ? drawnCards[i] : ("Карта " + (i + 1));
     
     if (sectionIndex < sectionMatches.length) {
       const section = sectionMatches[sectionIndex];
       
       // ✅ ПРАВИЛЬНЫЙ ПАРСИНГ: убираем только заголовок, оставляем весь контент
       let content = section.replace(/^РАЗДЕЛ\s*\d+:[^\n]*\n/, '').trim();
       
       // Убираем лишние переносы строк
       content = content.replace(/\n\s*\n/g, '\n\n');
       
       // Fallback только если контент реально пустой
       if (!content || content.length < 100) {
         content = "Карта " + cardName + " несет важное послание для вашей ситуации.";
       }
       
       sections.push({
         title: positionName + " - " + cardName,
         content: content
       });
     }
   }

   // Добавляем общие рекомендации
   if (sectionMatches.length > expectedCardCount) {
     const adviceSection = sectionMatches[expectedCardCount];
     if (adviceSection) {
       const adviceContentMatch = adviceSection.match(/РАЗДЕЛ\s*\d+:[^\n]+\n([\s\S]+)/);
       const adviceContent = adviceContentMatch ? adviceContentMatch[1].trim() : "Карты показывают путь к мудрости.";
       
       sections.push({
         title: "Общие рекомендации",
         content: adviceContent
       });
     }
   }
 } else {
   console.log('⚠️ РАЗДЕЛ markers not found, using simple paragraph splitting');
   
   // Fallback: делим текст на абзацы равномерно
   const paragraphs = cleanedText.split('\n\n').filter(function(p) { return p.trim().length > 20; });
   const paragraphsPerCard = Math.max(1, Math.floor(paragraphs.length / (expectedCardCount + 1)));
   
   // Создаем разделы для карт
   for (let i = 0; i < expectedCardCount; i++) {
     const startIdx = i * paragraphsPerCard;
     const endIdx = (i + 1) * paragraphsPerCard;
     const cardParagraphs = paragraphs.slice(startIdx, endIdx);
     
     const positionName = (positions && positions.length > i && positions[i]) ? positions[i] : ("Позиция " + (i + 1));
     const cardName = (drawnCards && drawnCards.length > i && drawnCards[i]) ? drawnCards[i] : ("Карта " + (i + 1));
     
     sections.push({
       title: positionName + " - " + cardName,
       content: cardParagraphs.join('\n\n') || ("Карта " + cardName + " в позиции \"" + positionName + "\" несет важное послание.")
     });
   }
   
   // Добавляем общие рекомендации из оставшихся абзацев
   const remainingParagraphs = paragraphs.slice(expectedCardCount * paragraphsPerCard);
   sections.push({
     title: "Общие рекомендации",
     content: remainingParagraphs.join('\n\n') || "Карты раскрывают важные аспекты вашей ситуации."
   });
 }
 
 // ✅ ГАРАНТИРУЕМ ТОЧНОЕ КОЛИЧЕСТВО СЕКЦИЙ
 if (sections.length !== expectedSectionCount) {
   console.log("🚨 Wrong section count: " + sections.length + ", expected: " + expectedSectionCount + ", creating strict fallback");
   return createStrictFallbackReading(expectedCardCount, positions, drawnCards, expectedSectionCount);
 }

 console.log("✅ PERFECT RESULT: " + sections.length + " sections (" + expectedCardCount + " cards + 1 advice)");
 return sections;
}

// ✅ СТРОГИЙ FALLBACK - ГАРАНТИРОВАННО ПРАВИЛЬНАЯ СТРУКТУРА
function createStrictFallbackReading(
 cardCount: number, 
 positions: string[], 
 drawnCards: string[],
 expectedSectionCount: number
): Array<{title: string, content: string}> {
 console.log(`🔄 Creating STRICT fallback for EXACTLY ${cardCount} cards + 1 advice`);
 
 const fallbackSections: Array<{title: string, content: string}> = [];

 // Вводное слово
 fallbackSections.push({
   title: "Вводное слово",
   content: "Добро пожаловать в священное пространство таро. Карты готовы поделиться своей мудростью и помочь вам найти ответы на важные вопросы."
 });

 // Создаем разделы для карт
 for (let i = 0; i < cardCount; i++) {
   const position = positions[i] || `Позиция ${i + 1}`;
   const card = drawnCards[i] || `Неизвестная карта`;
   
   fallbackSections.push({
     title: `Анализ карты - ${position}`,
     content: `Карта ${card} в позиции "${position}" несет важное послание для вашей ситуации. Эта карта указывает на ключевые аспекты, которые стоит рассмотреть в контексте вашего вопроса.`
   });
 }

 // Общие рекомендации
 fallbackSections.push({
   title: "Общие рекомендации",
   content: "Карты показывают важные аспекты вашей ситуации. Прислушайтесь к их мудрости и действуйте с пониманием того, что каждая карта открывает свою грань истины."
 });
 
 console.log(`✅ Strict fallback created: ${fallbackSections.length} sections (${cardCount} cards + 1 advice)`);
 
 return fallbackSections;
}

// =====================================================
// ТЕСТОВЫЕ И СЛУЖЕБНЫЕ ФУНКЦИИ
// =====================================================

// Test OpenRouter connection
export async function testOpenAIConnection(): Promise<boolean> {
try {
  console.log('🔧 Testing OpenRouter connection...');
  
  const response = await openai.chat.completions.create({
    model: 'openai/gpt-4o-mini',
    messages: [{ role: 'user', content: 'Test' }],
    max_tokens: 5,
  });
  
  console.log('✅ OpenRouter connection test successful!');
  return true;
} catch (error: any) {
  console.error('❌ OpenRouter connection test failed:', error.message);
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

// Вспомогательная функция для получения пресетов (для фронтенда)
export function getTarotPresets(category: string): TarotPreset[] {
return TAROT_PRESETS[category] || TAROT_PRESETS["love"];
}

// Функция для получения всех доступных категорий
export function getTarotCategories(): string[] {
return Object.keys(TAROT_PRESETS);
}