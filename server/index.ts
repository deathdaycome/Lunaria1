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

// Заполняем базу данных знаками зодиака, если она пуста
async function seedZodiacSignsIfNeeded() {
  try {
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
    }
  } catch (error) {
    console.error("Error seeding zodiac signs:", error);
  }
}

(async () => {
  try {
    // Инициализируем маршруты и создаем HTTP сервер
    const server = await registerRoutes(app);
    
    // Health check endpoint для CapRover
    app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        app: 'Lunaria AI',
        port: process.env.PORT || 5000
      });
    });

    // Корневой роут
    app.get('/', (req: Request, res: Response) => {
      res.status(200).json({ 
        message: 'Lunaria AI is running',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      });
    });
    
    // Запускаем заполнение базы данных знаками зодиака, если нужно
    await seedZodiacSignsIfNeeded();
    
    // Глобальный обработчик ошибок
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error("Error:", err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Внутренняя ошибка сервера";
      
      res.status(status).json({ message });
    });
    
    // Настройка Vite для разработки или статических файлов для продакшена
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }
    
    // Запускаем сервер
    const port = parseInt(process.env.PORT) || 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`Приложение "Lunaria AI" запущено на порту ${port}`);
      log(`Health check доступен на http://0.0.0.0:${port}/health`);
    });
    
    // Очистка ресурсов при остановке приложения
    process.on('SIGTERM', async () => {
      log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        log('HTTP server closed');
      });
      
      try {
        await pool.end();
        log('Database connection closed');
      } catch (err) {
        console.error('Error closing database connection:', err);
      }
      
      process.exit(0);
    });
  } catch (error) {
    console.error("Error starting application:", error);
    process.exit(1);
  }
})();