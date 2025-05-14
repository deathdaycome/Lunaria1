import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from "@shared/schema";

console.log('=== DATABASE CONFIGURATION ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with postgresql:', process.env.DATABASE_URL?.startsWith('postgresql:'));

if (!process.env.DATABASE_URL) {
  console.error('Available environment variables:', Object.keys(process.env).filter(key => key.includes('DATABASE')));
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Используем HTTP драйвер вместо WebSocket
const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// Экспортируем заглушку для совместимости
export const pool = { end: () => Promise.resolve() };