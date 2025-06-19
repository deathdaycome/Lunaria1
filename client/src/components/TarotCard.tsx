import React from 'react';

interface TarotCardProps {
  cardName: string;
  width?: number;
  height?: number;
  showName?: boolean;
}

export default function TarotCard({ 
  cardName, 
  width = 80, 
  height = 128, 
  showName = true 
}: TarotCardProps) {
  const imagePath = getTarotCardImage(cardName);
  
  console.log(`🎴 Rendering TarotCard: ${cardName} -> ${imagePath}`);
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div 
        className="relative overflow-hidden rounded-lg border-2 border-amber-400/60 shadow-lg"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <img 
          src={imagePath}
          alt={cardName}
          className="w-full h-full object-cover"
          onLoad={() => {
            console.log(`✅ Image loaded successfully: ${imagePath}`);
          }}
          onError={(e) => {
            console.error(`❌ Failed to load image: ${imagePath}`);
            // Fallback - показываем красивую заглушку
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            
            // Создаем красивую заглушку вместо изображения
            const parent = target.parentElement;
            if (parent && !parent.querySelector('.card-fallback')) {
              const fallback = document.createElement('div');
              fallback.className = 'card-fallback w-full h-full bg-gradient-to-b from-purple-600 to-blue-600 flex flex-col items-center justify-center text-white rounded-lg';
              fallback.innerHTML = `
                <span class="text-2xl mb-1">🔮</span>
                <span class="text-xs text-center px-1 leading-tight">${cardName}</span>
              `;
              parent.appendChild(fallback);
            }
          }}
        />
        
        {/* Магический блеск поверх карты */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50"></div>
      </div>
      
      {showName && (
        <p className="text-sm font-connie text-amber-300 text-center max-w-20 leading-tight">
          {cardName}
        </p>
      )}
    </div>
  );
}

// ✅ УЛУЧШЕННАЯ ФУНКЦИЯ МАППИНГА НАЗВАНИЙ КАРТ НА ФАЙЛЫ
export function getTarotCardImage(cardName: string): string {
  // Маппинг названий из ИИ на точные имена файлов в твоей папке
  const cardMapping: Record<string, string> = {
    // Основные названия карт - точно как в твоих файлах
    "Дурак": "дурак",
    "Маг": "маг", 
    "Верховная Жрица": "жрица",
    "Жрица": "жрица", // альтернативное название
    "Высшая Жрица": "жрица", // еще один вариант
    "Императрица": "императрица",
    "Император": "император",
    "Иерофант": "¦Т¦¦TАTЕ¦-¦-¦-¦-TП ¦¦TА¦¬TЖ¦-", // это файл с кракозябрами - возможно Иерофант
    "Первосвященник": "¦Т¦¦TАTЕ¦-¦-¦-¦-TП ¦¦TА¦¬TЖ¦-", // альтернативное название
    "Влюбленные": "влюбленные",
    "Колесница": "колесница",
    "Сила": "сила",
    "Отшельник": "отшельник",
    "Колесо Фортуны": "колесо фортуны",
    "Колесо Судьбы": "колесо фортуны", // альтернативное название
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
    "Страшный Суд": "суд", // альтернативное название
    "Мир": "мир",
    "Вселенная": "мир" // альтернативное название
  };
  
  // Нормализуем название карты (убираем лишние пробелы, приводим к правильному регистру)
  const normalizedCardName = cardName.trim();
  
  // Ищем точное соответствие
  let fileName = cardMapping[normalizedCardName];
  
  // Если не нашли точное соответствие, ищем частичное
  if (!fileName) {
    const cardKeys = Object.keys(cardMapping);
    const partialMatch = cardKeys.find(key => 
      key.toLowerCase().includes(normalizedCardName.toLowerCase()) ||
      normalizedCardName.toLowerCase().includes(key.toLowerCase())
    );
    
    if (partialMatch) {
      fileName = cardMapping[partialMatch];
      console.log(`🔍 Partial match found: "${normalizedCardName}" -> "${partialMatch}" -> "${fileName}"`);
    }
  }
  
  // Если все еще не нашли, используем простое преобразование
  if (!fileName) {
    fileName = normalizedCardName.toLowerCase()
      .replace(/\s+/g, ' ') // нормализуем пробелы
      .replace(/\s/g, '_') // заменяем пробелы на подчеркивания
      .replace(/[^\w\u0400-\u04FF_]/g, ''); // убираем все кроме букв, цифр и подчеркиваний
    
    console.log(`⚠️ No mapping found, using transformed: "${normalizedCardName}" -> "${fileName}"`);
  }
  
  const imagePath = `/images/tarot/${fileName}.png`;
  
  console.log(`🎴 Card mapping: "${normalizedCardName}" -> "${fileName}" -> ${imagePath}`);
  
  return imagePath;
}

