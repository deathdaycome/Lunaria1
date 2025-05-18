import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

console.log('=== DATABASE CONFIGURATION ===');
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
console.log('DATABASE_URL starts with postgresql:', process.env.DATABASE_URL?.startsWith('postgresql:'));
console.log('NODE_ENV:', process.env.NODE_ENV);

// Объявление переменных db и pool
let db: any;
let pool: { end: () => Promise<void> };

// ВРЕМЕННОЕ РЕШЕНИЕ: Всегда используем заглушку для локального запуска
console.log('=== RUNNING WITH MOCK DATABASE ===');

// Используем заглушки для работы без базы данных
db = {
  query: async () => [],
  select: () => ({ from: () => [] }),
  insert: () => ({ values: () => ({ returning: () => [] }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => [] }) }) }),
  delete: () => ({ where: () => ({ returning: () => [] }) }),
};

pool = {
  end: async () => {
    console.log('Mock pool ended');
  }
};

// Экспортируем переменные
export { db, pool };