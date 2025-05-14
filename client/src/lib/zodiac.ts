// Структура знака зодиака
interface ZodiacSign {
  name: string;  // на русском
  englishName: string;  // на английском
  symbol: string;  // Юникод-символ
  startDate: { month: number; day: number; };
  endDate: { month: number; day: number; };
  element: "fire" | "earth" | "air" | "water";
}

// Массив знаков зодиака
export const zodiacSigns: ZodiacSign[] = [
  {
    name: "Овен",
    englishName: "Aries",
    symbol: "♈",
    startDate: { month: 3, day: 21 },
    endDate: { month: 4, day: 19 },
    element: "fire"
  },
  {
    name: "Телец",
    englishName: "Taurus",
    symbol: "♉",
    startDate: { month: 4, day: 20 },
    endDate: { month: 5, day: 20 },
    element: "earth"
  },
  {
    name: "Близнецы",
    englishName: "Gemini",
    symbol: "♊",
    startDate: { month: 5, day: 21 },
    endDate: { month: 6, day: 20 },
    element: "air"
  },
  {
    name: "Рак",
    englishName: "Cancer",
    symbol: "♋",
    startDate: { month: 6, day: 21 },
    endDate: { month: 7, day: 22 },
    element: "water"
  },
  {
    name: "Лев",
    englishName: "Leo",
    symbol: "♌",
    startDate: { month: 7, day: 23 },
    endDate: { month: 8, day: 22 },
    element: "fire"
  },
  {
    name: "Дева",
    englishName: "Virgo",
    symbol: "♍",
    startDate: { month: 8, day: 23 },
    endDate: { month: 9, day: 22 },
    element: "earth"
  },
  {
    name: "Весы",
    englishName: "Libra",
    symbol: "♎",
    startDate: { month: 9, day: 23 },
    endDate: { month: 10, day: 22 },
    element: "air"
  },
  {
    name: "Скорпион",
    englishName: "Scorpio",
    symbol: "♏",
    startDate: { month: 10, day: 23 },
    endDate: { month: 11, day: 21 },
    element: "water"
  },
  {
    name: "Стрелец",
    englishName: "Sagittarius",
    symbol: "♐",
    startDate: { month: 11, day: 22 },
    endDate: { month: 12, day: 21 },
    element: "fire"
  },
  {
    name: "Козерог",
    englishName: "Capricorn",
    symbol: "♑",
    startDate: { month: 12, day: 22 },
    endDate: { month: 1, day: 19 },
    element: "earth"
  },
  {
    name: "Водолей",
    englishName: "Aquarius",
    symbol: "♒",
    startDate: { month: 1, day: 20 },
    endDate: { month: 2, day: 18 },
    element: "air"
  },
  {
    name: "Рыбы",
    englishName: "Pisces",
    symbol: "♓",
    startDate: { month: 2, day: 19 },
    endDate: { month: 3, day: 20 },
    element: "water"
  }
];

// Функция для определения знака зодиака по дате
export function getZodiacSign(date: Date): ZodiacSign {
  const month = date.getMonth() + 1; // JS месяцы начинаются с 0
  const day = date.getDate();

  return zodiacSigns.find(sign => {
    // Особый случай для Козерога (переход между годами)
    if (sign.name === "Козерог") {
      return (month === 12 && day >= 22) || (month === 1 && day <= 19);
    }
    
    // Для всех остальных знаков
    return (month === sign.startDate.month && day >= sign.startDate.day) || 
           (month === sign.endDate.month && day <= sign.endDate.day);
  }) || zodiacSigns[0]; // Возвращаем Овен как дефолт если что-то пошло не так
}

// Функция для получения совместимых знаков
// Получение символа знака зодиака
export function getZodiacSymbol(signName: string): string {
  const sign = zodiacSigns.find(s => s.name === signName || s.englishName === signName);
  return sign ? sign.symbol : '?';
}

// Получение русского названия знака
export function getZodiacRussianName(signName: string): string {
  const sign = zodiacSigns.find(s => s.name === signName || s.englishName === signName);
  return sign ? sign.name : signName;
}

export function getCompatibleSigns(sign: string): string[] {
  const compatibilityMap: Record<string, string[]> = {
    "Овен": ["Лев", "Стрелец", "Весы"],
    "Телец": ["Дева", "Козерог", "Рак"],
    "Близнецы": ["Весы", "Водолей", "Лев"],
    "Рак": ["Скорпион", "Рыбы", "Телец"],
    "Лев": ["Овен", "Стрелец", "Близнецы"],
    "Дева": ["Телец", "Козерог", "Рак"],
    "Весы": ["Близнецы", "Водолей", "Овен"],
    "Скорпион": ["Рак", "Рыбы", "Козерог"],
    "Стрелец": ["Овен", "Лев", "Водолей"],
    "Козерог": ["Телец", "Дева", "Скорпион"],
    "Водолей": ["Близнецы", "Весы", "Стрелец"],
    "Рыбы": ["Рак", "Скорпион", "Козерог"]
  };

  return compatibilityMap[sign] || [];
}

// Функция для определения совместимости между знаками (от 0 до 100)
export function calculateCompatibility(sign1: string, sign2: string): number {
  const compatibleSigns = getCompatibleSigns(sign1);
  
  if (sign1 === sign2) {
    return 70; // Совместимость с самим собой
  } else if (compatibleSigns.includes(sign2)) {
    // Высокая совместимость
    return 80 + Math.floor(Math.random() * 20);
  } else {
    // Пары знаков с элементами
    const sign1Element = zodiacSigns.find(s => s.name === sign1)?.element;
    const sign2Element = zodiacSigns.find(s => s.name === sign2)?.element;
    
    if (sign1Element === sign2Element) {
      // Совместимость по стихии
      return 60 + Math.floor(Math.random() * 20);
    } else if (
      (sign1Element === "fire" && sign2Element === "air") ||
      (sign1Element === "air" && sign2Element === "fire") ||
      (sign1Element === "earth" && sign2Element === "water") ||
      (sign1Element === "water" && sign2Element === "earth")
    ) {
      // Дружественные стихии
      return 50 + Math.floor(Math.random() * 20);
    } else {
      // Конфликтующие стихии
      return 20 + Math.floor(Math.random() * 30);
    }
  }
}
