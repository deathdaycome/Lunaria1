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
      // Используем абсолютный путь от корня проекта
      const clientTemplate = path.resolve(process.cwd(), "client", "index.html");

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
  console.log('process.cwd():', process.cwd());
  
  // Используем абсолютный путь от корня проекта
  const distPath = path.resolve(process.cwd(), "dist", "public");
  console.log('distPath:', distPath);
  console.log('distPath exists:', fs.existsSync(distPath));

  if (!fs.existsSync(distPath)) {
    // Попробуем альтернативные пути
    const altPath1 = path.resolve(process.cwd(), "dist");
    const altPath2 = path.resolve(process.cwd(), "public");
    const altPath3 = path.resolve(process.cwd(), "client", "dist");
    
    console.log('Alternative paths:');
    console.log('- dist:', fs.existsSync(altPath1));
    console.log('- public:', fs.existsSync(altPath2)); 
    console.log('- client/dist:', fs.existsSync(altPath3));
    
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}