import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { getZodiacSign, getCompatibleSigns, calculateCompatibility } from "../client/src/lib/zodiac";
import { db } from "./db";
import { apiUsage, horoscopes, friends, User, users } from "@shared/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { generateHoroscope, generateTarotReading, generateNatalChartAnalysis, generateCompatibilityAnalysis } from "./openai";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { spawn } from "child_process";
import path from "path";

console.log("🚨🚨🚨 ROUTES.TS FILE LOADED! TIMESTAMP:", new Date().toISOString());

// Middleware для проверки авторизации
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).send("Необходима авторизация");
};

// Middleware для проверки прав администратора
const isAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && (req.user as User).role === "admin") {
    return next();
  }
  res.status(403).send("Доступ запрещен. Требуются права администратора.");
};

// Функция для получения случайных целых чисел
const getRandomNumbers = (count: number, min: number, max: number): number[] => {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return numbers;
};

// Функция для вызова Python скрипта натальных карт
// Исправленная функция для вызова Python скрипта через stdin
async function callPythonNatalChart(userData: {
  user_name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  birth_minute: number;
  birth_city: string;
  birth_country_code: string;
}): Promise<{ svg_name: string | null; ai_prompt: string | null; success: boolean; error?: string }> {
  return new Promise((resolve) => {
    console.log("🐍 Starting Python natal chart calculation...", userData);
    
    const scriptPath = path.join(__dirname, "utils", "natal-chart-calculator-NEW.py");
    console.log("🐍 Script path:", scriptPath);
    
    // ИСПРАВЛЕНИЕ: Убираем JSON из аргументов, передаем только путь к скрипту
    const pythonProcess = spawn("python3", [scriptPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PYTHONIOENCODING: "utf-8",
        PYTHONUTF8: "1",
        LANG: "en_US.UTF-8",
        LC_ALL: "en_US.UTF-8"
      },
    });

    console.log("🐍 Python process PID:", pythonProcess.pid);
    console.log("🐍 Python command:", "python3", scriptPath);

    let outputData = "";
    let errorData = "";

    pythonProcess.stdout.on("data", (data) => {
      outputData += data.toString("utf8");
    });

    pythonProcess.stderr.on("data", (data) => {
      const errorMessage = data.toString("utf8");
      console.log("🐍 Python stderr:", errorMessage);
      errorData += errorMessage;
    });

    pythonProcess.on("close", (code) => {
      console.log("🐍 Python process closed with code:", code);
      console.log("🐍 Python stdout:", outputData);
      
      if (code !== 0) {
        console.error("🐍 Python process failed:", errorData);
        resolve({
          svg_name: null,
          ai_prompt: null,
          success: false,
          error: `Python script failed with code ${code}: ${errorData}`
        });
        return;
      }

      try {
        const result = JSON.parse(outputData);
        console.log("🐍 Python result:", result);
        resolve(result);
      } catch (parseError) {
        console.error("🐍 Failed to parse Python output:", parseError);
        resolve({
          svg_name: null,
          ai_prompt: null,
          success: false,
          error: `Failed to parse Python output: ${parseError}`
        });
      }
    });

    pythonProcess.on("error", (error) => {
      console.error("🐍 Python process error:", error);
      resolve({
        svg_name: null,
        ai_prompt: null,
        success: false,
        error: `Python process error: ${error.message}`
      });
    });

    // ИСПРАВЛЕНИЕ: Передаем данные через stdin без escape-символов
    try {
      const inputJson = JSON.stringify(userData);
      console.log("🐍 Sending JSON to Python stdin:", inputJson.substring(0, 200));
      
      // Записываем JSON в stdin как строку
      pythonProcess.stdin.write(inputJson, 'utf8');
      pythonProcess.stdin.end();
      
      console.log("🐍 JSON sent to Python successfully");
    } catch (writeError) {
      console.error("🐍 Failed to write to Python stdin:", writeError);
      resolve({
        svg_name: null,
        ai_prompt: null,
        success: false,
        error: `Failed to write to Python: ${writeError}`
      });
    }
  });
}



