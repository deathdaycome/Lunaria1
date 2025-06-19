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

-- Добавляем персональные поля в таблицу users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS lucky_numbers JSONB,
ADD COLUMN IF NOT EXISTS compatible_signs JSONB;

-- Заполняем данные для существующих пользователей
UPDATE users 
SET 
  lucky_numbers = (
    SELECT jsonb_build_array(
      (random() * 9 + 1)::int,
      (random() * 9 + 1)::int,
      (random() * 9 + 1)::int
    )
  ),
  compatible_signs = (
    CASE zodiac_sign
      WHEN 'Овен' THEN '["leo", "sagittarius", "gemini"]'::jsonb
      WHEN 'Телец' THEN '["virgo", "capricorn", "cancer"]'::jsonb
      WHEN 'Близнецы' THEN '["libra", "aquarius", "aries"]'::jsonb
      WHEN 'Рак' THEN '["scorpio", "pisces", "taurus"]'::jsonb
      WHEN 'Лев' THEN '["aries", "sagittarius", "gemini"]'::jsonb
      WHEN 'Дева' THEN '["taurus", "capricorn", "cancer"]'::jsonb
      WHEN 'Весы' THEN '["gemini", "aquarius", "leo"]'::jsonb
      WHEN 'Скорпион' THEN '["cancer", "pisces", "virgo"]'::jsonb
      WHEN 'Стрелец' THEN '["aries", "leo", "libra"]'::jsonb
      WHEN 'Козерог' THEN '["taurus", "virgo", "scorpio"]'::jsonb
      WHEN 'Водолей' THEN '["gemini", "libra", "sagittarius"]'::jsonb
      WHEN 'Рыбы' THEN '["cancer", "scorpio", "capricorn"]'::jsonb
      ELSE '["taurus", "cancer", "virgo"]'::jsonb
    END
  )
WHERE lucky_numbers IS NULL OR compatible_signs IS NULL;

-- Проверяем результат
SELECT 'Migration completed: added lucky_numbers and compatible_signs to users table' as status;