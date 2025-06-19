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

export function cleanStructuredRussianText(
  text: string, 
  maxSections?: number
): Array<{title: string, content: string}> {
  if (!text || typeof text !== 'string') {
    return [];
  }

  // Очищаем от markdown
  const cleanedText = cleanRussianText(text);
  
  // Разбиваем на абзацы
  const paragraphs = cleanedText
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(p => p.length > 20);

  const sections: Array<{title: string, content: string}> = [];
  
  // ✅ СТРОГОЕ ОГРАНИЧЕНИЕ ПО КОЛИЧЕСТВУ СЕКЦИЙ
  const limitedParagraphs = maxSections 
    ? paragraphs.slice(0, maxSections + 2) // +2 для буфера
    : paragraphs;
  
  for (let i = 0; i < limitedParagraphs.length && (!maxSections || sections.length < maxSections); i++) {
    const paragraph = limitedParagraphs[i];
    
    // Пытаемся найти заголовок в начале абзаца
    const titleMatch = paragraph.match(/^([^.!?]+)[:.]?\s*([\s\S]+)/);
    
    if (titleMatch && titleMatch[1].length < 100) {
      sections.push({
        title: titleMatch[1].trim(),
        content: titleMatch[2].trim()
      });
    } else {
      sections.push({
        title: `Раздел ${sections.length + 1}`,
        content: paragraph
      });
    }
  }
  
  // ✅ ДОБАВЛЯЕМ ОБЩИЙ СОВЕТ ЕСЛИ ЕСТЬ ОСТАВШИЙСЯ ТЕКСТ
  if (maxSections && sections.length === maxSections) {
    const remainingParagraphs = limitedParagraphs.slice(maxSections);
    if (remainingParagraphs.length > 0) {
      sections.push({
        title: "Общие рекомендации",
        content: remainingParagraphs.join('\n\n')
      });
    } else {
      // Если нет оставшегося текста, добавляем базовый совет
      sections.push({
        title: "Общие рекомендации",
        content: "Карты показывают важные аспекты вашей ситуации. Прислушайтесь к их мудрости."
      });
    }
  }
  
  // ✅ ФИНАЛЬНАЯ ПРОВЕРКА: не больше maxSections + 1
  if (maxSections && sections.length > maxSections + 1) {
    return sections.slice(0, maxSections + 1);
  }
  
  return sections;
}



// ✅ ДОБАВИТЬ НОВУЮ ФУНКЦИЮ СТРОГОЙ ВАЛИДАЦИИ РЕЗУЛЬТАТА
export function validateTarotReadingResult(
  reading: any, 
  expectedCardCount: number
): { isValid: boolean, errors: string[] } {
  const errors: string[] = [];
  
  if (!Array.isArray(reading)) {
    errors.push("Результат не является массивом");
    return { isValid: false, errors };
  }
  
  const expectedTotal = expectedCardCount + 1;
  if (reading.length !== expectedTotal) {
    errors.push(`Неверное количество секций: получено ${reading.length}, ожидается ${expectedTotal}`);
  }
  
  reading.forEach((section, index) => {
    if (!section || typeof section !== 'object') {
      errors.push(`Секция ${index + 1} не является объектом`);
      return;
    }
    
    if (!section.title || typeof section.title !== 'string') {
      errors.push(`Секция ${index + 1} не имеет корректного заголовка`);
    }
    
    if (!section.content || typeof section.content !== 'string' || section.content.length < 10) {
      errors.push(`Секция ${index + 1} не имеет корректного содержимого`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}