import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
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

// Создаем подключение
const client = postgres(process.env.DATABASE_URL);
export const db = drizzle(client, { schema });

// Создаем заглушку pool для совместимости
export const pool = {
  end: async () => {
    await client.end();
  }
};