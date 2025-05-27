import postgres from 'postgres';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as schema from "../shared/schema";

console.log('=== DATABASE CONFIGURATION ===');
const dbUrl = process.env.DATABASE_URL;
console.log('DATABASE_URL exists:', !!dbUrl);
console.log('DATABASE_URL starts with postgresql:', dbUrl?.startsWith('postgresql:'));
console.log('NODE_ENV:', process.env.NODE_ENV);

let db: PostgresJsDatabase<typeof schema>;
let pool: postgres.Sql<{}>; // Тип для postgres-пула

// ИСПРАВЛЕННАЯ ЛОГИКА: Используем реальную БД если есть URL
if (dbUrl && dbUrl.startsWith('postgresql:')) {
  try {
    console.log('=== CONNECTING TO REAL DATABASE ===');
    console.log('Attempting connection to:', dbUrl.replace(/:[^:]*@/, ':***@')); // Скрываем пароль в логах
    
    // Создаем подключение
    const client = postgres(dbUrl, {
      // Настройки для внешней БД
      ssl: false, // Отключаем SSL для внутренних Docker сетей
      connect_timeout: 10, // 10 секунд тайм-аут
      idle_timeout: 20,
      max_lifetime: 60 * 30 // 30 минут
    });
    
    db = drizzle(client, { schema });
    pool = client;
    
    console.log('✅ DATABASE CONNECTION ESTABLISHED');
    
    // Тестируем подключение
    setTimeout(async () => {
      try {
        await client`SELECT 1 as test`;
        console.log('✅ Database connection test successful');
      } catch (error) {
        console.error('❌ Database connection test failed:', error);
      }
    }, 1000);
    
  } catch (error) {
    console.error('❌ Failed to connect to real database:', error);
    console.log('⚠️ Falling back to mock database');
    
    // Fallback to mock
    db = createMockDb();
    pool = createMockPool();
  }
} else {
  console.log('=== RUNNING WITH MOCK DATABASE (no valid DATABASE_URL) ===');
  db = createMockDb();
  pool = createMockPool();
}

// Функции создания mock объектов
function createMockDb(): PostgresJsDatabase<typeof schema> {
  return {
    query: {
      users: {
        findMany: async () => [],
        findFirst: async () => undefined
      },
      zodiacSigns: {
        findMany: async () => []
      }
    } as any,
    select: (() => ({
      from: () => ({
        where: () => Promise.resolve([])
      })
    })) as any,
    insert: (() => ({
      values: () => ({
        returning: () => Promise.resolve([])
      })
    })) as any,
    update: (() => ({
      set: () => ({
        where: () => ({
          returning: () => Promise.resolve([])
        })
      })
    })) as any,
    delete: (() => ({
      where: () => ({
        returning: () => Promise.resolve([])
      })
    })) as any
  } as unknown as PostgresJsDatabase<typeof schema>;
}

function createMockPool(): postgres.Sql<{}> {
  return {
    end: async () => {
      console.log('Mock pool ended');
    }
  } as unknown as postgres.Sql<{}>;
}

// Экспортируем переменные
export { db, pool };