import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath, URL } from 'url';

// Получаем правильный путь для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    //runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false, // Отключаем sourcemap для production
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['@mui/material', '@mui/icons-material'],
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover'
          ]
        }
      }
    }
  },
  server: {
    host: '0.0.0.0', // Слушаем все интерфейсы
    port: 3000,
    hmr: { overlay: false },
    proxy: {
      // Проксируем API запросы к Express серверу
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 API Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔵 API Proxy request:', req.method, req.url, '-> http://localhost:8000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟢 API Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Добавляем health check
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Health Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔵 Health Proxy request:', req.method, req.url, '-> http://localhost:8000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟢 Health Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      // Добавляем тестовый маршрут
      '/test123': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Test Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔵 Test Proxy request:', req.method, req.url, '-> http://localhost:8000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟢 Test Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
    allowedHosts: [
      '.trycloudflare.com', // Разрешает все поддомены trycloudflare.com
      'planners-several-marilyn-developmental.trycloudflare.com', // Новый туннельный хост
      'statistical-flag-here-poor.trycloudflare.com' // Старый туннельный хост
    ],
  },
  preview: {
    port: 3000,
    host: true,
  },
});