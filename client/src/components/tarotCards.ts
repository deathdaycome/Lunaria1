// Маппинг названий карт на файлы изображений
export function getTarotCardImage(cardName: string): string {
  // Маппинг названий из ИИ (с заглавной буквы) на файлы (строчными)
  const cardMapping: Record<string, string> = {
    "Дурак": "дурак",
    "Маг": "маг", 
    "Верховная Жрица": "верховная_жрица",
    "Жрица": "верховная_жрица", // альтернативное название
    "Императрица": "императрица",
    "Император": "император",
    "Иерофант": "иерофант",
    "Влюбленные": "влюбленные",
    "Колесница": "колесница",
    "Сила": "сила",
    "Отшельник": "отшельник",
    "Колесо Фортуны": "колесо_фортуны",
    "Справедливость": "справедливость",
    "Повешенный": "повешенный",
    "Смерть": "смерть",
    "Умеренность": "умеренность",
    "Дьявол": "дьявол",
    "Башня": "башня",
    "Звезда": "звезда",
    "Луна": "луна",
    "Солнце": "солнце",
    "Суд": "суд",
    "Мир": "мир"
  };
  
  const fileName = cardMapping[cardName] || cardName.toLowerCase().replace(/\s+/g, '_');
  const imagePath = `/images/tarot/${fileName}.png`;
  
  console.log(`🎴 Card mapping: "${cardName}" -> "${fileName}" -> ${imagePath}`);
  
  return imagePath;
}

// Список всех карт Старших Арканов
const MAJOR_ARCANA = [
  "Дурак", "Маг", "Верховная Жрица", "Жрица", "Императрица", "Император", "Иерофант",
  "Влюбленные", "Колесница", "Сила", "Отшельник", "Колесо Фортуны", "Справедливость",
  "Повешенный", "Смерть", "Умеренность", "Дьявол", "Башня", "Звезда", 
  "Луна", "Солнце", "Суд", "Мир"
];

// Функция для извлечения названий карт из текста ИИ
export function extractCardNamesFromText(text: string, expectedCount: number = 3): string[] {
  console.log(`🔍 Extracting ${expectedCount} cards from text`);
  console.log(`🔍 Text sample:`, text.substring(0, 300));
  
  const foundCards: string[] = [];
  
  // Ищем прямые упоминания карт из списка
  MAJOR_ARCANA.forEach(cardName => {
    // Различные паттерны для поиска каждой конкретной карты
    const patterns = [
      new RegExp(`\\b${cardName}\\b`, 'gi'),
      new RegExp(`карта\\s+[—-]?\\s*${cardName}`, 'gi'),
      new RegExp(`${cardName}\\s*[—-:]`, 'gi'),
      new RegExp(`-\\s*${cardName}`, 'gi'),
      new RegExp(`\\(${cardName}\\)`, 'gi')
    ];
    
    for (const pattern of patterns) {
      if (pattern.test(text) && !foundCards.includes(cardName)) {
        foundCards.push(cardName);
        console.log(`✅ Found card: ${cardName}`);
        break;
      }
    }
  });
  
  // Если не нашли достаточно карт, добавляем случайные из списка
  while (foundCards.length < expectedCount) {
    const randomCard = MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
    if (!foundCards.includes(randomCard)) {
      foundCards.push(randomCard);
      console.log(`🎲 Added random card: ${randomCard}`);
    }
  }
  
  console.log(`🔍 Final cards list:`, foundCards.slice(0, expectedCount));
  return foundCards.slice(0, expectedCount);
}

// Функция для получения случайной карты
export function getRandomTarotCard(): string {
  return MAJOR_ARCANA[Math.floor(Math.random() * MAJOR_ARCANA.length)];
}