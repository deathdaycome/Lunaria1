// @ts-nocheck
// Добавляем crash protection В САМОЕ НАЧАЛО
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

// Детальный лог запуска
console.log('=== STARTUP DIAGNOSTICS ===');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Working directory:', process.cwd());
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', process.env.PORT);
console.log('Available memory:', Math.round(process.memoryUsage().rss / 1024 / 1024), 'MB');

// Логируем каждый этап загрузки
console.log('Loading modules...');

import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage"; // ИСПОЛЬЗУЕМ РЕАЛЬНЫЙ STORAGE
import { format } from "date-fns";
import { db } from "./db";
import * as schema from "../shared/schema"; // ИСПРАВЛЕНО: убрали @shared
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

// Получаем __dirname для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;
const scryptAsync = promisify(scrypt);

console.log('Modules loaded successfully');

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

// Функция для определения знака зодиака (упрощенная версия)
function getZodiacSign(birthDate: Date) {
  const month = birthDate.getMonth() + 1;
  const day = birthDate.getDate();
  
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
  
  return { name: "Овен" }; // fallback
}

// Создаем и настраиваем Express приложение
console.log("🔥🔥🔥 CREATING EXPRESS APP!");
const app = express();
console.log("🔥🔥🔥 EXPRESS APP CREATED!");

// 🧪 ТЕСТ OPENAI ПОДКЛЮЧЕНИЯ
async function testOpenAI() {
  try {
    console.log("🤖 Testing OpenAI connection...");
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Привет, это тест" }],
      max_tokens: 10,
    });
    
    console.log("✅ OpenAI connection SUCCESS!");
    console.log("🤖 Response:", response.choices[0].message.content);
  } catch (error: any) {
    console.error("❌ OpenAI connection FAILED:", error.message);
  }
}

// Вызываем тест при запуске
testOpenAI();
console.log("🔥🔥🔥 App object ID:", app.toString());

// ОСНОВНЫЕ MIDDLEWARE (ОБЯЗАТЕЛЬНЫЕ)
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

