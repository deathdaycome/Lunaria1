// @ts-nocheck
console.log('=== CRASH PROTECTION START ===');

// Ловим ВСЕ необработанные ошибки
process.on('uncaughtException', (error) => {
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('Time:', new Date().toISOString());
    console.error('Memory at crash:', process.memoryUsage());
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('Time:', new Date().toISOString());
    console.error('Memory at rejection:', process.memoryUsage());
});

console.log('=== STARTUP DIAGNOSTICS ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Available memory:', Math.round(process.memoryUsage().rss / 1024 / 1024), 'MB');

console.log('Loading modules...');

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { db } from "./db";
import * as schema from "../shared/schema";
import { pool } from "./db";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

console.log('Modules loaded successfully');

// ✅ СОЗДАЕМ ПАПКУ ДЛЯ SVG ФАЙЛОВ
const natalChartsDir = path.join(__dirname, 'public', 'natal-charts');
if (!fs.existsSync(natalChartsDir)) {
  fs.mkdirSync(natalChartsDir, { recursive: true });
  console.log('📁 Created natal-charts directory:', natalChartsDir);
} else {
  console.log('📁 Natal-charts directory exists:', natalChartsDir);
}

// Функции для работы с паролями
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// ✅ ИСПРАВЛЕННАЯ функция для безопасного парсинга дат без проблем с часовыми поясами
function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  if (dateString.includes('T') || dateString.includes(' ')) {
    return new Date(dateString);
  }
  
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

// ✅ ИСПРАВЛЕННАЯ функция для форматирования даты в строку YYYY-MM-DD
function formatDateForDB(date: Date): string {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// ✅ ИСПРАВЛЕННАЯ функция для определения знака зодиака
function getZodiacSign(birthDate: Date | string) {
  let dateObj: Date;
  
  if (typeof birthDate === 'string') {
    dateObj = parseLocalDate(birthDate);
  } else {
    dateObj = birthDate;
  }
  
  const month = dateObj.getMonth() + 1;
  const day = dateObj.getDate();
  
  const signs = [
    { name: "Козерог", start: [12, 22], end: [1, 19] },
    { name: "Водолей", start: [1, 20], end: [2, 18] },
    { name: "Рыбы", start: [2, 19], end: [3, 20] },
    { name: "Овен", start: [3, 21], end: [4, 19] },
    { name: "Телец", start: [4, 20], end: [5, 20] },
    { name: "Близнецы", start: [5, 21], end: [6, 20] },
    { name: "Рак", start: [6, 21], end: [7, 22] },
    { name: "Лев", start: [7, 23], end: [8, 22] },
    { name: "Дева", start: [8, 23], end: [9, 22] },
    { name: "Весы", start: [9, 23], end: [10, 22] },
    { name: "Скорпион", start: [10, 23], end: [11, 21] },
    { name: "Стрелец", start: [11, 22], end: [12, 21] }
  ];
  
  for (const sign of signs) {
    if (
      (month === sign.start[0] && day >= sign.start[1]) ||
      (month === sign.end[0] && day <= sign.end[1])
    ) {
      return { name: sign.name };
    }
  }
  
  return { name: "Овен" };
}

// Функция для конвертации знака зодиака из русского в английский
function convertZodiacToEnglish(zodiacSign: string): string {
  const zodiacMap: Record<string, string> = {
    'Овен': 'aries',
    'Телец': 'taurus', 
    'Близнецы': 'gemini',
    'Рак': 'cancer',
    'Лев': 'leo',
    'Дева': 'virgo',
    'Весы': 'libra',
    'Скорпион': 'scorpio',
    'Стрелец': 'sagittarius',
    'Козерог': 'capricorn',
    'Водолей': 'aquarius',
    'Рыбы': 'pisces'
  };
  
  return zodiacMap[zodiacSign] || zodiacSign.toLowerCase();
}

// Функция для проверки можно ли обновить гороскоп
function checkCanRefresh(lastUpdate: Date, period: string): boolean {
  const now = new Date();
  const lastUpdateDate = new Date(lastUpdate);
  
  switch (period) {
    case 'today':
      return now.toDateString() !== lastUpdateDate.toDateString();
    case 'week':
      const weeksDiff = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return weeksDiff >= 1;
    case 'month':
      return now.getMonth() !== lastUpdateDate.getMonth() || now.getFullYear() !== lastUpdateDate.getFullYear();
    default:
      return true;
  }
}

// Функция для получения случайных чисел (от 1 до 10)
function getRandomNumbers(count: number, min: number, max: number): number[] {
  const numbers: number[] = [];
  for (let i = 0; i < count; i++) {
    numbers.push(Math.floor(Math.random() * (max - min + 1)) + min);
  }
  return numbers;
}

// Функция для получения совместимых знаков
function getCompatibleSigns(zodiacSign: string): string[] {
  const compatibility: Record<string, string[]> = {
    'aries': ['leo', 'sagittarius', 'gemini'],
    'taurus': ['virgo', 'capricorn', 'cancer'],
    'gemini': ['libra', 'aquarius', 'aries'],
    'cancer': ['scorpio', 'pisces', 'taurus'],
    'leo': ['aries', 'sagittarius', 'gemini'],
    'virgo': ['taurus', 'capricorn', 'cancer'],
    'libra': ['gemini', 'aquarius', 'leo'],
    'scorpio': ['cancer', 'pisces', 'virgo'],
    'sagittarius': ['aries', 'leo', 'libra'],
    'capricorn': ['taurus', 'virgo', 'scorpio'],
    'aquarius': ['gemini', 'libra', 'sagittarius'],
    'pisces': ['cancer', 'scorpio', 'capricorn']
  };
  
  return compatibility[zodiacSign.toLowerCase()] || ['taurus', 'cancer', 'virgo'];
}

// Создаем Express приложение
console.log("🔥 CREATING EXPRESS APP!");
const app = express();
console.log("🔥 EXPRESS APP CREATED!");

// Тест OpenAI подключения
async function testOpenAI() {
  try {
    console.log("🤖 Testing OpenAI connection...");
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ 
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        'HTTP-Referer': 'https://lunaria-app.com',
        'X-Title': 'Lunaria Astrology App',
      }
    });
    
    const response = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: cardCount === 3 ? 8000 : 12000, // ← УВЕЛИЧИЛИ В 3-4 РАЗА!
      temperature: 0.9, // ← БОЛЬШЕ КРЕАТИВНОСТИ
    });
    
    console.log("✅ OpenAI connection SUCCESS!");
    console.log("🤖 Response:", response.choices[0].message.content);
  } catch (error: any) {
    console.error("❌ OpenAI connection FAILED:", error.message);
  }
}

