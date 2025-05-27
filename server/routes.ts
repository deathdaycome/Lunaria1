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

// Главная функция для регистрации маршрутов
export async function registerRoutes(app: Express): Promise<Server> {
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

  // API для работы с гороскопами
  app.get("/api/horoscope", isAuthenticated, async (req, res) => {
    try {
      const { period = "today", category = "general" } = req.query;

      const existingHoroscope = await storage.getActualHoroscope(
        req.user!.id, 
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
        req.user!.id, 
        req.user!.zodiacSign, 
        period as string, 
        category as string
      );
      
      const luckyNumbers = getRandomNumbers(3, 1, 99);
      const compatibleSigns = getCompatibleSigns(req.user!.zodiacSign);
      
      const newHoroscope = await storage.createHoroscope({
        userId: req.user!.id,
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

  app.post("/api/horoscope/refresh", isAuthenticated, async (req, res) => {
    try {
      const { period = "today", category = "general" } = req.body;
      
      const canRefresh = await storage.canRefreshHoroscope(req.user!.id, period as string);
      
      if (!canRefresh) {
        let message = "";
        if (period === "today") {
          message = `${req.user!.name}, гороскоп на текущий день для вас уже составлен. Вы можете обновить его завтра`;
        } else if (period === "week") {
          message = `${req.user!.name}, гороскоп на текущую неделю для вас уже составлен. Вы можете обновить его на следующей неделе`;
        } else if (period === "month") {
          message = `${req.user!.name}, гороскоп на текущий месяц для вас уже составлен. Вы можете обновить его в следующем месяце`;
        }
        return res.status(400).send(message);
      }
      
      await storage.deactivateHoroscopes(req.user!.id, period as string, category as string);
      
      const content = await generateHoroscope(
        req.user!.id, 
        req.user!.zodiacSign, 
        period as string, 
        category as string
      );
      
      const luckyNumbers = getRandomNumbers(3, 1, 99);
      const compatibleSigns = getCompatibleSigns(req.user!.zodiacSign);
      
      const newHoroscope = await storage.createHoroscope({
        userId: req.user!.id,
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
      console.error("Error refreshing horoscope:", error);
      res.status(500).send("Ошибка при обновлении гороскопа");
    }
  });

  // API для работы с картами Таро
  app.post("/api/tarot", isAuthenticated, async (req, res) => {
    try {
      const { question, cardCount, category, cardType } = req.body;
      
      const subscriptionType = req.user!.subscriptionType;
      if (subscriptionType === "free") {
        if (cardCount > 3) {
          return res.status(403).send("Требуется подписка для раскладов из 5 карт");
        }
        
        const dailyUsage = await storage.getTodayApiUsageCount(req.user!.id, "tarot");
        if (dailyUsage >= 3) {
          return res.status(403).send("Достигнут дневной лимит раскладов для бесплатного аккаунта");
        }
      } else if (subscriptionType === "basic") {
        const monthlyUsage = await storage.getMonthlyApiUsageCount(req.user!.id, "tarot");
        const limit = cardCount === 3 ? 10 : 5;
        if (monthlyUsage >= limit) {
          return res.status(403).send(`Достигнут месячный лимит ${limit} раскладов из ${cardCount} карт для базовой подписки`);
        }
      }
      
      const reading = await generateTarotReading(
        req.user!.id, 
        question, 
        cardCount, 
        category
      );
      
      res.json({ reading });
    } catch (error) {
      console.error("Error generating tarot reading:", error);
      res.status(500).send("Ошибка при создании расклада карт");
    }
  });

  // API для работы с натальными картами
  app.post("/api/natal-chart", isAuthenticated, async (req, res) => {
    try {
      const { type, name, birthDate, birthTime, birthPlace } = req.body;
      
      let analysis = "";
      if (type === "self") {
        analysis = await generateNatalChartAnalysis(
          req.user!.id,
          req.user!.name,
          new Date(req.user!.birthDate).toISOString().split('T')[0],
          req.user!.birthTime || undefined,
          req.user!.birthPlace || undefined
        );
      } else {
        analysis = await generateNatalChartAnalysis(
          req.user!.id,
          name,
          new Date(birthDate).toISOString().split('T')[0],
          birthTime || undefined,
          birthPlace || undefined
        );
      }
      
      res.json({ analysis });
    } catch (error) {
      console.error("Error generating natal chart:", error);
      res.status(500).send("Ошибка при создании натальной карты");
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