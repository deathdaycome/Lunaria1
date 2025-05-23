// filepath: c:\Users\PC\Desktop\Lunaria\scripts\migrate.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config(); // Загружает переменные из .env

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('🔴 DATABASE_URL is not set. Please check your .env file or environment variables.');
    process.exit(1);
  }

  console.log('🟠 Connecting to database for migration...');
  const sql = postgres(databaseUrl, { max: 1 }); // Клиент для миграций
  const db = drizzle(sql);

  try {
    console.log('🟢 Starting migration...');
    // Путь к папке с миграциями относительно корня проекта
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('✅ Migrations applied successfully!');
  } catch (error) {
    console.error('🔴 Error applying migrations:', error);
    process.exit(1);
  } finally {
    await sql.end(); // Закрываем соединение
    console.log('🔵 Database connection closed.');
  }
}

runMigrations();