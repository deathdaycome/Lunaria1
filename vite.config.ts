import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

import { fileURLToPath, URL } from 'url';

// Получаем правильный путь для ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
  ],
  base: '/', // Добавляем базовый путь
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
      // ДОБАВЛЯЕМ новые алиасы для оптимизации производительности:
      "@hooks": path.resolve(__dirname, "hooks"),
      "@utils": path.resolve(__dirname, "utils"), 
      "@components": path.resolve(__dirname, "components"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist", "public"),
    emptyOutDir: true,
    assetsDir: "assets",
    sourcemap: false,
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
    host: '0.0.0.0',
    port: 3001,
    cors: true,
    hmr: false, // Отключаем HMR для туннелей
    fs: {
      strict: false
    },
    middlewareMode: false,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 API Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔵 API Proxy request:', req.method, req.url, '-> http://localhost:5000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟢 API Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/health': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Health Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔵 Health Proxy request:', req.method, req.url, '-> http://localhost:5000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟢 Health Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      },
      '/test123': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('🔴 Test Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔵 Test Proxy request:', req.method, req.url, '-> http://localhost:5000' + req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('🟢 Test Proxy response:', proxyRes.statusCode, req.url);
          });
        },
      }
    },
    // Расширяем список разрешенных хостов
    allowedHosts: [
      '.trycloudflare.com',
      '.loca.lt',
      '.ngrok.io',
      '.serveo.net',
      'localhost',
      '127.0.0.1',
      '0.0.0.0'
    ],
  },
  preview: {
    port: 3000,
    host: true,
  },
});