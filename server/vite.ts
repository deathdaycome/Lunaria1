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

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Пробуем несколько вариантов путей
      const possiblePaths = [
        "/app/client/index.html",
        "/app/dist/client/index.html", 
        "./client/index.html",
        "./dist/client/index.html"
      ];
      
      let clientTemplate = "";
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          clientTemplate = testPath;
          break;
        }
      }
      
      if (!clientTemplate) {
        throw new Error("Could not find client template");
      }

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  console.log('=== DEBUG serveStatic ===');
  
  // Пробуем несколько возможных путей
  const possibleDistPaths = [
    "/app/dist/public",
    "/app/dist",
    "/app/public", 
    "/app/client/dist",
    "/app/build",
    "./dist/public",
    "./dist",
    "./public"
  ];
  
  let distPath = "";
  
  console.log('Checking possible paths:');
  for (const testPath of possibleDistPaths) {
    const exists = fs.existsSync(testPath);
    console.log(`- ${testPath}: ${exists}`);
    if (exists && !distPath) {
      distPath = testPath;
    }
  }
  
  if (!distPath) {
    console.log('Current working directory:', process.cwd());
    console.log('Files in CWD:', fs.readdirSync(process.cwd()));
    
    // Попробуем создать директорию и файл заглушку
    const fallbackPath = "/app/public";
    fs.mkdirSync(fallbackPath, { recursive: true });
    fs.writeFileSync(`${fallbackPath}/index.html`, `
      <!DOCTYPE html>
      <html>
        <head><title>Lunaria AI</title></head>
        <body><h1>Lunaria AI</h1><p>Application is starting...</p></body>
      </html>
    `);
    distPath = fallbackPath;
    console.log('Created fallback static directory:', distPath);
  }
  
  console.log('Using distPath:', distPath);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    const indexPath = `${distPath}/index.html`;
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send('Not Found');
    }
  });
}