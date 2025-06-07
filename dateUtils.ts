// src/utils/dateUtils.ts
// Утилиты для правильной работы с датами без проблем с часовыми поясами

/**
 * Конвертирует дату в локальную дату без учета часовых поясов
 * Решает проблему, когда дата сдвигается на 1 день при извлечении из БД
 */
export function parseLocalDate(dateString: string): Date {
  if (!dateString) return new Date();
  
  // Если строка уже содержит время, парсим как есть
  if (dateString.includes('T') || dateString.includes(' ')) {
    return new Date(dateString);
  }
  
  // Для дат в формате YYYY-MM-DD добавляем время полдень по локальному времени
  // Это предотвращает сдвиг даты при конвертации из UTC
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0); // month - 1 потому что месяцы в JS с 0
}

/**
 * Форматирует дату в строку YYYY-MM-DD без учета часовых поясов
 */
export function formatLocalDate(date: Date): string {
  if (!date || !(date instanceof Date)) return '';
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Форматирует дату для отображения пользователю на русском языке
 */
export function formatDisplayDate(date: Date | string): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseLocalDate(date);
  } else {
    dateObj = date;
  }
  
  if (!dateObj || !(dateObj instanceof Date)) return '';
  
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ];
  
  const day = dateObj.getDate();
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear();
  
  return `${day} ${month} ${year}`;
}

/**
 * Вычисляет возраст по дате рождения
 */
export function calculateAge(birthDate: Date | string): number {
  let dateObj: Date;
  
  if (typeof birthDate === 'string') {
    dateObj = parseLocalDate(birthDate);
  } else {
    dateObj = birthDate;
  }
  
  if (!dateObj || !(dateObj instanceof Date)) return 0;
  
  const today = new Date();
  let age = today.getFullYear() - dateObj.getFullYear();
  const monthDiff = today.getMonth() - dateObj.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateObj.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Определяет знак зодиака по дате рождения
 */
export function getZodiacSign(birthDate: Date | string): string {
  let dateObj: Date;
  
  if (typeof birthDate === 'string') {
    dateObj = parseLocalDate(birthDate);
  } else {
    dateObj = birthDate;
  }
  
  if (!dateObj || !(dateObj instanceof Date)) return 'Неизвестно';
  
  const month = dateObj.getMonth() + 1; // getMonth() возвращает 0-11
  const day = dateObj.getDate();
  
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'Овен';
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'Телец';
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'Близнецы';
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'Рак';
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'Лев';
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'Дева';
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'Весы';
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'Скорпион';
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'Стрелец';
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'Козерог';
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'Водолей';
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'Рыбы';
  
  return 'Неизвестно';
}

/**
 * Конвертирует дату для сохранения в базу данных
 * Возвращает строку в формате YYYY-MM-DD
 */
export function formatDateForDB(date: Date | string): string {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseLocalDate(date);
  } else {
    dateObj = date;
  }
  
  if (!dateObj || !(dateObj instanceof Date)) return '';
  
  return formatLocalDate(dateObj);
}

/**
 * Вычисляет количество дней с даты рождения
 */
export function getDaysOld(birthDate: Date | string): number {
  let dateObj: Date;
  
  if (typeof birthDate === 'string') {
    dateObj = parseLocalDate(birthDate);
  } else {
    dateObj = birthDate;
  }
  
  if (!dateObj || !(dateObj instanceof Date)) return 0;
  
  const today = new Date();
  const diffInTime = today.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
  return diffInDays;
}

/**
 * Вычисляет нумерологический код по дате рождения
 */
export function getNumericCode(birthDate: Date | string): number {
  let dateObj: Date;
  
  if (typeof birthDate === 'string') {
    dateObj = parseLocalDate(birthDate);
  } else {
    dateObj = birthDate;
  }
  
  if (!dateObj || !(dateObj instanceof Date)) return 0;
  
  const day = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  const year = dateObj.getFullYear();
  
  // Пример простого расчета нумерологической цифры
  let sum = day + month + year;
  while (sum > 9) {
    sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
  }
  
  return sum;
}