// ✅ ПОЛНЫЙ СПИСОК КАРТ СТАРШИХ АРКАНОВ С ВАРИАНТАМИ НАЗВАНИЙ
const MAJOR_ARCANA = [
  "Дурак", "Маг", "Верховная Жрица", "Жрица", "Высшая Жрица",
  "Императрица", "Император", "Иерофант", "Первосвященник",
  "Влюбленные", "Колесница", "Сила", "Отшельник", 
  "Колесо Фортуны", "Колесо Судьбы", "Справедливость",
  "Повешенный", "Смерть", "Умеренность", "Дьявол", "Башня", 
  "Звезда", "Луна", "Солнце", "Суд", "Страшный Суд", "Мир", "Вселенная"
];

// ✅ ФУНКЦИЯ ДЛЯ ИЗВЛЕЧЕНИЯ НАЗВАНИЙ КАРТ ИЗ ТЕКСТА ИИ
export function extractCardNamesFromText(text: string, expectedCount: number = 3): string[] {
  console.log(`🔍 Extracting ${expectedCount} cards from text`);
  console.log(`🔍 Text sample:`, text.substring(0, 300));
  
  const foundCards: string[] = [];
  
  // Ищем прямые упоминания карт из списка
  MAJOR_ARCANA.forEach(cardName => {
    // Различные паттерны для поиска каждой конкретной карты
    const patterns = [
      new RegExp(`\\b${cardName}\\b`, 'gi'),
      new RegExp(`карта\\s+[—\\-]?\\s*${cardName}`, 'gi'),
      new RegExp(`${cardName}\\s*[—\\-:]`, 'gi'),  // ← ИСПРАВЛЕНО: экранировали дефис
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
  
  // Если не нашли достаточно карт, добавляем случайные из списка основных карт
  const mainCards = [
    "Дурак", "Маг", "Верховная Жрица", "Императрица", "Император", 
    "Иерофант", "Влюбленные", "Колесница", "Сила", "Отшельник", 
    "Колесо Фортуны", "Справедливость", "Повешенный", "Смерть", 
    "Умеренность", "Дьявол", "Башня", "Звезда", "Луна", "Солнце", "Суд", "Мир"
  ];
  
  while (foundCards.length < expectedCount) {
    const randomCard = mainCards[Math.floor(Math.random() * mainCards.length)];
    if (!foundCards.includes(randomCard)) {
      foundCards.push(randomCard);
      console.log(`🎲 Added random card: ${randomCard}`);
    }
  }
  
  console.log(`🔍 Final cards list:`, foundCards.slice(0, expectedCount));
  return foundCards.slice(0, expectedCount);
}

// ✅ ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ СЛУЧАЙНОЙ КАРТЫ
export function getRandomTarotCard(): string {
  const mainCards = [
    "Дурак", "Маг", "Верховная Жрица", "Императрица", "Император", 
    "Иерофант", "Влюбленные", "Колесница", "Сила", "Отшельник", 
    "Колесо Фортуны", "Справедливость", "Повешенный", "Смерть", 
    "Умеренность", "Дьявол", "Башня", "Звезда", "Луна", "Солнце", "Суд", "Мир"
  ];
  return mainCards[Math.floor(Math.random() * mainCards.length)];
}