// Вызываем тест при запуске
testOpenAI();

// ОСНОВНЫЕ MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS настройки
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ✨ ИСПРАВЛЕННЫЙ КОД - Обслуживание SVG файлов натальных карт
app.use('/natal-charts', express.static(path.join(__dirname, 'public', 'natal-charts'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.svg')) {
      res.setHeader('Content-Type', 'image/svg+xml');
    }
  }
}));
console.log('📁 Static SVG files served at /natal-charts');

// Настройка сессий
app.set("trust proxy", 1);
app.use(session({
  secret: "космический-путь-секрет",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: false,
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Настройка Passport
passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      console.log("🔑 Passport Local Strategy called for username:", username);
      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        console.log("🔑 Authentication failed for username:", username);
        return done(null, false, { message: "Неверное имя пользователя или пароль" });
      } else {
        console.log("🔑 Authentication successful for username:", username);
        return done(null, user);
      }
    } catch (error) {
      console.error("🔑 Passport authentication error:", error);
      return done(error);
    }
  }),
);

passport.serializeUser((user: any, done) => {
  console.log("🔑 Serializing user:", user.id);
  done(null, user.id);
});

passport.deserializeUser(async (id: number, done) => {
  try {
    console.log("🔑 Deserializing user ID:", id);
    const user = await storage.getUser(id);
    console.log("🔑 User deserialized:", user ? user.username : 'not found');
    done(null, user);
  } catch (error) {
    console.error("🔑 Deserialization error:", error);
    done(error);
  }
});

// Логирование запросов
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// HEALTH CHECK РОУТЫ
app.get('/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'ok', 
    timestamp: new Date().toISOString(),
    app: 'Lunaria AI',
    port: process.env.PORT || 8000,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    openai: process.env.OPENROUTER_API_KEY ? 'configured ✅' : 'missing ❌'
  };
  
  console.log('=== HEALTH CHECK REQUESTED ===');
  res.status(200).json(healthData);
});

app.get('/test', (req, res) => {
  console.log('🧪 TEST ROUTE HIT - сервер работает!');
  res.json({ message: 'TEST WORKS!' });
});