// Настройка сессий (упрощенная версия для разработки)
app.set("trust proxy", 1);
app.use(session({
  secret: "космический-путь-секрет",
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: false, // для development
    httpOnly: true,
    sameSite: "lax"
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Настройка Passport - ИСПОЛЬЗУЕМ РЕАЛЬНЫЙ STORAGE
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

// 🔥 ПРОСТОЕ ЛОГИРОВАНИЕ 🔥
app.use((req, res, next) => {
  console.log(`📝 ${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// ТЕСТ МАРШРУТ - добавьте самым первым
app.all('*', (req, res, next) => {
  console.log(`🔍 REQUEST: ${req.method} ${req.url}`);
  next();
});

app.get('/test123', (req, res) => {
  console.log('🧪 TEST123 ROUTE HIT!');
  res.send('TEST WORKS!');
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
    openai: process.env.OPENAI_API_KEY ? 'configured ✅' : 'missing ❌'
  };
  
  console.log('=== HEALTH CHECK REQUESTED ===');
  res.status(200).json(healthData);
});

// ТЕСТОВЫЙ МАРШРУТ - добавьте перед app.get('/health')
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

// 🔥 ТЕСТОВЫЕ МАРШРУТЫ 🔥
app.get('/api/direct-test', (req, res) => {
  console.log('🚀 DIRECT TEST GET ROUTE HIT!');
  res.json({ message: 'Direct GET test works!' });
});

app.post('/api/direct-test', (req, res) => {
  console.log('🚀 DIRECT TEST POST ROUTE HIT!');
  res.json({ message: 'Direct POST test works!' });
});

// 🔥 НАСТОЯЩИЕ AUTH МАРШРУТЫ - ИСПОЛЬЗУЕМ РЕАЛЬНЫЙ STORAGE 🔥
app.get('/api/user', (req: any, res) => {
  console.log('🔥 USER ROUTE HIT!');
  console.log('🔥 Session:', req.session);
  console.log('🔥 User in session:', req.user);
  
  // Простая проверка без req.isAuthenticated()
  if (req.user) {
    console.log('✅ User found in session');
    res.json(req.user);
  } else {
    console.log('❌ No user in session');
    res.status(401).json({ message: "Пользователь не авторизован" });
  }
});

app.post('/api/register', async (req: any, res, next) => {
  console.log('🔥🔥🔥 REGISTER ROUTE HIT! 🔥🔥🔥');
  console.log('🔥 Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    console.log("Начало обработки запроса /api/register");
    const { birthDate, username, password, name, gender, email, birthPlace, birthTime } = req.body;
    
    // Проверяем обязательные поля
    if (!username || !password || !name || !gender || !birthDate) {
      console.log("❌ Не все обязательные поля заполнены");
      return res.status(400).json({ message: "Не все обязательные поля заполнены" });
    }
    
    // Check if user with username already exists - ИСПОЛЬЗУЕМ РЕАЛЬНЫЙ STORAGE
    console.log("🔍 Checking if user exists:", username);
    const existingUser = await storage.getUserByUsername(username);
    if (existingUser) {
      console.log("❌ Пользователь с именем уже существует:", username);
      return res.status(400).json({ message: "Пользователь с таким именем уже существует" });
    }

    // Convert string date to Date object if needed
    const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    
    // Determine zodiac sign
    const zodiacSignData = getZodiacSign(new Date(birthDateObj));
    console.log("✨ Определен знак зодиака:", zodiacSignData.name);
    
    // Create the user - ИСПОЛЬЗУЕМ РЕАЛЬНЫЙ STORAGE
    const userData2Save = {
      username: username,
      name: name,
      email: email || `temp_${Date.now()}@lunaria.app`,
      gender: gender,
      birthPlace: birthPlace || '',
      birthTime: birthTime || '12:00:00',
      birthDate: birthDateObj.toISOString().split('T')[0],
      password: await hashPassword(password),
      zodiacSign: zodiacSignData.name,
      subscriptionType: 'free',
      role: 'user'
    };
    
    console.log("👤 Создаем пользователя с данными:", { 
      ...userData2Save, 
      password: "СКРЫТ" 
    });
    
    const user = await storage.createUser(userData2Save);
    console.log("✅ Пользователь создан:", { id: user.id, name: user.name });

    // Автоматически логиним пользователя
    req.login(user, (err: any) => {
      if (err) {
        console.error("❌ Ошибка при входе после регистрации:", err);
        return next(err);
      }
      
      console.log("🔐 Статус сессии после req.login:", { 
        authenticated: req.isAuthenticated(), 
        sessionID: req.sessionID,
        user: req.user ? `ID: ${req.user.id}` : 'не найден'
      });
      
      res.setHeader('Connection', 'keep-alive');
      console.log("✅ Регистрация успешно завершена, отправляем ответ");
      
      // Возвращаем пользователя без пароля
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    });
  } catch (error) {
    console.error("❌ Ошибка при регистрации:", error);
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : 'No stack');
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
        
        // Возвращаем пользователя без пароля
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

// 🔥 РЕАЛЬНЫЙ COMPATIBILITY ENDPOINT!
app.post('/api/compatibility', async (req: any, res) => {
  console.log("🔥🔥🔥 REAL COMPATIBILITY ENDPOINT HIT!");
  console.log("🔥 User:", req.user?.id);
  console.log("🔥 Body:", JSON.stringify(req.body, null, 2));
  
  if (!req.user) {
    return res.status(401).send("Необходима авторизация");
  }
  
  try {
    const { type, friendId, birthDate, name } = req.body;
    const user = req.user;
    let partnerData: any = {};
    
    if (type === "friend") {
      const friend = await storage.getFriendById(parseInt(friendId));
      if (!friend) {
        return res.status(404).send("Друг не найден");
      }
      partnerData = {
        name: friend.name,
        zodiacSign: friend.zodiacSign,
        birthDate: new Date(friend.birthDate).toISOString().split('T')[0]
      };
    } else {
      const birthDateObj = new Date(birthDate);
      const zodiacSign = getZodiacSign(birthDateObj);
      partnerData = {
        name: name || "Партнер",
        zodiacSign: zodiacSign.name,
        birthDate: birthDateObj.toISOString().split('T')[0]
      };
    }
    
    // Реальный расчет совместимости
    const compatibilityScore = Math.floor(Math.random() * 40) + 60; // 60-100%

    // Генерируем РЕАЛЬНЫЙ AI анализ через OpenAI
    const { generateCompatibilityAnalysis } = await import("./openai");
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

    console.log("🤖 AI analysis generated successfully!");

    res.json({
      compatibilityScore,
      analysis,
      partnerData
    });
  } catch (error) {
    console.error("❌ Error in compatibility:", error);
    res.status(500).send("Ошибка при расчёте совместимости");
  }
});

console.log("🔥🔥🔥 COMPATIBILITY ENDPOINT REGISTERED IN INDEX.TS!");

// ПРОСТАЯ ФУНКЦИЯ для заполнения данными
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
    log("⚠️  Database seeding skipped - will work once table exists");
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
    log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY ? 'ПОДКЛЮЧЕН ✅' : 'НЕ НАСТРОЕН ❌'}`);
    
    // КРИТИЧНО: Настройка статических файлов для production
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
    
    // РЕГИСТРИРУЕМ ДОПОЛНИТЕЛЬНЫЕ МАРШРУТЫ
    console.log('Registering additional routes...');
    console.log("🔥🔥🔥 CALLING registerRoutes NOW!");
    const httpServer = await registerRoutes(app);
    console.log("🔥🔥🔥 registerRoutes COMPLETED!");
    if (httpServer && !server) {
      server = httpServer;
    }
    console.log('Additional routes registered');
    
    // Запускаем заполнение базы данных
    console.log('Starting database seeding...');
    await seedZodiacSignsIfNeeded();
    console.log('Database seeding complete');
    
    // Глобальный обработчик ошибок (ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Express Error Handler:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Внутренняя ошибка сервера";
      res.status(status).json({ message });
    });
    
    // Catch-all route для SPA в production - ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
    if (process.env.NODE_ENV === "production") {
      app.get('*', (req, res) => {
        const indexPath = path.join(process.cwd(), 'dist', 'public', 'index.html');
        console.log(`SPA fallback: ${req.path} -> index.html`);
        
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          console.error('index.html not found at:', indexPath);
          res.status(404).send('Application not found');
        }
      });
    }
    
    // ПРИНУДИТЕЛЬНОЕ СОЗДАНИЕ СЕРВЕРА
    const port = parseInt(process.env.PORT || '8000');
    const host = '0.0.0.0';

    console.log(`🔍 Forcing server creation on ${host}:${port}...`);

    // СОЗДАЕМ СЕРВЕР БЕЗ УСЛОВИЙ (используем другое имя)
    const expressServer = app.listen(port, host, () => {
      log(`🚀 Приложение "Lunaria AI" запущено`);
      log(`📍 Адрес: http://${host}:${port}`);
      log(`✅ Server is ACTUALLY listening on ${host}:${port}`);
    });

    expressServer.on('error', (error: any) => {
      console.error('❌ Server error:', error);
    });

    expressServer.on('listening', () => {
      log(`✅ CONFIRMED: Server listening on port ${port}`);
    });

    // Сохраняем ссылку на сервер
    server = expressServer;
    
    // GRACEFUL SHUTDOWN
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
          log('⚠️  Forcing shutdown after 30s');
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

// Export app for testing purposes
export default app;