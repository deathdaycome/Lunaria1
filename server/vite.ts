import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server | null) {
  // ИСПРАВЛЕНИЕ 1: Проверяем NODE_ENV правильно
  if (process.env.NODE_ENV === "development") {
    const serverOptions = {
      middlewareMode: true,
      hmr: server ? { server } : false,
      // allowedHosts removed from here, will be set in the server property below
    };

    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          // НЕ завершаем процесс при ошибке в development
          // process.exit(1);
        },
      },
      server: {
        ...serverOptions,
        allowedHosts: true, // valid value for ServerOptions
      },
      appType: "custom",
    });

    app.use(vite.middlewares);
    
    // ИСПРАВЛЕНИЕ 2: Более простой обработчик для development
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;

      try {
        // Пробуем найти index.html в client директории
        const clientIndexPath = path.resolve(process.cwd(), "client", "index.html");
        
        if (!fs.existsSync(clientIndexPath)) {
          log(`Client index.html not found at ${clientIndexPath}`, "vite");
          return next();
        }

        let template = await fs.promises.readFile(clientIndexPath, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${nanoid()}"`,
        );
        const page = await vite.transformIndexHtml(url, template);
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        log(`Error in Vite middleware: ${e}`, "vite");
        next(e);
      }
    });
    
    return server; // Возвращаем существующий сервер
  }
  
  // В production ничего не делаем здесь
  return server;
}

export function serveStatic(app: Express) {
  log('=== DEBUG serveStatic ===');
  
  // ИСПРАВЛЕНИЕ 3: Более логичные пути для production
  const possibleDistPaths = [
    path.resolve(process.cwd(), "dist", "public"),     // ./dist/public
    path.resolve(process.cwd(), "dist"),               // ./dist (vite output)
    path.resolve(process.cwd(), "build"),              // ./build
    path.resolve(process.cwd(), "client", "dist"),     // ./client/dist
    "/app/dist/public",                                // Docker path
    "/app/dist",                                       // Docker path
    "/app/public",                                     // Docker path
  ];
  
  let distPath = "";
  
  log('Checking possible paths:');
  for (const testPath of possibleDistPaths) {
    const exists = fs.existsSync(testPath);
    log(`- ${testPath}: ${exists}`);
    if (exists && !distPath) {
      // ИСПРАВЛЕНИЕ 4: Проверяем что в директории есть файлы
      try {
        const files = fs.readdirSync(testPath);
        if (files.length > 0) {
          distPath = testPath;
          log(`  Found ${files.length} files in ${testPath}`);
        }
      } catch (err) {
        log(`  Error reading ${testPath}: ${err}`);
      }
    }
  }
  
  if (!distPath) {
    log('❌ No static files found!');
    log('Current working directory:', process.cwd());
    
    try {
      const cwdFiles = fs.readdirSync(process.cwd());
      log('Files in CWD:', cwdFiles.join(', '));
      
      // Проверяем есть ли dist директория
      if (cwdFiles.includes('dist')) {
        const distFiles = fs.readdirSync(path.join(process.cwd(), 'dist'));
        log('Files in dist:', distFiles.join(', '));
      }
    } catch (err) {
      log('Error reading directories: ' + (err instanceof Error ? err.message : String(err)));
    }
    
    // ИСПРАВЛЕНИЕ 5: Лучший fallback
    const fallbackPath = path.resolve(process.cwd(), "dist", "public");
    
    try {
      fs.mkdirSync(fallbackPath, { recursive: true });
      const fallbackHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lunaria AI</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { color: #666; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌙 Lunaria AI</h1>
        <p>Application is starting...</p>
        <div class="status">
            <p>⏰ Time: ${new Date().toLocaleString()}</p>
            <p>🔄 Status: Loading</p>
            <p><a href="/health">Health Check</a></p>
        </div>
    </div>
</body>
</html>`;
      
      fs.writeFileSync(path.join(fallbackPath, "index.html"), fallbackHtml);
      distPath = fallbackPath;
      log('✅ Created fallback static directory:', distPath);
    } catch (err) {
      log('❌ Error creating fallback directory: ' + (err instanceof Error ? err.message : String(err)));
    }
  }
  
  if (distPath) {
    log(`✅ Using distPath: ${distPath}`);
    
    // ИСПРАВЛЕНИЕ 6: Более надежное обслуживание статических файлов
    app.use(express.static(distPath, {
      index: ['index.html'],
      setHeaders: (res, filePath) => {
        // Кэширование для статических ресурсов
        if (filePath.endsWith('.js') || filePath.endsWith('.css')) {
          res.setHeader('Cache-Control', 'public, max-age=31536000');
        }
      }
    }));

    // SPA fallback - ДОЛЖЕН БЫТЬ ПОСЛЕДНИМ
    app.get("*", (req, res, next) => {
      // Пропускаем API маршруты
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      const indexPath = path.join(distPath, "index.html");
      
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        log(`❌ index.html not found at ${indexPath}`);
        res.status(404).json({
          error: "Application not found",
          path: req.path,
          message: "Please check if the build was successful"
        });
      }
    });
  } else {
    log('❌ No valid static directory found!');
    
    // Последний fallback
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      
      res.status(503).json({
        error: "Application not available",
        message: "Static files not found. Please check the build configuration.",
        timestamp: new Date().toISOString()
      });
    });
  }
}