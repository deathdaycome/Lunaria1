import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { format } from "date-fns";
import { db } from "./db";
import * as schema from "@shared/schema";
import { pool } from "./db";

// Создаем и настраиваем Express приложение
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Добавляем логирование всех входящих запросов
app.use((req, res, next) => {
  log(`${req.method} ${req.path} from ${req.ip || 'unknown'}`);
  next();
});

// HEALTH CHECK РОУТЫ - ДО ВСЕГО ОСТАЛЬНОГО
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    app: 'Lunaria AI',
    port: process.env.PORT || 5000,
    env: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    urls: {
      health: '/health',
      api: '/api'
    }
  });
});

app.get('/', (req: Request, res: Response) => {
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
    // НЕ ЛОГИРУЕМ ОШИБКУ - просто пропускаем
  }
}

(async () => {
  let server: any = null;
  
  try {
    // ИСПРАВЛЕНИЕ 1: Присваиваем переменной NODE_ENV для корректной работы
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'production';
    }
    
    log(`🔧 Starting in ${process.env.NODE_ENV} mode`);
    log(`📊 Process ID: ${process.pid}`);
    log(`📊 Node version: ${process.version}`);
    
    // ИСПРАВЛЕНИЕ 2: Настройка Vite ДО регистрации маршрутов
    if (process.env.NODE_ENV === "development") {
      server = await setupVite(app, null);
    } else {
      // Для production сразу подключаем статические файлы
      serveStatic(app);
    }
    
    // ИСПРАВЛЕНИЕ 3: Регистрируем маршруты ПОСЛЕ настройки Vite
    await registerRoutes(app);
    
    // Запускаем заполнение базы данных знаками зодиака, если нужно
    await seedZodiacSignsIfNeeded();
    
    // Глобальный обработчик ошибок (ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ)
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Внутренняя ошибка сервера";
      
      res.status(status).json({ message });
    });
    
    // ИСПРАВЛЕНИЕ 4: Создаем HTTP сервер правильно
    const port = parseInt(process.env.PORT || '5000');
    const host = '0.0.0.0'; // ОБЯЗАТЕЛЬНО 0.0.0.0 для Docker
    
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
        setTimeout(async () => {
          try {
            log("🔍 Testing internal health check...");
            // Если есть fetch, используем его, иначе пропускаем
            if (typeof fetch !== 'undefined') {
              const response = await fetch(`http://localhost:${port}/health`);
              const data = await response.json();
              log(`✅ Internal health check OK: ${JSON.stringify(data)}`);
            } else {
              log("ℹ️  Skipping internal health check (fetch not available)");
            }
          } catch (error) {
            log(`❌ Internal health check failed: ${error}`);
          }
          
          log("✅ Приложение полностью инициализировано");
        }, 3000);
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
    
    // ИСПРАВЛЕНИЕ 5: Обработчики сигналов с лучшей логикой
    const gracefulShutdown = async (signal: string) => {
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
          process.exit(0);
        });
        
        // Принудительное закрытие через 15 секунд (увеличил время)
        setTimeout(() => {
          log('⚠️  Forcing shutdown after 15s');
          process.exit(1);
        }, 15000);
      } else {
        log('No server to close, exiting immediately');
        process.exit(0);
      }
    };
    
    // Регистрируем обработчики сигналов
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // ИСПРАВЛЕНИЕ 6: Обработка необработанных ошибок
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      log(`❌ Unhandled Rejection: ${reason}`);
    });
    
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      log(`❌ Uncaught Exception: ${error.message}`);
      // НЕ выходим немедленно, даём время для логирования
      setTimeout(() => process.exit(1), 100);
    });
    
    // Дополнительные обработчики событий процесса
    process.on('exit', (code) => {
      log(`📤 Process exiting with code: ${code}`);
    });
    
  } catch (error) {
    console.error("❌ Error starting application:", error);
    log(`❌ Fatal error starting application: ${error}`);
    process.exit(1);
  }
})();

// Export app for testing purposes
export default app;