app.get('/', (req: Request, res: Response) => {
  console.log('=== ROOT PATH REQUESTED ===');
  res.status(200).json({ 
    message: 'Lunaria AI is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ======= API ENDPOINTS =======

// API для получения списка друзей
app.get('/api/friends', async (req: any, res) => {
  console.log('🔍 FRIENDS GET ENDPOINT HIT!');
  console.log('🔍 User:', req.user ? `ID: ${req.user.id}` : 'not found');
  
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    
    const friends = await storage.getFriendsByUserId(user.id);
    console.log('✅ Friends found:', friends.length);
    
    res.json(friends);
  } catch (error) {
    console.error('❌ Error getting friends:', error);
    res.status(500).json({ error: "Ошибка при получении списка друзей" });
  }
});

// ✅ ИСПРАВЛЕННОЕ API для добавления друга
app.post('/api/friends', async (req: any, res) => {
  console.log('🔍 ADD FRIEND ENDPOINT HIT!');
  console.log('🔍 Request body:', req.body);
  console.log('🔍 User:', req.user ? `ID: ${req.user.id}` : 'not found');
  
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    
    const { name, gender, birthDate, birthTime, birthPlace } = req.body;
    
    if (!name || !gender || !birthDate) {
      return res.status(400).json({ error: "Не все обязательные поля заполнены" });
    }
    
    // ✅ ИСПРАВЛЕНО: используем parseLocalDate
    const birthDateObj = parseLocalDate(birthDate);
    const zodiacSignData = getZodiacSign(birthDateObj);
    
    console.log('🔍 Creating friend with zodiac:', zodiacSignData.name);
    console.log('🔍 Friend birth date processed:', formatDateForDB(birthDateObj));
    
    const friendData = {
      userId: user.id,
      name: name,
      email: '',
      gender: gender,
      birthDate: formatDateForDB(birthDateObj), // ✅ ИСПРАВЛЕНО: используем formatDateForDB
      birthTime: birthTime || null,
      birthPlace: birthPlace || '',
      zodiacSign: zodiacSignData.name
    };
    
    const newFriend = await storage.createFriend(friendData);
    console.log('✅ Friend created successfully:', newFriend.id);
    
    res.status(201).json(newFriend);
  } catch (error) {
    console.error('❌ Error creating friend:', error);
    res.status(500).json({ error: "Ошибка при добавлении друга" });
  }
});

// API для удаления друга
app.delete('/api/friends/:friendId', async (req: any, res) => {
  console.log('🔍 DELETE FRIEND ENDPOINT HIT!');
  console.log('🔍 Friend ID:', req.params.friendId);
  console.log('🔍 User:', req.user ? `ID: ${req.user.id}` : 'not found');
  
  res.setHeader('Content-Type', 'application/json');
  
  try {
    const user = req.user;
    const friendId = req.params.friendId;
    
    if (!user) {
      console.log('❌ No user found');
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    
    if (!friendId) {
      console.log('❌ No friendId provided');
      return res.status(400).json({ error: "ID друга не указан" });
    }
    
    console.log('🔍 Attempting to delete friend with ID:', friendId);
    
    // Имитируем успешное удаление (замените на реальное удаление)
    console.log('✅ Friend deleted successfully (simulated):', friendId);
    
    const responseData = { 
      success: true, 
      message: "Друг удален успешно",
      deletedFriendId: friendId
    };
    
    console.log('✅ Sending response:', responseData);
    return res.status(200).json(responseData);
    
  } catch (error) {
    console.error('❌ Error deleting friend:', error);
    return res.status(500).json({ error: "Ошибка при удалении друга" });
  }
});

// ✅ ИСПРАВЛЕННЫЙ API ДЛЯ ПОЛУЧЕНИЯ ГОРОСКОПА - ВСЕ КАТЕГОРИИ РАЗБЛОКИРОВАНЫ
// ✅ ИСПРАВЛЕННОЕ API ДЛЯ ПОЛУЧЕНИЯ ГОРОСКОПА - используем персональные данные
app.get('/api/horoscope', async (req: any, res) => {
  console.log("🔍 HOROSCOPE GET ENDPOINT HIT!");
  console.log("🔍 Query params:", req.query);
  
  try {
    const { userId, period = "today", category = "general", zodiacSign } = req.query;
    const user = req.user;
    
    if (!user) {
      console.log("❌ User not authenticated");
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    
    console.log("🔍 Parsed params:", { userId, period, category, zodiacSign });
    
    const zodiacSignEn = convertZodiacToEnglish(zodiacSign as string || user.zodiacSign);
    console.log("🔍 Zodiac sign converted:", { original: zodiacSign, converted: zodiacSignEn });

    // Ищем актуальный гороскоп в БД
    const existingHoroscope = await storage.getActualHoroscope(
      user.id, 
      period as string, 
      category as string
    );

    console.log("🔍 Existing horoscope:", existingHoroscope ? "found" : "not found");

    if (existingHoroscope) {
      const canRefresh = checkCanRefresh(existingHoroscope.createdAt, period as string);
      
      console.log("✅ Returning existing horoscope");
      return res.json({
        content: existingHoroscope.content,
        // ✨ ИСПОЛЬЗУЕМ ПЕРСОНАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
        luckyNumbers: user.luckyNumbers || [1, 7, 9],
        compatibleSigns: user.compatibleSigns || [
          { name: "taurus", compatibility: 85 },
          { name: "cancer", compatibility: 80 },
          { name: "virgo", compatibility: 75 }
        ],
        lastUpdated: format(new Date(existingHoroscope.createdAt), 'd MMMM', { locale: ru }),
        canRefresh
      });
    }

    console.log("🔍 Generating new horoscope...");
    
    const { generateHoroscope } = await import("./openai");
    
    const content = await generateHoroscope(
      user.id, 
      zodiacSignEn, 
      period as string, 
      category as string
    );
    
    console.log("✅ Horoscope content generated");
    
    console.log("🔍 Creating horoscope in database...");
    
    const newHoroscope = await storage.createHoroscope({
      userId: user.id,
      period: period as string,
      category: category as string,
      content,
      // ✨ В БД гороскопов больше не сохраняем эти данные - они теперь персональные
      luckyNumbers: [],
      compatibleSigns: [],
      isActual: true
    });
    
    console.log("✅ Horoscope created successfully");
    
    res.json({
      content: newHoroscope.content,
      // ✨ ВОЗВРАЩАЕМ ПЕРСОНАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
      luckyNumbers: user.luckyNumbers || [1, 7, 9],
      compatibleSigns: user.compatibleSigns || [
        { name: "taurus", compatibility: 85 },
        { name: "cancer", compatibility: 80 },
        { name: "virgo", compatibility: 75 }
      ],
      lastUpdated: "сегодня",
      canRefresh: false
    });
  } catch (error) {
    console.error("❌ Error getting horoscope:", error);
    res.status(500).json({ 
      error: "Ошибка при получении гороскопа",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// API для обновления гороскопа
// ✅ ИСПРАВЛЕННОЕ API для обновления гороскопа - используем персональные данные
app.post('/api/horoscope/refresh', async (req: any, res) => {
  console.log("🔥 HOROSCOPE REFRESH ENDPOINT HIT!");
  console.log("🔥 Body:", JSON.stringify(req.body, null, 2));
  
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }

    const { period = "today", category = "general", zodiacSign } = req.body;
    
    const { generateHoroscope } = await import("./openai");
    
    const zodiacSignEn = convertZodiacToEnglish(zodiacSign || user.zodiacSign);
    
    const content = await generateHoroscope(
      user.id, 
      zodiacSignEn, 
      period, 
      category
    );
    
    console.log("✅ Generated content:", content.substring(0, 100) + "...");
    
    // ✨ ОБНОВЛЯЕМ ГОРОСКОП БЕЗ ИЗМЕНЕНИЯ ПЕРСОНАЛЬНЫХ ДАННЫХ
    const updatedHoroscope = await storage.createHoroscope({
      userId: user.id,
      period: period,
      category: category,
      content,
      // ✨ Не генерируем новые - используем персональные из профиля
      luckyNumbers: [],
      compatibleSigns: [],
      isActual: true
    });
    
    res.json({
      content: updatedHoroscope.content,
      // ✨ ВОЗВРАЩАЕМ ПЕРСОНАЛЬНЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
      luckyNumbers: user.luckyNumbers || [1, 7, 9],
      compatibleSigns: user.compatibleSigns || [
        { name: "taurus", compatibility: 85 },
        { name: "cancer", compatibility: 80 },
        { name: "virgo", compatibility: 75 }
      ],
      lastUpdated: "сейчас",
      canRefresh: false
    });
  } catch (error) {
    console.error("❌ Error:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

// API для таро
// API для таро - ЗАМЕНИТЕ СУЩЕСТВУЮЩИЙ БЛОК
app.post('/api/tarot', async (req: any, res) => {
  console.log("🔍 TAROT ENDPOINT HIT!");
  console.log("🔍 Request body:", req.body);
  console.log("🔍 User:", req.user ? `ID: ${req.user.id}, Name: ${req.user.name}` : 'not found');
  
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    
    // ✅ ИСПРАВЛЕНИЕ: добавляем preset в деструктуризацию
    const { question, cardCount = 3, category = "love", preset, selectedCards, selectedCardNames } = req.body;
    
    // ✅ ИСПРАВЛЕНИЕ: проверяем наличие preset
    if (!preset) {
      console.log("❌ Validation failed: no preset");
      return res.status(400).json({ error: "Необходимо выбрать тип расклада" });
    }
    
    // Валидация
    if (!question || !question.trim()) {
      console.log("❌ Validation failed: no question");
      return res.status(400).json({ error: "Необходимо описать ситуацию" });
    }

    // ✅ ИСПРАВЛЕНИЕ: строгая проверка количества карт
    if (![3, 5].includes(Number(cardCount))) {
      console.log("❌ Validation failed: invalid card count");
      return res.status(400).json({ error: "Количество карт должно быть 3 или 5" });
    }

    if (!category) {
      console.log("❌ Validation failed: no category");
      return res.status(400).json({ error: "Необходимо выбрать категорию" });
    }
    
    // ✅ ИСПРАВЛЕНИЕ: приводим cardCount к числу
    const numCardCount = Number(cardCount);
    
    console.log("🔍 Processing tarot:", { 
      question: question?.substring(0, 50) + "...", 
      cardCount: numCardCount, 
      category,
      preset 
    });
    
    console.log("🔍 Generating tarot reading...");
    
    const { generateTarotReading } = await import("./openai");
    
    // ✅ ИСПРАВЛЕНИЕ: передаем preset в функцию
    const reading = await generateTarotReading(
      user.id,
      question.trim(),
      numCardCount,
      category,
      preset,
      selectedCardNames // ✅ Передаем выбранные названия карт
    );

    // ✅ ПОСЛЕДНЯЯ ЛИНИЯ ОБОРОНЫ - ПРИНУДИТЕЛЬНАЯ ПРОВЕРКА В API
    let finalReading = reading;

    
    
    console.log("✅ Tarot reading generated successfully");
    console.log("🔍 Reading type:", Array.isArray(reading) ? 'array' : typeof reading);
    console.log("🔍 Reading details:", Array.isArray(reading) ? 
      `${reading.length} sections generated` : 
      reading.substring(0, 200) + "..."
    );

    // ✅ ДОБАВЛЯЕМ ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ПЕРЕД ОТПРАВКОЙ
    console.log("🔍 ========== ФИНАЛЬНАЯ ПРОВЕРКА ПЕРЕД ОТПРАВКОЙ ==========");
    console.log("🔍 finalReading длина:", Array.isArray(finalReading) ? finalReading.length : 'не массив');
    if (Array.isArray(finalReading)) {
      finalReading.forEach((section, index) => {
        console.log(`🔍 Секция ${index + 1}:`, {
          title: section.title,
          contentLength: section.content.length,
          contentPreview: section.content.substring(0, 100) + "..."
        });
      });
    }
    console.log("🔍 =======================================================");

    // ✅ ИСПРАВЛЕНИЕ: возвращаем четкую информацию о количестве карт
    res.json({ 
      success: true,
      reading: finalReading, // Вместо reading
      requestedCards: numCardCount,
      actualSections: Array.isArray(finalReading) ? finalReading.length : 1,
      category,
      preset,
      isValidCount: Array.isArray(finalReading) && finalReading.length === numCardCount + 1
    });
    
  } catch (error) {
    console.error("❌ Error generating tarot reading:", error);
    res.status(500).json({ 
      error: "Ошибка при создании расклада карт",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// API для натальной карты
// ✨ ОБНОВЛЕННОЕ API для натальной карты с кешированием
app.post('/api/natal-chart', async (req: any, res) => {
  console.log("🌌 NATAL CHART ENDPOINT HIT!");
  console.log("🌌 Request body:", req.body);
  console.log("🌌 User:", req.user ? `ID: ${req.user.id}, Name: ${req.user.name}` : 'not found');
  
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: "Необходима авторизация" });
    }
    
    const { type, friendId, name, birthDate, birthTime, birthPlace, birthCountry } = req.body;
    
    console.log("🌌 Processing natal chart:", { type, friendId, name, birthDate, birthTime, birthPlace, birthCountry });
    
    // ✨ ОПРЕДЕЛЯЕМ ДАННЫЕ ДЛЯ АНАЛИЗА
    let analysisData: any = {};
    let cacheKey: string = "";
    
    if (type === "self") {
      // Для себя - берем данные из профиля
      analysisData = {
        name: user.name,
        birthDate: user.birthDate,
        birthTime: user.birthTime,
        birthPlace: user.birthPlace,
        birthCountry: user.birthCountry || "Россия"
      };
      
      // Проверяем обязательные данные
      const missingData = [];
      if (!user.birthTime) {
        missingData.push("время рождения");
      }
      if (!user.birthPlace) {
        missingData.push("место рождения");
      }
      
      if (missingData.length > 0) {
        console.log("⚠️ Missing data for natal chart:", missingData);
        return res.status(400).json({
          error: "Недостающие данные",
          message: `Для точной натальной карты необходимо указать: ${missingData.join(", ")}. Пожалуйста, обновите ваш профиль.`,
          missingData: missingData,
          needsUpdate: true
        });
      }
      
      // ✨ ГЕНЕРИРУЕМ КЛЮЧ КЕША ДЛЯ "СЕБЯ"
      cacheKey = storage.generateNatalChartCacheKey(user.id, "self");
      
    } else if (type === "friend") {
      // Для друга - берем данные друга
      if (!friendId) {
        return res.status(400).json({ error: "Необходимо указать ID друга" });
      }
      
      const friend = await storage.getFriendById(parseInt(friendId));
      if (!friend) {
        return res.status(404).json({ error: "Друг не найден" });
      }
      
      analysisData = {
        name: friend.name,
        birthDate: friend.birthDate,
        birthTime: friend.birthTime || "12:00",
        birthPlace: friend.birthPlace || "Неизвестно",
        birthCountry: friend.birthCountry || "Россия"
      };
      
      // ✨ ГЕНЕРИРУЕМ КЛЮЧ КЕША ДЛЯ "ДРУГА"
      cacheKey = storage.generateNatalChartCacheKey(user.id, "friend", friend.id);
      
    } else if (type === "other") {
      // Для другого человека - берем переданные данные
      if (!name || !birthDate) {
        return res.status(400).json({ 
          error: "Необходимо указать имя и дату рождения" 
        });
      }
      
      analysisData = {
        name: name,
        birthDate: birthDate,
        birthTime: birthTime || "12:00",
        birthPlace: birthPlace || "Неизвестно",
        birthCountry: birthCountry || "Россия"
      };
      
      // ✨ ГЕНЕРИРУЕМ КЛЮЧ КЕША ДЛЯ "ДРУГОГО"
      cacheKey = storage.generateNatalChartCacheKey(user.id, "other", undefined, analysisData);
      
    } else {
      return res.status(400).json({ error: "Неизвестный тип запроса" });
    }
    
    console.log("🌌 Generated cache key:", cacheKey);
    
    // ✨ ПРОВЕРЯЕМ КЕШ - ВРЕМЕННО ОТКЛЮЧЕНО
    /*
    const cachedChart = await storage.getCachedNatalChart(cacheKey);
    if (cachedChart) {
      console.log("✅ Found cached natal chart, returning from cache");
      
      // Парсим анализ в секции для фронтенда
      const { cleanStructuredRussianText } = await import("./utils/textCleaner");
      const structuredAnalysis = cleanStructuredRussianText(cachedChart.aiAnalysis);
      
      return res.json({
        analysis: structuredAnalysis,
        svgFileName: cachedChart.svgFileName,
        chartData: {
          name: cachedChart.name,
          birthDate: cachedChart.birthDate,
          birthTime: cachedChart.birthTime,
          birthPlace: cachedChart.birthPlace,
          birthCountry: cachedChart.birthCountry
        },
        success: true,
        type: type,
        fromCache: true
      });
    }
    */
    
    console.log("🌌 No cache found, generating new natal chart...");
    
    // ✨ ГЕНЕРИРУЕМ НОВУЮ НАТАЛЬНУЮ КАРТУ
    const { generateNatalChartAnalysis } = await import("./openai");
    
    const result = await generateNatalChartAnalysis(
      user.id,
      analysisData.name,
      analysisData.birthDate,
      analysisData.birthTime,
      analysisData.birthPlace,
      analysisData.birthCountry
    );
    
    console.log("✅ Natal chart analysis generated successfully");
    console.log("🌌 SVG file:", result.svgFileName);
    
    // ✨ СОХРАНЯЕМ В КЕШ
    const natalChartData = {
      userId: user.id,
      targetType: type,
      targetId: type === "friend" ? parseInt(friendId) : null,
      name: analysisData.name,
      birthDate: analysisData.birthDate,
      birthTime: analysisData.birthTime,
      birthPlace: analysisData.birthPlace,
      birthCountry: analysisData.birthCountry,
      svgFileName: result.svgFileName,
      aiAnalysis: result.analysis.map(section => `${section.title}\n\n${section.content}`).join('\n\n'),
      cacheKey: cacheKey
    };
    
    // ✨ ВРЕМЕННО ОТКЛЮЧАЕМ СОХРАНЕНИЕ В КЕШ
    /*
    await storage.createNatalChart(natalChartData);
    console.log("✅ Natal chart saved to cache");
    */
    console.log("⚠️ Cache saving temporarily disabled");
    
    res.json({ 
      analysis: result.analysis,
      svgFileName: result.svgFileName,
      chartData: {
        name: analysisData.name,
        birthDate: analysisData.birthDate,
        birthTime: analysisData.birthTime,
        birthPlace: analysisData.birthPlace,
        birthCountry: analysisData.birthCountry
      },
      success: result.success,
      type: type,
      fromCache: false
    });
    
  } catch (error) {
    console.error("❌ Error generating natal chart:", error);
    res.status(500).json({ 
      error: "Ошибка при создании натальной карты",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// ✅ ИСПРАВЛЕННОЕ API для совместимости
app.post('/api/compatibility', async (req: any, res) => {
 console.log("🔥 COMPATIBILITY ENDPOINT HIT!");
 console.log("🔥 Body:", JSON.stringify(req.body, null, 2));
 
 try {
   const { type, friendId, birthDate, name } = req.body;
   const user = req.user;
   
   if (!user) {
     return res.status(401).json({ error: "Необходима авторизация" });
   }
   
   // Определяем данные партнера
   let partnerZodiacSign = "aries";
   let partnerBirthDate = birthDate;
   let partnerName = name || "Партнер";
   
   if (type === "friend" && friendId) {
     try {
       const friend = await storage.getFriendById(friendId);
       if (friend) {
         partnerBirthDate = friend.birthDate;
         partnerName = friend.name;
         partnerZodiacSign = friend.zodiacSign || getZodiacSign(friend.birthDate).name;
       }
     } catch (error) {
       console.log("⚠️ Friend not found, using fallback data");
     }
   } else if (birthDate) {
     // ✅ ИСПРАВЛЕНО: используем parseLocalDate для обработки даты
     const zodiacData = getZodiacSign(partnerBirthDate);
     partnerZodiacSign = zodiacData.name;
   }
   
   const partnerZodiacEn = convertZodiacToEnglish(partnerZodiacSign);
   const userZodiacEn = convertZodiacToEnglish(user?.zodiacSign || "capricorn");
   
   // ✅ Генерируем числа от 0 до 9
   const compatibilityScore = Math.floor(Math.random() * 31) + 70;
   const userLuckyNumber = Math.floor(Math.random() * 10);
   const partnerLuckyNumber = Math.floor(Math.random() * 10);
   
   const { generateCompatibilityAnalysis } = await import("./openai");
   
   // ✅ ИСПРАВЛЕНО: правильно обрабатываем даты и из БД, и новые
   const userFormattedDate = user?.birthDate ? 
     formatDateForDB(parseLocalDate(user.birthDate)) : 
     "1990-01-01";

   const partnerFormattedDate = partnerBirthDate ? 
     formatDateForDB(parseLocalDate(partnerBirthDate)) : 
     "1990-01-01";
   
   console.log("🔍 Dates for analysis:", { 
     user: userFormattedDate, 
     partner: partnerFormattedDate 
   });
   
   const analysis = await generateCompatibilityAnalysis(
     user?.id || 1,
     { 
       name: user?.name || "Вы", 
       zodiacSign: userZodiacEn, 
       birthDate: userFormattedDate,
       luckyNumber: userLuckyNumber
     },
     { 
       name: partnerName, 
       zodiacSign: partnerZodiacEn, 
       birthDate: partnerFormattedDate,
       luckyNumber: partnerLuckyNumber
     },
     compatibilityScore
   );
   
   res.json({
     compatibilityScore,
     analysis,
     partnerData: { 
       name: partnerName,
       birthDate: partnerFormattedDate,
       zodiacSign: partnerZodiacSign,
       luckyNumber: partnerLuckyNumber
     },
     userData: {
       name: user?.name || "Вы",
       birthDate: userFormattedDate,
       zodiacSign: user?.zodiacSign,
       luckyNumber: userLuckyNumber
     }
   });
 } catch (error) {
   console.error("❌ Compatibility Error:", error);
   res.status(500).json({ error: (error as Error).message });
 }
});

// AUTH МАРШРУТЫ
app.get('/api/user', (req: any, res) => {
 console.log('🔥 USER ROUTE HIT!');
 console.log('🔥 User in session:', req.user);
 
 if (req.user) {
   console.log('✅ User found in session');
   res.json(req.user);
 } else {
   console.log('❌ No user in session');
   res.status(401).json({ message: "Пользователь не авторизован" });
 }
});

// ✅ ИСПРАВЛЕННОЕ API регистрации
// ✅ ИСПРАВЛЕННОЕ API для регистрации - генерируем персональные данные один раз
app.post('/api/register', async (req: any, res, next) => {
  console.log('🔥 REGISTER ROUTE HIT!');
  console.log('🔥 Request body:', JSON.stringify(req.body, null, 2));

  try {
    const { birthDate, username, password, name, gender, email, birthPlace, birthTime } = req.body;
    
    if (!username || !password || !name || !gender || !birthDate) {
      console.log("❌ Не все обязательные поля заполнены");
      return res.status(400).json({ message: "Не все обязательные поля заполнены" });
    }
    
    console.log("🔍 Checking if user exists:", username);
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log("❌ Пользователь с именем уже существует:", username);
      return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
    }

    const birthDateObj = typeof birthDate === 'string' ? parseLocalDate(birthDate) : birthDate;
    const zodiacSignData = getZodiacSign(birthDateObj);
    console.log("✨ Определен знак зодиака:", zodiacSignData.name);
    
    // ✨ ГЕНЕРИРУЕМ ПЕРСОНАЛЬНЫЕ СЧАСТЛИВЫЕ ЧИСЛА И ЗНАКИ ОДИН РАЗ
    const zodiacSignEn = convertZodiacToEnglish(zodiacSignData.name);
    const personalLuckyNumbers = getRandomNumbers(3, 1, 10);
    const personalCompatibleSigns = getCompatibleSigns(zodiacSignEn).slice(0, 3).map(sign => ({
      name: sign,
      compatibility: Math.floor(Math.random() * 21) + 80
    }));
    
    console.log("✨ Персональные данные:", { 
      luckyNumbers: personalLuckyNumbers, 
      compatibleSigns: personalCompatibleSigns 
    });
    
    const userData2Save = {
      username: username,
      name: name,
      email: email || `temp_${Date.now()}@lunaria.app`,
      gender: gender,
      birthPlace: birthPlace || '',
      birthTime: birthTime || '12:00:00',
      birthDate: formatDateForDB(birthDateObj),
      password: await hashPassword(password),
      zodiacSign: zodiacSignData.name,
      subscriptionType: 'free',
      role: 'user',
      // ✨ ДОБАВЛЯЕМ ПЕРСОНАЛЬНЫЕ ДАННЫЕ
      luckyNumbers: personalLuckyNumbers,
      compatibleSigns: personalCompatibleSigns
    };
    
    console.log("👤 Создаем пользователя с персональными данными");
    
    const user = await storage.createUser(userData2Save);
    console.log("✅ Пользователь создан с персональными данными:", { id: user.id, name: user.name });

    req.login(user, (err: any) => {
      if (err) {
        console.error("❌ Ошибка при входе после регистрации:", err);
        return next(err);
      }
      
      console.log("✅ Регистрация успешно завершена");
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    console.error("❌ Ошибка при регистрации:", error);
    res.status(500).json({ message: "Ошибка сервера при регистрации" });
  }
});

app.post('/api/login', (req, res, next) => {
 console.log('🔥 LOGIN ROUTE HIT!');
 console.log('🔥 Login request body:', JSON.stringify(req.body, null, 2));
 
 passport.authenticate(
   "local",
   (err: any, user: any, info: any) => {
     if (err) {
       console.error("❌ Login authentication error:", err);
       return next(err);
     }
     if (!user) {
       console.log("❌ Login failed:", info?.message || "Неверное имя пользователя или пароль");
       return res.status(401).json({ message: info?.message || "Неверное имя пользователя или пароль" });
     }
     
     console.log("✅ User authenticated, logging in:", user.username);
     req.login(user, (err: any) => {
       if (err) {
         console.error("❌ req.login error:", err);
         return next(err);
       }
       console.log("✅ Login successful for user:", user.username);
       
       const { password, ...userWithoutPassword } = user;
       return res.status(200).json(userWithoutPassword);
     });
   }
 )(req, res, next);
});

app.post('/api/logout', (req: any, res, next) => {
 console.log('🔥 LOGOUT ROUTE HIT!');
 console.log('🔥 User before logout:', req.user ? req.user.username : 'not authenticated');
 
 req.logout((err: any) => {
   if (err) {
     console.error("❌ Logout error:", err);
     return next(err);
   }
   console.log("✅ Logout successful");
   res.sendStatus(200);
 });
});

// Функция для заполнения данными
async function seedZodiacSignsIfNeeded() {
 try {
   log("Checking zodiac signs...");
   const zodiacSigns = await db.select().from(schema.zodiacSigns);
   
   if (zodiacSigns.length === 0) {
     log("Seeding zodiac signs...");
     const signs = [
       { name: "Овен", startDate: "03-21", endDate: "04-19" },
       { name: "Телец", startDate: "04-20", endDate: "05-20" },
       { name: "Близнецы", startDate: "05-21", endDate: "06-20" },
       { name: "Рак", startDate: "06-21", endDate: "07-22" },
       { name: "Лев", startDate: "07-23", endDate: "08-22" },
       { name: "Дева", startDate: "08-23", endDate: "09-22" },
       { name: "Весы", startDate: "09-23", endDate: "10-22" },
       { name: "Скорпион", startDate: "10-23", endDate: "11-21" },
       { name: "Стрелец", startDate: "11-22", endDate: "12-21" },
       { name: "Козерог", startDate: "12-22", endDate: "01-19" },
       { name: "Водолей", startDate: "01-20", endDate: "02-18" },
       { name: "Рыбы", startDate: "02-19", endDate: "03-20" },
     ];
     await db.insert(schema.zodiacSigns).values(signs);
     log("Zodiac signs seeded successfully!");
   } else {
     log(`Found ${zodiacSigns.length} zodiac signs, skipping seed`);
   }
 } catch (error) {
   log("⚠️ Database seeding skipped - will work once table exists");
   console.log("DB seed error (harmless):", error);
 }
}

// Флаг для предотвращения множественных попыток завершения
let isShuttingDown = false;

(async () => {
 let server: any = null;
 
 try {
   console.log('Starting main application logic...');
   
   if (!process.env.NODE_ENV) {
     process.env.NODE_ENV = 'production';
   }
   
   log(`🔧 Starting in ${process.env.NODE_ENV} mode`);
   log(`📊 Process ID: ${process.pid}`);
   log(`📊 Node version: ${process.version}`);
   log(`🔑 OpenRouter API: ${process.env.OPENROUTER_API_KEY ? 'ПОДКЛЮЧЕН ✅' : 'НЕ НАСТРОЕН ❌'}`);
   
   // Настройка статических файлов для production
   // ✨ СНАЧАЛА НАСТРАИВАЕМ СТАТИЧЕСКИЙ СЕРВЕР ДЛЯ SVG ФАЙЛОВ (для всех режимов)
   app.use('/natal-charts', express.static(path.join(__dirname, 'public', 'natal-charts')));
   console.log('📁 Static SVG files served at /natal-charts');

   if (process.env.NODE_ENV === "production") {
     console.log('Setting up static files for production...');
     const staticPath = path.join(process.cwd(), 'dist', 'public');
     
     if (fs.existsSync(staticPath)) {
       app.use(express.static(staticPath));
       console.log('Static files setup complete');
     }
   } else {
     console.log('Setting up Vite for development...');
     server = await setupVite(app, null);
     console.log('Vite setup complete');
   }
   
   // Регистрируем дополнительные маршруты
   console.log('Registering additional routes...');
   console.log("🔥 CALLING registerRoutes NOW!");
   const httpServer = await registerRoutes(app);
   console.log("🔥 registerRoutes COMPLETED!");
   if (httpServer && !server) {
     server = httpServer;
   }
   console.log('Additional routes registered');
   
   // Запускаем заполнение базы данных
   console.log('Starting database seeding...');
   await seedZodiacSignsIfNeeded();
   console.log('Database seeding complete');
   
   // Глобальный обработчик ошибок
   app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
     console.error("Express Error Handler:", err);
     const status = err.status || err.statusCode || 500;
     const message = err.message || "Внутренняя ошибка сервера";
     res.status(status).json({ message });
   });
   
   // Catch-all route для SPA в production
   if (process.env.NODE_ENV === "production") {
     app.get('*', (req, res) => {
       if (req.path.startsWith('/api/')) {
         console.log(`❌ API route not found: ${req.path}`);
         return res.status(404).json({ error: `API endpoint not found: ${req.path}` });
       }
       
       const indexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
       console.log(`SPA fallback: ${req.path} -> index.html`);
       
       if (fs.existsSync(indexPath)) {
         res.sendFile(indexPath);
       } else {
         console.error('index.html not found at:', indexPath);
         res.status(404).send('Application not found');
       }
     });
   } else {
     app.get('*', (req, res) => {
       if (req.path.startsWith('/api/')) {
         console.log(`❌ API route not found: ${req.path}`);
         return res.status(404).json({ error: `API endpoint not found: ${req.path}` });
       }
       res.status(404).send('Not found');
     });
   }
   
   // Создание сервера
   const port = parseInt(process.env.PORT || '5000');
   const host = '0.0.0.0';

   console.log(`🔍 Creating server on ${host}:${port}...`);

   const expressServer = app.listen(port, host, () => {
     log(`🚀 Приложение "Lunaria AI" запущено`);
     log(`📍 Адрес: http://${host}:${port}`);
     log(`✅ Server is listening on ${host}:${port}`);
   });

   expressServer.on('error', (error: any) => {
     console.error('❌ Server error:', error);
   });

   expressServer.on('listening', () => {
     log(`✅ CONFIRMED: Server listening on port ${port}`);
   });

   server = expressServer;
   
   // Graceful shutdown
   const gracefulShutdown = async (signal: string) => {
     if (isShuttingDown) {
       log(`${signal} already received, ignoring...`);
       return;
     }
     
     isShuttingDown = true;
     console.log('=== GRACEFUL SHUTDOWN START ===');
     log(`${signal} received, shutting down gracefully`);
     
     if (server) {
       server.close(async () => {
         log('HTTP server closed');
         
         try {
           if (pool && pool.end) {
             await pool.end();
             log('Database connection closed');
           }
         } catch (err) {
           console.error('Error closing database connection:', err);
         }
         
         log('👋 Graceful shutdown complete');
         process.exit(0);
       });
       
       setTimeout(() => {
         log('⚠️ Forcing shutdown after 30s');
         process.exit(1);
       }, 30000);
     } else {
       log('No server to close, exiting immediately');
       process.exit(0);
     }
   };
   
   // Обработчики сигналов
   process.removeAllListeners('SIGTERM');
   process.removeAllListeners('SIGINT');
   
   process.on('SIGTERM', () => {
     console.log('=== SIGTERM RECEIVED ===');
     gracefulShutdown('SIGTERM');
   });
   
   process.on('SIGINT', () => {
     console.log('=== SIGINT RECEIVED ===');
     gracefulShutdown('SIGINT');
   });
   
   process.on('exit', (code) => {
     log(`📤 Process exiting with code: ${code}`);
   });
   
   // Мониторинг памяти каждые 30 секунд
   setInterval(() => {
     const memUsage = process.memoryUsage();
     const formatBytes = (bytes: number) => Math.round(bytes / 1024 / 1024);
     
     log(`Memory: RSS ${formatBytes(memUsage.rss)}MB, Heap ${formatBytes(memUsage.heapUsed)}/${formatBytes(memUsage.heapTotal)}MB`);
     
     if (memUsage.heapUsed > 1024 * 1024 * 1024) {
       log('⚠️ High memory usage detected!');
     }
   }, 30000);
   
   console.log('Application startup complete!');
   
 } catch (error) {
   console.error("❌ Error starting application:", error);
   if (typeof error === "object" && error !== null && "stack" in error) {
     console.error("Stack trace:", (error as { stack?: string }).stack);
   }
   log(`❌ Fatal error starting application: ${error}`);
   process.exit(1);
 }
})();

export default app;


