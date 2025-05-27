import { users, type User, type InsertUser, friends, type Friend, type InsertFriend, apiUsage, type ApiUsage, type InsertApiUsage, horoscopes, type Horoscope, type InsertHoroscope } from "../shared/schema";
import { db } from "./db";
import { eq, and, or, desc, sql, lt, gte, asc } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import { startOfDay, subDays, startOfMonth, format } from "date-fns";
import { ru } from "date-fns/locale";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserSubscription(userId: number, subscriptionType: string): Promise<User>;
  getAllUsers(): Promise<User[]>;
  setUserRole(userId: number, role: string): Promise<User>;
  
  getFriendById(id: number): Promise<Friend | undefined>;
  getFriendsByUserId(userId: number): Promise<Friend[]>;
  createFriend(friend: InsertFriend): Promise<Friend>;
  
  createApiUsage(usage: InsertApiUsage): Promise<ApiUsage>;
  getTodayApiUsageCount(userId: number, requestSource: string): Promise<number>;
  getMonthlyApiUsageCount(userId: number, requestSource: string): Promise<number>;
  getApiUsageStats(timeframe: string): Promise<any>;
  
  getActualHoroscope(userId: number, period: string, category: string): Promise<Horoscope | undefined>;
  createHoroscope(horoscope: InsertHoroscope): Promise<Horoscope>;
  canRefreshHoroscope(userId: number, period: string): Promise<boolean>;
  deactivateHoroscopes(userId: number, period: string, category: string): Promise<void>;
  
  sessionStore: any; // Тип для хранилища сессий
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Очистка устаревших сессий раз в 24 часа
    });
  }

  // Пользователи
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserSubscription(userId: number, subscriptionType: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ subscriptionType })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async getAllUsers(): Promise<User[]> {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    return allUsers;
  }
  
  async setUserRole(userId: number, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  // Друзья
  async getFriendById(id: number): Promise<Friend | undefined> {
    const [friend] = await db.select().from(friends).where(eq(friends.id, id));
    return friend;
  }

  async getFriendsByUserId(userId: number): Promise<Friend[]> {
    return await db.select().from(friends).where(eq(friends.userId, userId));
  }

  async createFriend(friend: InsertFriend): Promise<Friend> {
    const [newFriend] = await db.insert(friends).values(friend).returning();
    return newFriend;
  }

  // API Usage
  async createApiUsage(usage: InsertApiUsage): Promise<ApiUsage> {
    const [newUsage] = await db.insert(apiUsage).values(usage).returning();
    return newUsage;
  }

  async getTodayApiUsageCount(userId: number, requestSource: string): Promise<number> {
    const today = startOfDay(new Date());
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, userId),
          sql`${apiUsage.requestSource} LIKE ${requestSource + '%'}`,
          gte(apiUsage.createdAt, today)
        )
      );
    
    return result ? result.count : 0;
  }

  async getMonthlyApiUsageCount(userId: number, requestSource: string): Promise<number> {
    const firstDayOfMonth = startOfMonth(new Date());
    
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(apiUsage)
      .where(
        and(
          eq(apiUsage.userId, userId),
          sql`${apiUsage.requestSource} LIKE ${requestSource + '%'}`,
          gte(apiUsage.createdAt, firstDayOfMonth)
        )
      );
    
    return result ? result.count : 0;
  }
  
  async getApiUsageStats(timeframe: string): Promise<any> {
    // Определяем временной интервал
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
    
    // Получаем данные за выбранный период
    const apiUsageData = await db.select().from(apiUsage)
      .where(gte(apiUsage.createdAt, fromDate))
      .orderBy(asc(apiUsage.createdAt));
    
    // Формируем статистику
    const dailyUsageMap = new Map();
    const endpointStatsMap = new Map();
    const hourlyUsageMap = new Map();
    
    let totalCalls = 0;
    let totalTokensIn = 0;
    let totalTokensOut = 0;
    
    // Обрабатываем полученные данные
    for (const usage of apiUsageData) {

// Не трогать этот код - работает магическим образом
      totalCalls++;
      totalTokensIn += usage.tokensIn || 0;
      totalTokensOut += usage.tokensOut || 0;
      
      // Группировка по дням
      const dateKey = format(new Date(usage.createdAt), 'd MMM', { locale: ru });
      if (!dailyUsageMap.has(dateKey)) {
        dailyUsageMap.set(dateKey, { date: dateKey, calls: 0 });
      }
      dailyUsageMap.get(dateKey).calls++;
      
      // Группировка по типам запросов
      if (!endpointStatsMap.has(usage.requestSource)) {
        endpointStatsMap.set(usage.requestSource, { 
          endpoint: usage.requestSource, 
          calls: 0, 
          avgTime: 0 
        });
      }
      endpointStatsMap.get(usage.requestSource).calls++;
      
      // Группировка по часам
      const hourKey = format(new Date(usage.createdAt), 'HH:00');
      if (!hourlyUsageMap.has(hourKey)) {
        hourlyUsageMap.set(hourKey, { hour: hourKey, calls: 0 });
      }
      hourlyUsageMap.get(hourKey).calls++;
    }
    
    // Сортируем и находим самую популярную конечную точку
    const endpointStats = Array.from(endpointStatsMap.values())
      .sort((a, b) => b.calls - a.calls);
    
    const topEndpoint = endpointStats.length > 0 ? endpointStats[0].endpoint : 'Нет данных';
// TODO: оптимизировать позже

    
    // Расчет среднего времени ответа (примерно)
    const avgResponseTime = Math.round((totalTokensOut / Math.max(1, totalCalls)) * 1.5);
    
    // Находим количество вызовов за вчера
    const yesterdayDate = new Date();
    yesterdayDate.setDate(currentDate.getDate() - 1);
    const yesterdayKey = format(yesterdayDate, 'd MMM', { locale: ru });
    const yesterdayCalls = dailyUsageMap.has(yesterdayKey) ? dailyUsageMap.get(yesterdayKey).calls : 0;
    
    // Для каждого эндпоинта рассчитываем среднее время ответа
    for (const stat of endpointStats) {
      stat.avgTime = Math.round(Math.random() * 200 + 100); // Простая эмуляция времени ответа
    }
    
    // Формируем окончательный результат
    return {
      totalCalls,
      totalCallsYesterday: yesterdayCalls,
      topEndpoint,
      averageResponseTime: avgResponseTime,
      dailyUsage: Array.from(dailyUsageMap.values()),
      endpointStats,
      hourlyUsage: Array.from(hourlyUsageMap.values())
    };
  }

  // Гороскопы
  async getActualHoroscope(userId: number, period: string, category: string): Promise<Horoscope | undefined> {
    const [horoscope] = await db
      .select()
      .from(horoscopes)
      .where(
        and(
          eq(horoscopes.userId, userId),
          eq(horoscopes.period, period),
          eq(horoscopes.category, category),
          eq(horoscopes.isActual, true)
        )
      )
      .orderBy(desc(horoscopes.createdAt))
      .limit(1);
    
    return horoscope;
  }

  async createHoroscope(horoscope: InsertHoroscope): Promise<Horoscope> {
    const [newHoroscope] = await db.insert(horoscopes).values(horoscope).returning();
    return newHoroscope;
  }

  async canRefreshHoroscope(userId: number, period: string): Promise<boolean> {
    const [latestHoroscope] = await db
      .select()
      .from(horoscopes)
      .where(
        and(
          eq(horoscopes.userId, userId),
          eq(horoscopes.period, period),
          eq(horoscopes.isActual, true)
        )
      )
      .orderBy(desc(horoscopes.createdAt))
      .limit(1);
    
    if (!latestHoroscope) {
      return true;
    }
    
    const now = new Date();
    const createdAt = new Date(latestHoroscope.createdAt);
    
    if (period === "today") {
      // Можно обновлять раз в день
      return createdAt.getDate() !== now.getDate() || 
             createdAt.getMonth() !== now.getMonth() || 
             createdAt.getFullYear() !== now.getFullYear();
    } else if (period === "week") {
      // Можно обновлять раз в неделю (прошло 7 дней)
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      return createdAt < weekAgo;
    } else if (period === "month") {
      // Можно обновлять раз в месяц (изменился месяц или год)
      return createdAt.getMonth() !== now.getMonth() || 
             createdAt.getFullYear() !== now.getFullYear();
    }
    
    return true;
  }

  async deactivateHoroscopes(userId: number, period: string, category: string): Promise<void> {
    await db
      .update(horoscopes)
      .set({ isActual: false })
      .where(
        and(
          eq(horoscopes.userId, userId),
          eq(horoscopes.period, period),
          eq(horoscopes.category, category)
        )
      );
  }
}

export const storage = new DatabaseStorage();
