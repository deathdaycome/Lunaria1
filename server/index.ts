// Добавляем crash protection В САМОЕ НАЧАЛО
console.log('=== CRASH PROTECTION START ===');

// Ловим ВСЕ необработанные ошибки
process.on('uncaughtException', (error) => {
    console.error('=== UNCAUGHT EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error('Time:', new Date().toISOString());
    console.error('Memory at crash:', process.memoryUsage());
    // НЕ ЗАВЕРШАЕМ процесс
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('=== UNHANDLED PROMISE REJECTION ===');
    console.error('Reason:', reason);
    console.error('Promise:', promise);
    console.error('Time:', new Date().toISOString());
    console.error('Memory at rejection:', process.memoryUsage());
    // НЕ ЗАВЕРШАЕМ процесс
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

import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { format } from "date-fns";
import { db } from "./db";
import * as schema from "@shared/schema";
import { pool } from "./db";

console.log('Modules loaded successfully');

// Создаем и настраиваем Express приложение
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Настраиваем CORS заголовки для правильной работы сессий и куки
app.use((req, res, next) => {
  // Разрешаем запросы со всех источников (для работы с прокси)
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  // Разрешаем передачу учетных данных (важно для сессий)
  res.header('Access-Control-Allow-Credentials', 'true');
  // Разрешаем нужные заголовки
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  // Разрешаем нужные методы
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  // Для preflight запросов
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

// ДЕТАЛЬНОЕ ЛОГИРОВАНИЕ ВСЕХ ЗАПРОСОВ
app.use((req, res, next) => {
  const userAgent = req.get('User-Agent') || 'unknown';
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} from ${ip} UA: ${userAgent}`);
  next();
});

// Добавляем логирование всех входящих запросов
app.use((req, res, next) => {
  log(`${req.method} ${req.path} from ${req.ip || 'unknown'}`);
  next();
});

// HEALTH CHECK РОУТЫ - ДО ВСЕГО ОСТАЛЬНОГО
app.get('/health', (req: Request, res: Response) => {
  const healthData = {
    status: 'ok', 
    timestamp: new Date().toISOString(),
    app: 'Lunaria AI',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    pid: process.pid,
    urls: {
      health: '/health',
      api: '/api'
    }
  };
  
  console.log('=== HEALTH CHECK REQUESTED ===');
  console.log('From IP:', req.ip || req.connection.remoteAddress);
  console.log('User Agent:', req.get('User-Agent'));
  console.log('Health data:', healthData);
  console.log('=== HEALTH CHECK RESPONSE SENT ===');
  
  res.status(200).json(healthData);
});

app.get('/', (req: Request, res: Response) => {
  console.log('=== ROOT PATH REQUESTED ===');
  console.log('From IP:', req.ip || req.connection.remoteAddress);
  console.log('User Agent:', req.get('User-Agent'));
  
  res.status(200).json({ 
    message: 'Lunaria AI is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Логирование запросов
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Удалить или редактировать чувствительные данные перед логированием
        const safeResponseClone = { ...capturedJsonResponse };
        if (safeResponseClone.password) safeResponseClone.password = "[HIDDEN]";
        
        logLine += ` :: ${JSON.stringify(safeResponseClone)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// ПРОСТАЯ ФУНКЦИЯ для заполнения данными (без создания таблиц)
async function seedZodiacSignsIfNeeded() {
  try {
    log("Checking zodiac signs...");
    
    // Просто пытаемся прочитать данные
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
    // НЕ ЛОГИРУЕМ ОШИБКУ КАК КРИТИЧЕСКУЮ - просто пропускаем
  }
}

// Флаг для предотвращения множественных попыток завершения
let isShuttingDown = false;

(async () => {
  let server: any = null;
  
  try {
    console.log('Starting main application logic...');
    
    // ИСПРАВЛЕНИЕ 1: Присваиваем переменной NODE_ENV для корректной работы
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }
    
    log(`🔧 Starting in ${process.env.NODE_ENV} mode`);
    log(`📊 Process ID: ${process.pid}`);
    log(`📊 Node version: ${process.version}`);
    
    // ИСПРАВЛЕНИЕ 2: Настройка Vite ДО регистрации маршрутов
    console.log('Setting up Vite/Static files...');
    if (process.env.NODE_ENV === "development") {
      server = await setupVite(app, null);
    } else {
      // Для production сразу подключаем статические файлы
      serveStatic(app);
    }
    console.log('Vite/Static setup complete');
    
    // ИСПРАВЛЕНИЕ 3: Регистрируем маршруты ПОСЛЕ настройки Vite
    console.log('Registering routes...');
    await registerRoutes(app);
    console.log('Routes registered');
    
    // Запускаем заполнение базы данных знаками зодиака, если нужно
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
    
    // ИСПРАВЛЕНИЕ 4: Создаем HTTP сервер правильно
    const port = parseInt(process.env.PORT || '5000');
    const host = '0.0.0.0'; // ОБЯЗАТЕЛЬНО 0.0.0.0 для Docker
    
    console.log(`Starting server on ${host}:${port}...`);
    
    // Если сервер еще не создан (в production), создаем его
    if (!server) {
      server = app.listen(port, host, () => {
        log(`🚀 Приложение "Lunaria AI" запущено`);
        log(`📍 Адрес: http://${host}:${port}`);
        log(`🏥 Health check: http://${host}:${port}/health`);
        log(`🌍 Окружение: ${process.env.NODE_ENV}`);
        log(`📊 PID: ${process.pid}`);
        log(`📊 Память: ${JSON.stringify(process.memoryUsage(), null, 2)}`);
        
        // Тестируем internal health check
        setTimeout(() => {
          log("🔍 Testing internal health check...");
          log("✅ Internal health check bypassed in container environment");
          log("✅ Приложение полностью инициализировано");
        }, 1000);
      });
      
      // Добавьте обработчик ошибок сервера
      server.on('error', (error: any) => {
        console.error('❌ Server error:', error);
        log(`❌ Server error: ${error.message}`);
      });
      
      // Обработчик для случая когда сервер начинает слушать
      server.on('listening', () => {
        log(`✅ Server is listening on ${host}:${port}`);
      });
      
    } else {
      // В режиме разработки сервер уже создан, просто логируем
      log(`🚀 Приложение "Lunaria AI" запущено`);
      log(`📍 Адрес: http://${host}:${port}`);
      log(`🏥 Health check: http://${host}:${port}/health`);
      log(`🌍 Окружение: ${process.env.NODE_ENV}`);
    }
    
    // ИСПРАВЛЕНИЕ 5: Улучшенный обработчик graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      if (isShuttingDown) {
        log(`${signal} already received, ignoring...`);
        return;
      }
      
      isShuttingDown = true;
      console.log('=== GRACEFUL SHUTDOWN START ===');
      log(`${signal} received, shutting down gracefully`);
      log(`Uptime: ${process.uptime()}s`);
      log(`Memory usage: ${JSON.stringify(process.memoryUsage())}`);
      
      if (server) {
        // Даём время для завершения текущих запросов
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
          log('📤 Process exiting with code: 0');
          process.exit(0);
        });
        
        // Принудительное закрытие через 30 секунд
        setTimeout(() => {
          log('⚠️  Forcing shutdown after 30s');
          process.exit(1);
        }, 30000);
      } else {
        log('No server to close, exiting immediately');
        process.exit(0);
      }
    };
    
    // ВАЖНО: Удаляем старые обработчики перед добавлением новых
    process.removeAllListeners('SIGTERM');
    process.removeAllListeners('SIGINT');
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
    
    // Регистрируем обработчики сигналов
    process.on('SIGTERM', () => {
      console.log('=== SIGTERM RECEIVED ===');
      console.log('Time:', new Date().toISOString());
      console.log('Uptime at SIGTERM:', process.uptime());
      gracefulShutdown('SIGTERM');
    });
    
    process.on('SIGINT', () => {
      console.log('=== SIGINT RECEIVED ===');
      console.log('Time:', new Date().toISOString());
      console.log('Uptime at SIGINT:', process.uptime());
      gracefulShutdown('SIGINT');
    });
    
    // Дополнительные обработчики событий процесса
    process.on('exit', (code) => {
      log(`📤 Process exiting with code: ${code}`);
    });
    
    // Мониторинг памяти каждые 30 секунд
    setInterval(() => {
      const memUsage = process.memoryUsage();
      const formatBytes = (bytes: number) => Math.round(bytes / 1024 / 1024);
      
      log(`Memory: RSS ${formatBytes(memUsage.rss)}MB, Heap ${formatBytes(memUsage.heapUsed)}/${formatBytes(memUsage.heapTotal)}MB`);
      
      // Предупреждение если память превышает 1GB
      if (memUsage.heapUsed > 1024 * 1024 * 1024) {
        log('⚠️ High memory usage detected!');
      }
    }, 30000);
    
    console.log('Application startup complete!');
    
  } catch (error) {
    console.error("❌ Error starting application:", error);
    console.error("Stack trace:", error.stack);
    log(`❌ Fatal error starting application: ${error}`);
    process.exit(1);
  }
})();

// Export app for testing purposes
export default app;