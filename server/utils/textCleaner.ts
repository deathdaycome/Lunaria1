// server/utils/textCleaner.ts

/**
 * Функция для очистки текста от markdown-символов
 * Решает проблему с символами *, #, _, ** в ответах от ИИ
 */
export function cleanMarkdownText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return text
    // Убираем жирный текст (**text** или __text__)
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    
    // Убираем курсив (*text* или _text_) - но аккуратно, чтобы не затронуть другие звездочки
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1')
    
    // Убираем заголовки (### text, ## text, # text)
    .replace(/^#{1,6}\s+(.*)$/gm, '$1')
    
    // Убираем маркированные списки в начале строки
    .replace(/^\s*[-*+]\s+/gm, '')
    
    // Убираем нумерованные списки в начале строки
    .replace(/^\s*\d+\.\s+/gm, '')
    
    // Убираем блоки кода
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`\n]+?)`/g, '$1')
    
    // Убираем ссылки [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    
    // Убираем лишние звездочки в середине текста (если остались)
    .replace(/\*{2,}/g, '')
    
    // Убираем лишние решетки в середине текста
    .replace(/#{2,}/g, '')
    
    // Убираем лишние переносы строк (больше 2 подряд)
    .replace(/\n{3,}/g, '\n\n')
    
    // Убираем пробелы в начале и конце
    .trim();
}

/**
 * Новая функция для парсинга структурированного текста с маркерами ###
 * Преобразует текст с маркерами в объект с разделами
 */
export function parseStructuredText(text: string): Array<{title: string, content: string}> {
  if (!text || typeof text !== 'string') return [];
  
  // Разбиваем текст по маркерам ### ЗАГОЛОВОК ###
  const sections = text.split(/###\s*([^#\n]+?)\s*###/);
  
  const result: Array<{title: string, content: string}> = [];
  
  // Первый элемент - это текст до первого маркера (если есть)
  if (sections[0] && sections[0].trim()) {
    result.push({
      title: "Введение",
      content: cleanMarkdownText(sections[0].trim())
    });
  }
  
  // Остальные элементы идут парами: заголовок, содержимое
  for (let i = 1; i < sections.length; i += 2) {
    const title = sections[i] ? sections[i].trim() : '';
    const content = sections[i + 1] ? sections[i + 1].trim() : '';
    
    if (title && content) {
      result.push({
        title: cleanMarkdownText(title),
        content: cleanMarkdownText(content)
      });
    }
  }
  
  return result;
}

/**
 * Функция для очистки объекта с текстовыми полями
 * Рекурсивно обходит объект и очищает все строковые поля
 */
export function cleanTextInObject(obj: any): any {
  if (!obj) return obj;
  
  if (typeof obj === 'string') {
    return cleanMarkdownText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => cleanTextInObject(item));
  }
  
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      cleaned[key] = cleanTextInObject(value);
    }
    return cleaned;
  }
  
  return obj;
}

/**
 * Функция для очистки специфичных символов для русского текста
 * Дополнительная очистка для русскоязычных ответов ИИ
 */
export function cleanRussianText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  return cleanMarkdownText(text)
    // Убираем английские кавычки и заменяем на русские
    .replace(/"/g, '«')
    .replace(/"/g, '»')
    
    // Убираем лишние пунктуационные символы
    .replace(/\.{3,}/g, '...')
    .replace(/!{2,}/g, '!')
    .replace(/\?{2,}/g, '?')
    
    // Нормализуем пробелы
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Специальная функция для структурированной очистки русского текста
 * Комбинирует парсинг структуры и очистку русского текста
 */
export function cleanStructuredRussianText(rawContent: string): Array<{title: string, content: string}> {
  if (!rawContent || typeof rawContent !== 'string') {
    return [];
  }

  // Очищаем markdown
  let cleanedText = rawContent
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '$1')
    .replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '$1')
    .replace(/^#{1,6}\s+(.*)$/gm, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1');

  // Разбиваем на параграфы
  const paragraphs = cleanedText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 0);

  if (paragraphs.length === 0) {
    return [];
  }

  const sections: Array<{title: string, content: string}> = [];
  
  // Первый параграф всегда "Общий прогноз"
  if (paragraphs[0]) {
    sections.push({
      title: "### Общий прогноз ###",
      content: paragraphs[0]
    });
  }

  // Определяем типы секций в зависимости от контекста
  const sectionTitles = [
    "### Астрологическая совместимость ###",
    "### Нумерологическая совместимость ###", 
    "### Психологическая совместимость ###",
    "### Рекомендации ###",
    "### Заключение ###"
  ];

  // Для расклада Таро используем другие заголовки
  const tarotTitles = [
    "### Причина конфликта: **Сила** ###",
    "### Ваши эмоции: **Влюбленные** ###",
    "### Исход ситуации: **Мир** ###",
    "### Рекомендации ###",
    "### Заключение ###"
  ];

  // Проверяем, это Таро или совместимость
  const isTarot = rawContent.toLowerCase().includes('карт') || 
                  rawContent.toLowerCase().includes('расклад') ||
                  rawContent.toLowerCase().includes('таро');

  const titles = isTarot ? tarotTitles : sectionTitles;

  // Добавляем остальные параграфы с соответствующими заголовками
  for (let i = 1; i < paragraphs.length && i - 1 < titles.length; i++) {
    sections.push({
      title: titles[i - 1],
      content: paragraphs[i]
    });
  }

  // Если параграфов больше чем заголовков, добавляем с базовым заголовком
  for (let i = titles.length + 1; i < paragraphs.length; i++) {
    sections.push({
      title: "### Дополнительная информация ###",
      content: paragraphs[i]
    });
  }

  return sections;
}