// Главная функция для регистрации маршрутов
export async function registerRoutes(app: Express): Promise<Server> {
  console.log("🚀 REGISTERING HOROSCOPE REFRESH ROUTE!");
  // ДОБАВЬ ЭТУ СТРОКУ В САМОЕ НАЧАЛО:
  app.get("/api/test-routes-work", (req, res) => {
    console.log("✅ ROUTES FROM routes.ts WORK!");
    res.json({ message: "Routes from routes.ts are working!" });
  });

    // ДОБАВЬ ЭТИ СТРОКИ:
  console.log("🔥 TESTING ROUTE REGISTRATION!");
  console.log("🔥 App object type:", typeof app);
  console.log("🔥 App methods:", Object.getOwnPropertyNames(app));
  // 🚀🚀🚀 КРИТИЧНЫЙ ЛОГ - ДОЛЖЕН ПОЯВИТЬСЯ В КОНСОЛИ!
  console.log("🚀🚀🚀 REGISTERING ROUTES - COMPATIBILITY WILL BE ADDED!");
  console.log("🚀🚀🚀 Routes.ts loaded at:", new Date().toISOString());

  // 🧪 КРИТИЧНЫЙ ТЕСТ - ДОБАВИТЬ ПЕРВЫМ!
  app.get("/api/test-simple", (req, res) => {
    console.log("🧪 SIMPLE TEST ENDPOINT HIT!");
    res.json({ message: "Simple test works!", time: new Date().toISOString() });
  });

  app.post("/api/test-simple", (req, res) => {
    console.log("🧪 SIMPLE TEST POST ENDPOINT HIT!");
    console.log("🧪 Body:", req.body);
    res.json({ message: "Simple POST test works!", time: new Date().toISOString() });
  });
  
  // 🧪 ТЕСТОВЫЙ ENDPOINT - добавляем ПЕРВЫМ!
  app.post("/api/test-compat", isAuthenticated, async (req, res) => {
    console.log("🧪🧪🧪 TEST COMPAT ENDPOINT HIT!");
    console.log("🧪 Request body:", JSON.stringify(req.body, null, 2));
    res.json({ message: "Test compatibility endpoint works!", timestamp: new Date().toISOString() });
  });

  // 🚨 ТЕСТ БЕЗ АВТОРИЗАЦИИ!
  app.post("/api/test-no-auth", async (req, res) => {
    console.log("🚨 NO-AUTH TEST ENDPOINT HIT!");
    console.log("🚨 Body:", JSON.stringify(req.body, null, 2));
    res.json({ message: "No-auth test works!", data: req.body, timestamp: new Date().toISOString() });
  });

  // API для администратора
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const allUsers = await db.query.users.findMany({
        orderBy: (users, { desc }) => [desc(users.createdAt)]
      });
      
      res.json(allUsers);
    } catch (error) {
      console.error("Error getting users:", error);
      res.status(500).send("Ошибка при получении списка пользователей");
    }
  });
  
  app.get("/api/admin/api-usage", isAdmin, async (req, res) => {
    try {
      const { timeframe = "week" } = req.query;
      
      const currentDate = new Date();
      let fromDate = new Date();
      
      if (timeframe === "day") {
        fromDate.setDate(currentDate.getDate() - 1);
      } else if (timeframe === "week") {
        fromDate.setDate(currentDate.getDate() - 7);
      } else if (timeframe === "month") {
        fromDate.setMonth(currentDate.getMonth() - 1);
      } else if (timeframe === "year") {
        fromDate.setFullYear(currentDate.getFullYear() - 1);
      }
      
      const apiUsageData = await db.query.apiUsage.findMany({
        where: (apiUsage, { gte }) => gte(apiUsage.createdAt, fromDate),
        orderBy: (apiUsage, { asc }) => [asc(apiUsage.createdAt)]
      });
      
      // Группировка данных по датам
      const dailyUsageMap = new Map();
      const endpointStatsMap = new Map();
      const hourlyUsageMap = new Map();
      
      let totalCalls = 0;
      let totalTokensIn = 0;
      let totalTokensOut = 0;
      
      apiUsageData.forEach(usage => {
        totalCalls++;
        totalTokensIn += usage.tokensIn || 0;
        totalTokensOut += usage.tokensOut || 0;
        
        const dateKey = format(new Date(usage.createdAt), 'd MMM', { locale: ru });
        if (!dailyUsageMap.has(dateKey)) {
          dailyUsageMap.set(dateKey, { date: dateKey, calls: 0 });
        }
        dailyUsageMap.get(dateKey).calls++;
        
        if (!endpointStatsMap.has(usage.requestSource)) {
          endpointStatsMap.set(usage.requestSource, { 
            endpoint: usage.requestSource, 
            calls: 0, 
            tokensIn: 0, 
            tokensOut: 0 
          });
        }
        const endpointStat = endpointStatsMap.get(usage.requestSource);
        endpointStat.calls++;
        endpointStat.tokensIn += usage.tokensIn;
        endpointStat.tokensOut += usage.tokensOut;
        
        const hourKey = format(new Date(usage.createdAt), 'HH:00');
        if (!hourlyUsageMap.has(hourKey)) {
          hourlyUsageMap.set(hourKey, { hour: hourKey, calls: 0 });
        }
        hourlyUsageMap.get(hourKey).calls++;
      });
      
      const endpointStats = Array.from(endpointStatsMap.values())
        .sort((a, b) => b.calls - a.calls);
      
      const topEndpoint = endpointStats.length > 0 ? endpointStats[0].endpoint : 'Нет данных';
      const avgResponseTime = Math.round((totalTokensOut / Math.max(1, totalCalls)) * 1.5);
      
      const yesterdayDate = new Date();
      yesterdayDate.setDate(currentDate.getDate() - 1);
      const yesterdayKey = format(yesterdayDate, 'd MMM', { locale: ru });
      const yesterdayCalls = dailyUsageMap.has(yesterdayKey) ? dailyUsageMap.get(yesterdayKey).calls : 0;
      
      const result = {
        totalCalls,
        totalCallsYesterday: yesterdayCalls,
        topEndpoint,
        averageResponseTime: avgResponseTime,
        dailyUsage: Array.from(dailyUsageMap.values()),
        endpointStats,
        hourlyUsage: Array.from(hourlyUsageMap.values())
      };
      
      res.json(result);
    } catch (error) {
      console.error("Error getting API usage:", error);
      res.status(500).send("Ошибка при получении статистики API");
    }
  });
  
  app.post("/api/admin/set-admin-role", isAdmin, async (req, res) => {
    try {
      const { userId } = req.body;
      
      await db.update(users)
        .set({ role: "admin" })
        .where(eq(users.id, parseInt(userId)));
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error setting admin role:", error);
      res.status(500).send("Ошибка при назначении роли администратора");
    }
  });

  // API для работы с друзьями
  app.get("/api/friends", isAuthenticated, async (req, res) => {
    try {
      const userFriends = await storage.getFriendsByUserId(req.user!.id);
      res.json(userFriends);
    } catch (error) {
      console.error("Error fetching friends:", error);
      res.status(500).send("Ошибка при получении списка друзей");
    }
  });

  app.post("/api/friends", isAuthenticated, async (req, res) => {
    try {
      const { birthDate, ...friendData } = req.body;
      
      const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
      const zodiacSignData = getZodiacSign(new Date(birthDateObj));
      
      const newFriend = await storage.createFriend({
        name: friendData.name,
        gender: friendData.gender,
        email: friendData.email || '',
        userId: req.user!.id,
        birthDate: birthDateObj.toISOString().split('T')[0],
        zodiacSign: zodiacSignData.name,
      });
      
      res.status(201).json(newFriend);
    } catch (error) {
      console.error("Error creating friend:", error);
      res.status(500).send("Ошибка при добавлении друга");
    }
  });

  // API для работы с гороскопами - ИСПРАВЛЕННАЯ ВЕРСИЯ
  app.get("/api/horoscope", async (req, res) => {
    try {
      const { period = "today", category = "general" } = req.query;
      const testUserId = 1;
      const testZodiacSign = "capricorn";

      const existingHoroscope = await storage.getActualHoroscope(
        testUserId, 
        period as string, 
        category as string
      );

      if (existingHoroscope) {
        return res.json({
          content: existingHoroscope.content,
          luckyNumbers: existingHoroscope.luckyNumbers,
          compatibleSigns: existingHoroscope.compatibleSigns,
          lastUpdated: format(new Date(existingHoroscope.createdAt), 'd MMMM', { locale: ru })
        });
      }

      const content = await generateHoroscope(
        testUserId, 
        testZodiacSign, 
        period as string, 
        category as string
      );
      
      const luckyNumbers = getRandomNumbers(3, 1, 99);
      const compatibleSigns = getCompatibleSigns(testZodiacSign);
      
      const newHoroscope = await storage.createHoroscope({
        userId: testUserId,
        period: period as string,
        category: category as string,
        content,
        luckyNumbers,
        compatibleSigns,
        isActual: true
      });
      
      res.json({
        content: newHoroscope.content,
        luckyNumbers: newHoroscope.luckyNumbers,
        compatibleSigns: newHoroscope.compatibleSigns,
        lastUpdated: "сегодня"
      });
    } catch (error) {
      console.error("Error getting horoscope:", error);
      res.status(500).send("Ошибка при получении гороскопа");
    }
  });

  app.post("/api/horoscope/refresh", async (req, res) => {
    console.log("🔥🔥🔥 REFRESH ENDPOINT HIT - NEW VERSION!");
    console.log("🔥 Body:", JSON.stringify(req.body, null, 2));
    console.log("🔥 Headers:", JSON.stringify(req.headers, null, 2));
    console.log("🔥 User agent:", req.get('User-Agent'));
    console.log("🔥 Content-Type:", req.get('Content-Type'));
    
    try {
      // Простой тест без базы данных
      const content = await generateHoroscope(
        1, 
        "capricorn", 
        "today", 
        "general"
      );
      
      console.log("✅ Generated content:", content.substring(0, 100) + "...");
      
      res.json({
          content: content,
          luckyNumbers: [7, 14, 21],
          compatibleSigns: ["Дева", "Телец", "Рыбы"],
          lastUpdated: "сейчас"
      });
    } catch (error) {
      console.error("❌ Error:", error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // API для работы с картами Таро
  app.post("/api/tarot", isAuthenticated, async (req, res) => {
    try {
      console.log("🔮 TAROT API ENDPOINT HIT!");
      console.log("🔮 Request body:", JSON.stringify(req.body, null, 2));
      
      const { question, cardCount, category, preset } = req.body;
      
      // ✅ ВАЛИДАЦИЯ ВХОДНЫХ ДАННЫХ
      if (!question || !question.trim()) {
        return res.status(400).json({ error: "Необходимо описать ситуацию" });
      }
      
      if (!cardCount || (cardCount !== 3 && cardCount !== 5)) {
        return res.status(400).json({ error: "Количество карт должно быть 3 или 5" });
      }
      
      if (!category) {
        return res.status(400).json({ error: "Необходимо выбрать категорию" });
      }
      
      if (!preset) {
        return res.status(400).json({ error: "Необходимо выбрать пресет расклада" });
      }
      
      console.log(`🔮 Validated params: ${cardCount} cards, category: ${category}, preset: ${preset}`);
      
      // ✅ ПРОВЕРКА ЛИМИТОВ ПОДПИСКИ
      const subscriptionType = req.user!.subscriptionType;
      if (subscriptionType === "free") {
        if (cardCount > 3) {
          return res.status(403).json({ 
            error: "Требуется подписка для раскладов из 5 карт",
            code: "SUBSCRIPTION_REQUIRED" 
          });
        }
        
        const dailyUsage = await storage.getTodayApiUsageCount(req.user!.id, "tarot");
        if (dailyUsage >= 3) {
          return res.status(403).json({ 
            error: "Достигнут дневной лимит раскладов для бесплатного аккаунта",
            code: "DAILY_LIMIT_REACHED"
          });
        }
      } else if (subscriptionType === "basic") {
        const monthlyUsage = await storage.getMonthlyApiUsageCount(req.user!.id, "tarot");
        const limit = cardCount === 3 ? 10 : 5;
        if (monthlyUsage >= limit) {
          return res.status(403).json({ 
            error: `Достигнут месячный лимит ${limit} раскладов из ${cardCount} карт для базовой подписки`,
            code: "MONTHLY_LIMIT_REACHED"
          });
        }
      }
      
      console.log(`✅ Subscription check passed for ${subscriptionType} user`);
      
      // ✅ ГЕНЕРИРУЕМ РАСКЛАД С ПРАВИЛЬНЫМИ ПАРАМЕТРАМИ
      const readingSections = await generateTarotReading(
        req.user!.id, 
        question.trim(), 
        cardCount, 
        category,
        preset
      );

      console.log(`✅ Tarot reading generated successfully`);
      console.log(`🔍 Result structure:`, {
        readingLength: readingSections?.length,
        isArray: Array.isArray(readingSections)
      });

      // ✅ ВАЛИДАЦИЯ РЕЗУЛЬТАТА
      if (!readingSections || !Array.isArray(readingSections)) {
        console.error("❌ Invalid reading structure - not an array");
        return res.status(500).json({ error: "Ошибка в структуре расклада - неверный формат" });
      }
      
      const expectedSections = cardCount + 1; // карты + общий совет
      if (readingSections.length !== expectedSections) {
        console.warn(`⚠️ Wrong section count: got ${readingSections.length}, expected ${expectedSections}`);
      }

      // ✅ ПРОВЕРЯЕМ ЧТО ЭТО ПРАВИЛЬНАЯ СТРУКТУРА
      const isValidReadingStructure = readingSections.every(section => 
        section && 
        typeof section === 'object' &&
        section.title && typeof section.title === 'string' &&
        section.content && typeof section.content === 'string' &&
        section.content.length > 10
      );

      // Генерируем имена карт из секций (исключаем последнюю секцию - общие рекомендации)
      const cardSections = readingSections.slice(0, cardCount);
      const cards = cardSections.map(section => {
        // Извлекаем название карты из заголовка (после дефиса)
        const cardName = section.title.includes(' - ') ? 
          section.title.split(' - ')[1] : 
          `Карта ${cardSections.indexOf(section) + 1}`;
        return { name: cardName };
      });

      // ✅ ПРОВЕРЯЕМ СТРУКТУРУ КАРТ
      const isValidCardsStructure = cards.every(card =>
        card &&
        typeof card === 'object' &&
        card.name && typeof card.name === 'string'
      );
      
      if (!isValidReadingStructure) {
        console.error("❌ Invalid reading structure - sections invalid");
        return res.status(500).json({ error: "Ошибка в структуре расклада - неверная структура reading" });
      }
      
      if (!isValidCardsStructure) {
        console.error("❌ Invalid cards structure - cards invalid");
        return res.status(500).json({ error: "Ошибка в структуре расклада - неверная структура cards" });
      }
      
      // ✅ ВОЗВРАЩАЕМ РЕЗУЛЬТАТ В ПРАВИЛЬНОМ ФОРМАТЕ
      const response = {
        reading: readingSections,
        cards: cards,
        // Дополнительная отладочная информация
        meta: {
          requestedCards: cardCount,
          actualReadingSections: readingSections.length,
          actualCardsCount: cards.length,
          isValidCount: readingSections.length === expectedSections && cards.length === cardCount,
          category,
          preset
        }
      };
      
      console.log("✅ Sending response with structure:", {
        readingSections: response.reading.length,
        cardsCount: response.cards.length,
        isValid: response.meta.isValidCount
      });
      
      res.json(response);
      
    } catch (error) {
      console.error("❌ Error generating tarot reading:", error);
      
      // Возвращаем более информативные ошибки
      if (error instanceof Error) {
        if (error.message.includes("Слишком много запросов")) {
          return res.status(429).json({ error: error.message, code: "RATE_LIMIT" });
        } else if (error.message.includes("Ошибка авторизации")) {
          return res.status(401).json({ error: error.message, code: "AUTH_ERROR" });
        } else if (error.message.includes("Временные проблемы")) {
          return res.status(503).json({ error: error.message, code: "SERVICE_UNAVAILABLE" });
        }
      }
      
      res.status(500).json({ 
        error: "Ошибка при создании расклада карт",
        code: "INTERNAL_ERROR"
      });
    }
  });

  // API для работы с натальными картами
  // API для работы с натальными картами
  app.post("/api/natal-chart", isAuthenticated, async (req, res) => {
    try {
      console.log("🌟 Natal chart API called");
      const { type, name, birthDate, birthTime, birthPlace } = req.body;
      
      let userData: any = {};
      let analysisName: string = "";
      let analysisBirthDate: string = "";
      let analysisBirthTime: string = "";
      let analysisBirthPlace: string = "";
      
      if (type === "self") {
        analysisName = req.user!.name;
        analysisBirthDate = new Date(req.user!.birthDate).toISOString().split('T')[0];
        analysisBirthTime = req.user!.birthTime || "12:00";
        analysisBirthPlace = req.user!.birthPlace || "Москва";
        
        const userBirthDate = new Date(req.user!.birthDate);
        userData = {
          user_name: req.user!.name,
          birth_year: userBirthDate.getFullYear(),
          birth_month: userBirthDate.getMonth() + 1,
          birth_day: userBirthDate.getDate(),
          birth_hour: parseInt((req.user!.birthTime || "12:00").split(":")[0]),
          birth_minute: parseInt((req.user!.birthTime || "12:00").split(":")[1]),
          birth_city: req.user!.birthPlace || "Москва",
          birth_country_code: "RU"
        };
      } else {
        analysisName = name;
        analysisBirthDate = new Date(birthDate).toISOString().split('T')[0];
        analysisBirthTime = birthTime || "12:00";
        analysisBirthPlace = birthPlace || "Москва";
        
        const customBirthDate = new Date(birthDate);
        userData = {
          user_name: name,
          birth_year: customBirthDate.getFullYear(),
          birth_month: customBirthDate.getMonth() + 1,
          birth_day: customBirthDate.getDate(),
          birth_hour: parseInt((birthTime || "12:00").split(":")[0]),
          birth_minute: parseInt((birthTime || "12:00").split(":")[1]),
          birth_city: birthPlace || "Москва",
          birth_country_code: "RU"
        };
      }
      
      console.log("🌟 Prepared user data for Python:", userData);
      
      const pythonResult = await callPythonNatalChart(userData);
      console.log("🌟 Python result:", pythonResult);
      
      let analysis: Array<{title: string, content: string}> = [];
      try {
        const aiResult = await generateNatalChartAnalysis(
          req.user!.id,
          analysisName,
          analysisBirthDate,
          analysisBirthTime,
          analysisBirthPlace
        );
        analysis = aiResult.analysis;
        console.log("🌟 AI analysis generated");
      } catch (aiError) {
        console.error("🌟 AI analysis failed:", aiError);
        if (pythonResult.ai_prompt) {
          analysis = [{
            title: "Анализ натальной карты",
            content: pythonResult.ai_prompt
          }];
        }
      }
      
      const response = {
        analysis,
        chartData: {
          name: analysisName,
          birthDate: analysisBirthDate,
          birthTime: analysisBirthTime,
          birthPlace: analysisBirthPlace
        },
        success: pythonResult.success,
        type: type,
        svgFileName: pythonResult.svg_name,
        pythonSuccess: pythonResult.success,
        pythonError: pythonResult.error || null
      };
      
      console.log("🌟 Final response:", {
        analysisLength: analysis.length,
        svgFileName: pythonResult.svg_name,
        pythonSuccess: pythonResult.success
      });
      
      res.json(response);
      
    } catch (error) {
      console.error("🌟 Error generating natal chart:", error);
      res.status(500).json({
        error: "Ошибка при создании натальной карты",
        success: false,
        pythonSuccess: false
      });
    }
  });

  // 🔥🔥🔥 API ДЛЯ СОВМЕСТИМОСТИ - ИСПРАВЛЕННАЯ ВЕРСИЯ!
  app.post("/api/compatibility", isAuthenticated, async (req, res) => {
    console.log("🔍🔍🔍 COMPATIBILITY ENDPOINT HIT!!!");
    console.log("🔍 Timestamp:", new Date().toISOString());
    console.log("🔍 User ID:", req.user?.id);
    console.log("🔍 Request body:", JSON.stringify(req.body, null, 2));
    
    try {
      const { type, friendId, birthDate, name } = req.body;
      
      console.log("🔍 Parsed values:", { type, friendId, birthDate, name });
      
      const user = req.user!;
      let partnerData: any = {};
      
      if (type === "friend") {
        console.log("🔍 Processing friend compatibility, friendId:", friendId);
        const friend = await storage.getFriendById(parseInt(friendId));
        if (!friend) {
          console.log("❌ Friend not found:", friendId);
          return res.status(404).send("Друг не найден");
        }
        
        console.log("✅ Friend found:", friend.name);
        partnerData = {
          name: friend.name,
          zodiacSign: friend.zodiacSign,
          birthDate: new Date(friend.birthDate).toISOString().split('T')[0]
        };
      } else {
        console.log("🔍 Processing custom partner compatibility");
        const birthDateObj = new Date(birthDate);
        const zodiacSign = getZodiacSign(birthDateObj);
        
        console.log("🔍 Partner zodiac sign:", zodiacSign.name);
        
        partnerData = {
          name: name || "Партнер",
          zodiacSign: zodiacSign.name,
          birthDate: birthDateObj.toISOString().split('T')[0]
        };
      }
      
      console.log("🔍 Final partner data:", partnerData);
      
      // Calculate compatibility score
      const compatibilityScore = calculateCompatibility(user.zodiacSign, partnerData.zodiacSign);
      console.log("🔍 Compatibility score:", compatibilityScore);
      
      // Generate analysis
      console.log("🔍 Generating compatibility analysis...");
      const analysis = await generateCompatibilityAnalysis(
        user.id,
        {
          name: user.name,
          zodiacSign: user.zodiacSign,
          birthDate: new Date(user.birthDate).toISOString().split('T')[0]
        },
        partnerData,
        compatibilityScore
      );
      
      console.log("✅ Analysis generated successfully");
      
      const response = {
        compatibilityScore,
        analysis,
        partnerData
      };
      
      console.log("🔍 Sending response:", { 
        compatibilityScore, 
        analysisLength: analysis.length,
        partnerName: partnerData.name 
      });
      
      res.json(response);
    } catch (error) {
      console.error("❌ Error calculating compatibility:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : "No stack");
      res.status(500).send("Ошибка при расчёте совместимости");
    }
  });

  // API для подписок
  app.post("/api/subscription", isAuthenticated, async (req, res) => {
    try {
      const { planType } = req.body;
      
      const updatedUser = await storage.updateUserSubscription(req.user!.id, planType);
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating subscription:", error);
      res.status(500).send("Ошибка при обновлении подписки");
    }
  });

  console.log("🚀🚀🚀 ALL ROUTES REGISTERED SUCCESSFULLY!");
  console.log("🚀🚀🚀 Total routes registered at:", new Date().toISOString());

  const httpServer = createServer(app);
  return httpServer;
}