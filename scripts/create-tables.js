import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createTables() {
  try {
    console.log('🔄 Подключаемся к базе данных...');
    
    // SQL встроен в код
    const sql = `
-- Создаем таблицу horoscopes
CREATE TABLE IF NOT EXISTS horoscopes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  period TEXT NOT NULL,
  category TEXT NOT NULL,
  content TEXT NOT NULL,
  lucky_numbers JSONB NOT NULL,
  compatible_signs JSONB NOT NULL,
  is_actual BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Создаем таблицу api_usage
CREATE TABLE IF NOT EXISTS api_usage (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  request_source TEXT NOT NULL,
  request_text TEXT,
  response_text TEXT,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Создаем таблицу friends
CREATE TABLE IF NOT EXISTS friends (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  gender TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  birth_place TEXT,
  zodiac_sign TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
    
    console.log('⚡ Выполняем SQL команды...');
    
    // Выполняем SQL
    const result = await pool.query(sql);
    
    console.log('✅ Таблицы созданы успешно!');
    
  } catch (error) {
    console.error('❌ Ошибка:', error);
  } finally {
    await pool.end();
    console.log('🔐 Соединение с БД закрыто');
  }
}

createTables();