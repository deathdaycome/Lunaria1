import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from "@shared/schema";

console.log('=== DATABASE CONFIGURATION ===');
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL exists:', !!dbUrl);
console.log('DATABASE_URL starts with postgresql:', dbUrl?.startsWith('postgresql:'));
console.log('NODE_ENV:', process.env.NODE_ENV);

let db: PostgresJsDatabase<typeof schema>;
let pool: postgres.Sql<{}>; // Тип для postgres-пула

if (process.env.NODE_ENV === 'production' && dbUrl) {
  console.log('=== RUNNING WITH PRODUCTION DATABASE ===');
  // Конфигурация для production с SSL, если требуется вашим хостингом БД
  // Пример: const client = postgres(dbUrl, { ssl: 'require' });
  const client = postgres(dbUrl);
  db = drizzle(client, { schema });
  pool = client; // postgres клиент сам является пулом и имеет метод .end()
} else {
  // Оставляем заглушку для локальной разработки или если DATABASE_URL не задан
  console.log('=== RUNNING WITH MOCK DATABASE (or DATABASE_URL not set) ===');
  db = {
    query: async () => [],
    select: (() => ({ from: () => Promise.resolve([]) })) as any,
    insert: (() => ({ values: () => ({ returning: () => Promise.resolve([]) }) })) as any,
    update: (() => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([]) }) }) })) as any,
    delete: (() => ({ where: () => ({ returning: () => Promise.resolve([]) }) })) as any,
    // Добавьте другие методы, если они используются и нужны для мока
  } as unknown as PostgresJsDatabase<typeof schema>; // Приведение типа для мока

  pool = {
    end: async () => {
      console.log('Mock pool ended');
    }
  } as unknown as postgres.Sql<{}>; // Приведение типа для мока
}

// Экспортируем переменные
export { db, pool };