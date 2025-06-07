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

-- Проверяем созданные таблицы
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;