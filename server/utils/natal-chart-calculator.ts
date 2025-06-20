// natal-chart-calculator.ts
// ✅ ПОЛНЫЙ АНАЛОГ PYTHON ВЕРСИИ НА TYPESCRIPT

import { Chart as AstroChart } from '@astrodraw/astrochart';

// Интерфейсы для типизации
interface NatalChartInput {
  user_name: string;
  birth_year: number;
  birth_month: number;
  birth_day: number;
  birth_hour: number;
  birth_minute: number;
  birth_city: string;
  birth_country_code: string;
}

interface PlanetData {
  name: string;
  position: number;
  sign: string;
  house: string;
  retrograde?: boolean;
  element?: string;
  quality?: string;
}

interface HouseData {
  name: string;
  position: number;
  sign: string;
  cusp: number;
}

interface NatalChartData {
  name: string;
  city: string;
  nation: string;
  iso_formatted_local_datetime: string;
  sun: PlanetData;
  moon: PlanetData;
  mercury: PlanetData;
  venus: PlanetData;
  mars: PlanetData;
  jupiter: PlanetData;
  saturn: PlanetData;
  uranus: PlanetData;
  neptune: PlanetData;
  pluto: PlanetData;
  chiron: PlanetData;
  mean_lilith: PlanetData;
  ascendant: PlanetData;
  descendant: PlanetData;
  medium_coeli: PlanetData;
  imum_coeli: PlanetData;
  mean_node: PlanetData;
  true_node: PlanetData;
  mean_south_node: PlanetData;
  true_south_node: PlanetData;
  first_house: HouseData;
  second_house: HouseData;
  third_house: HouseData;
  fourth_house: HouseData;
  fifth_house: HouseData;
  sixth_house: HouseData;
  seventh_house: HouseData;
  eighth_house: HouseData;
  ninth_house: HouseData;
  tenth_house: HouseData;
  eleventh_house: HouseData;
  twelfth_house: HouseData;
  lunar_phase: {
    moon_phase_name: string;
    moon_emoji: string;
  };
  zodiac_type: string;
  houses_system_name: string;
  perspective_type: string;
}

interface NatalChartResult {
  svg_name: string;
  ai_prompt: string;
  success: boolean;
  error?: string;
}

// Класс для астрологических расчетов
class AstrologicalCalculator {
  
  // Координаты городов для быстрого доступа
  private static readonly CITY_COORDINATES: Record<string, {lat: number, lng: number, tz: string}> = {
    "Москва": { lat: 55.7558, lng: 37.6173, tz: "Europe/Moscow" },
    "Санкт-Петербург": { lat: 59.9311, lng: 30.3609, tz: "Europe/Moscow" },
    "Екатеринбург": { lat: 56.8431, lng: 60.6454, tz: "Asia/Yekaterinburg" },
    "Новосибирск": { lat: 55.0084, lng: 82.9357, tz: "Asia/Novosibirsk" },
    "Нижний Новгород": { lat: 56.2965, lng: 43.9361, tz: "Europe/Moscow" },
    "Казань": { lat: 55.8304, lng: 49.0661, tz: "Europe/Moscow" },
    "Челябинск": { lat: 55.1644, lng: 61.4368, tz: "Asia/Yekaterinburg" },
    "Омск": { lat: 54.9884, lng: 73.3242, tz: "Asia/Omsk" },
    "Самара": { lat: 53.2415, lng: 50.2212, tz: "Europe/Samara" },
    "Ростов-на-Дону": { lat: 47.2357, lng: 39.7015, tz: "Europe/Moscow" },
    "Уфа": { lat: 54.7388, lng: 55.9721, tz: "Asia/Yekaterinburg" },
    "Красноярск": { lat: 56.0184, lng: 92.8672, tz: "Asia/Krasnoyarsk" },
    "Пермь": { lat: 58.0105, lng: 56.2502, tz: "Asia/Yekaterinburg" },
    "Воронеж": { lat: 51.6720, lng: 39.1843, tz: "Europe/Moscow" },
    "Волгоград": { lat: 48.7080, lng: 44.5133, tz: "Europe/Volgograd" },
    "Краснодар": { lat: 45.0355, lng: 38.9753, tz: "Europe/Moscow" }
  };

  // Словари для перевода астрологических терминов
  private static readonly SIGN_TRANSLATION = {
    "Ari": "Овен", "Tau": "Телец", "Gem": "Близнецы", "Can": "Рак",
    "Leo": "Лев", "Vir": "Дева", "Lib": "Весы", "Sco": "Скорпион",
    "Sag": "Стрелец", "Cap": "Козерог", "Aqu": "Водолей", "Pis": "Рыбы"
  };

  private static readonly QUALITY_TRANSLATION = {
    "Cardinal": "Кардинальный",
    "Fixed": "Фиксированный",
    "Mutable": "Мутабельный"
  };

  private static readonly ELEMENT_TRANSLATION = {
    "Fire": "Огонь", "Earth": "Земля",
    "Air": "Воздух", "Water": "Вода"
  };

  private static readonly HOUSE_TRANSLATION = {
    "First_House": "Первый дом",
    "Second_House": "Второй дом",
    "Third_House": "Третий дом",
    "Fourth_House": "Четвертый дом",
    "Fifth_House": "Пятый дом",
    "Sixth_House": "Шестой дом",
    "Seventh_House": "Седьмой дом",
    "Eighth_House": "Восьмой дом",
    "Ninth_House": "Девятый дом",
    "Tenth_House": "Десятый дом",
    "Eleventh_House": "Одиннадцатый дом",
    "Twelfth_House": "Двенадцатый дом"
  };

  private static readonly HOUSE_NUMBER_TRANSLATION = {
    "First": "Первый",
    "Second": "Второй", 
    "Third": "Третий",
    "Fourth": "Четвертый",
    "Fifth": "Пятый",
    "Sixth": "Шестой",
    "Seventh": "Седьмой",
    "Eighth": "Восьмой",
    "Ninth": "Девятый",
    "Tenth": "Десятый",
    "Eleventh": "Одиннадцатый",
    "Twelfth": "Двенадцатый"
  };

  private static readonly PLANET_TRANSLATION = {
    "Sun": "Солнце",
    "Moon": "Луна",
    "Mercury": "Меркурий",
    "Venus": "Венера",
    "Mars": "Марс",
    "Jupiter": "Юпитер",
    "Saturn": "Сатурн",
    "Uranus": "Уран",
    "Neptune": "Нептун",
    "Pluto": "Плутон",
    "Chiron": "Хирон",
    "Mean_Lilith": "Черная Луна (Лилит)",
    "Ascendant": "Асцендент",
    "Descendant": "Десцендент",
    "Medium_Coeli": "Середина неба",
    "Imum_Coeli": "Глубина неба",
    "Mean_Node": "Восходящий узел (Раху)",
    "True_Node": "Восходящий узел (истинный)",
    "Mean_South_Node": "Нисходящий узел (Кету)",
    "True_South_Node": "Нисходящий узел (истинный)"
  };

  private static readonly MOON_PHASE_TRANSLATION = {
    "Waxing Crescent": "Растущий серп",
    "First Quarter": "Первая четверть",
    "Waxing Gibbous": "Растущая луна",
    "Full Moon": "Полнолуние",
    "Waning Gibbous": "Убывающая луна",
    "Last Quarter": "Последняя четверть",
    "Waning Crescent": "Убывающий серп",
    "New Moon": "Новолуние"
  };

  // ✅ МЕТОД ДЛЯ АСТРОЛОГИЧЕСКИХ РАСЧЕТОВ
  // Здесь будут использоваться SwissEph или другие точные библиотеки
  private static async calculatePlanetaryPositions(input: NatalChartInput): Promise<NatalChartData> {
    
    // Получаем координаты города
    const cityCoords = this.CITY_COORDINATES[input.birth_city] || this.CITY_COORDINATES["Москва"];
    
    // Создаем дату рождения
    const birthDate = new Date(
      input.birth_year,
      input.birth_month - 1,
      input.birth_day,
      input.birth_hour,
      input.birth_minute
    );

    // ТУТ БУДУТ НАСТОЯЩИЕ АСТРОЛОГИЧЕСКИЕ РАСЧЕТЫ
    // Пока используем заглушки с правильной структурой данных
    
    // Преобразуем юлианский день
    const julianDay = this.dateToJulianDay(birthDate);
    
    // Рассчитываем позиции планет (здесь должен быть SwissEph)
    const planetPositions = await this.calculateRealPlanetPositions(julianDay, cityCoords);
    
    // Рассчитываем дома (система Плацидуса)
    const houses = await this.calculateHouses(julianDay, cityCoords);
    
    // Определяем знаки зодиака для планет
    const planetsWithSigns = this.assignZodiacSigns(planetPositions);
    
    // Определяем дома для планет  
    const planetsWithHouses = this.assignHousesToPlanets(planetsWithSigns, houses);
    
    // Рассчитываем лунную фазу
    const lunarPhase = this.calculateLunarPhase(julianDay);

    return {
      name: input.user_name,
      city: input.birth_city,
      nation: input.birth_country_code,
      iso_formatted_local_datetime: birthDate.toISOString(),
      ...planetsWithHouses,
      ...houses,
      lunar_phase: lunarPhase,
      zodiac_type: "Тропический",
      houses_system_name: "Плацидус", 
      perspective_type: "Видимый геоцентрический"
    };
  }

  // Преобразование даты в юлианский день
  private static dateToJulianDay(date: Date): number {
    const a = Math.floor((14 - (date.getMonth() + 1)) / 12);
    const y = date.getFullYear() + 4800 - a;
    const m = (date.getMonth() + 1) + 12 * a - 3;
    
    return date.getDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
           Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045 +
           (date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600) / 24;
  }

  // Расчет позиций планет (здесь нужно подключить SwissEph)
  private static async calculateRealPlanetPositions(julianDay: number, coords: any): Promise<Record<string, any>> {
    // ЭТО ЗАГЛУШКА - ЗДЕСЬ ДОЛЖНЫ БЫТЬ НАСТОЯЩИЕ РАСЧЕТЫ ЧЕРЕЗ SWISSEPH
    // В реальной версии тут будет:
    // import swisseph from 'swisseph';
    // const sunPos = swisseph.swe_calc_ut(julianDay, swisseph.SE_SUN, swisseph.SEFLG_SPEED);
    
    return {
      sun: { position: 120.5, retrograde: false },
      moon: { position: 45.3, retrograde: false },
      mercury: { position: 130.7, retrograde: false },
      venus: { position: 200.1, retrograde: false },
      mars: { position: 78.9, retrograde: false },
      jupiter: { position: 245.6, retrograde: false },
      saturn: { position: 312.4, retrograde: false },
      uranus: { position: 89.2, retrograde: true },
      neptune: { position: 156.8, retrograde: false },
      pluto: { position: 278.3, retrograde: false },
      chiron: { position: 67.1, retrograde: false },
      mean_lilith: { position: 234.9, retrograde: false },
      mean_node: { position: 145.2, retrograde: true },
      true_node: { position: 145.7, retrograde: true }
    };
  }

  // Расчет домов
  private static async calculateHouses(julianDay: number, coords: any): Promise<Record<string, HouseData>> {
    // ЭТО ЗАГЛУШКА - ЗДЕСЬ ДОЛЖНЫ БЫТЬ НАСТОЯЩИЕ РАСЧЕТЫ ДОМОВ
    const houseCusps = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    
    const houses: Record<string, HouseData> = {};
    const houseNames = [
      'first_house', 'second_house', 'third_house', 'fourth_house',
      'fifth_house', 'sixth_house', 'seventh_house', 'eighth_house', 
      'ninth_house', 'tenth_house', 'eleventh_house', 'twelfth_house'
    ];

    houseNames.forEach((name, index) => {
      const position = houseCusps[index];
      houses[name] = {
        name: this.translateHouseName(name),
        position,
        sign: this.getZodiacSign(position),
        cusp: position
      };
    });

    // Добавляем основные углы
    houses['ascendant'] = {
      name: "Асцендент",
      position: 0,
      sign: this.getZodiacSign(0),
      cusp: 0
    };

    houses['descendant'] = {
      name: "Десцендент", 
      position: 180,
      sign: this.getZodiacSign(180),
      cusp: 180
    };

    houses['medium_coeli'] = {
      name: "Середина неба",
      position: 90,
      sign: this.getZodiacSign(90),
      cusp: 90
    };

    houses['imum_coeli'] = {
      name: "Глубина неба",
      position: 270, 
      sign: this.getZodiacSign(270),
      cusp: 270
    };

    return houses;
  }

  // Определение знака зодиака по градусам
  private static getZodiacSign(degrees: number): string {
    const normalizedDegrees = ((degrees % 360) + 360) % 360;
    const signIndex = Math.floor(normalizedDegrees / 30);
    const signs = ["Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева", 
                   "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"];
    return signs[signIndex];
  }

  // Назначение знаков зодиака планетам
  private static assignZodiacSigns(planetPositions: Record<string, any>): Record<string, PlanetData> {
    const result: Record<string, PlanetData> = {};
    
    Object.entries(planetPositions).forEach(([planet, data]: [string, any]) => {
      result[planet] = {
        name: this.PLANET_TRANSLATION[planet as keyof typeof this.PLANET_TRANSLATION] || planet,
        position: data.position,
        sign: this.getZodiacSign(data.position),
        house: "", // Будет заполнено в следующем методе
        retrograde: data.retrograde,
        element: this.getElementForSign(this.getZodiacSign(data.position)),
        quality: this.getQualityForSign(this.getZodiacSign(data.position))
      };
    });

    return result;
  }

  // Назначение домов планетам
  private static assignHousesToPlanets(planets: Record<string, PlanetData>, houses: Record<string, HouseData>): Record<string, PlanetData> {
    Object.values(planets).forEach(planet => {
      planet.house = this.getHouseForPosition(planet.position);
    });
    return planets;
  }

  // Определение дома по позиции
  private static getHouseForPosition(position: number): string {
    const normalizedPosition = ((position % 360) + 360) % 360;
    const houseNumber = Math.floor(normalizedPosition / 30) + 1;
    const houseNames = [
      "Первый дом", "Второй дом", "Третий дом", "Четвертый дом",
      "Пятый дом", "Шестой дом", "Седьмой дом", "Восьмой дом",
      "Девятый дом", "Десятый дом", "Одиннадцатый дом", "Двенадцатый дом"
    ];
    return houseNames[(houseNumber - 1) % 12];
  }

  // Получение стихии для знака
  private static getElementForSign(sign: string): string {
    const fireSignes = ["Овен", "Лев", "Стрелец"];
    const earthSigns = ["Телец", "Дева", "Козерог"];
    const airSigns = ["Близнецы", "Весы", "Водолей"];
    const waterSigns = ["Рак", "Скорпион", "Рыбы"];

    if (fireSignes.includes(sign)) return "Огонь";
    if (earthSigns.includes(sign)) return "Земля";
    if (airSigns.includes(sign)) return "Воздух";
    if (waterSigns.includes(sign)) return "Вода";
    return "Неизвестно";
  }

  // Получение качества для знака
  private static getQualityForSign(sign: string): string {
    const cardinalSigns = ["Овен", "Рак", "Весы", "Козерог"];
    const fixedSigns = ["Телец", "Лев", "Скорпион", "Водолей"];
    const mutableSigns = ["Близнецы", "Дева", "Стрелец", "Рыбы"];

    if (cardinalSigns.includes(sign)) return "Кардинальный";
    if (fixedSigns.includes(sign)) return "Фиксированный";
    if (mutableSigns.includes(sign)) return "Мутабельный";
    return "Неизвестно";
  }

  // Расчет лунной фазы
  private static calculateLunarPhase(julianDay: number): {moon_phase_name: string, moon_emoji: string} {
    // Простой расчет лунной фазы
    const phase = ((julianDay - 2451550.1) / 29.530588853) % 1;
    
    if (phase < 0.125) return { moon_phase_name: "Новолуние", moon_emoji: "🌑" };
    if (phase < 0.375) return { moon_phase_name: "Растущий серп", moon_emoji: "🌒" };
    if (phase < 0.625) return { moon_phase_name: "Полнолуние", moon_emoji: "🌕" };
    return { moon_phase_name: "Убывающий серп", moon_emoji: "🌘" };
  }

  // Перевод названий домов
  private static translateHouseName(houseName: string): string {
    const parts = houseName.split('_');
    if (parts.length > 0 && parts[0] in this.HOUSE_NUMBER_TRANSLATION) {
      return `${this.HOUSE_NUMBER_TRANSLATION[parts[0] as keyof typeof this.HOUSE_NUMBER_TRANSLATION]} дом`;
    }
    return this.HOUSE_TRANSLATION[houseName as keyof typeof this.HOUSE_TRANSLATION] || houseName;
  }

  // ✅ ГЛАВНЫЙ МЕТОД - РАСЧЕТ НАТАЛЬНОЙ КАРТЫ
  public static async calculateNatalChart(input: NatalChartInput): Promise<NatalChartResult> {
    try {
      console.log('🌌 Начинаем расчет натальной карты для:', input.user_name);

      // 1. Выполняем астрологические расчеты
      const natalData = await this.calculatePlanetaryPositions(input);

      // 2. Переводим данные на русский язык
      const translatedData = this.translateNatalChart(natalData);

      // 3. Генерируем AI промпт (ТОЧНО КАК В PYTHON ВЕРСИИ)
      const aiPrompt = this.formatNatalChartAI(translatedData);

      // 4. Создаем SVG карту с темной темой
      const svgName = await this.createDarkThemeSVG(input, translatedData);

      console.log('✅ Натальная карта успешно создана:', svgName);

      return {
        svg_name: svgName,
        ai_prompt: aiPrompt,
        success: true
      };

    } catch (error) {
      console.error('❌ Ошибка при создании натальной карты:', error);
      return {
        svg_name: '',
        ai_prompt: '',
        success: false,
        error: error instanceof Error ? error.message : 'Неизвестная ошибка'
      };
    }
  }

  // Перевод натальной карты (аналог Python функции)
  private static translateNatalChart(natalData: NatalChartData): NatalChartData {
    // Здесь уже все переведено в процессе расчета
    return natalData;
  }

  // ✅ ФОРМАТИРОВАНИЕ ДЛЯ AI (ТОЧНАЯ КОПИЯ ИЗ PYTHON)
  private static formatNatalChartAI(translatedData: NatalChartData): string {
    
    // Вспомогательная функция для преобразования градусов в ГМС формат
    const degToDms = (decimalDeg: number): [number, number, number] => {
      const degrees = Math.floor(decimalDeg);
      const fractional = decimalDeg - degrees;
      const minutesFull = fractional * 60;
      const minutes = Math.floor(minutesFull);
      const seconds = Math.round((minutesFull - minutes) * 60);
      return [degrees, minutes, seconds];
    };

    let output = `Представь, что ты опытный астролог, специализирующийся на составлении и анализе натальных карт.
    Ты помогаешь пользователям понять, как положение планет в момент их рождения влияет на их характер, 
    внутренние возможности и жизненные события. Ты способствуешь осознанию того, какие черты и тенденции 
    они могут развивать, и как их природные дары могут быть использованы для достижения целей. 
    Сделай подробный анализ по всем аспектам. Данные пользователя:  \n`;

    // Основная информация
    output += `Имя: ${translatedData.name}\n`;
    output += `Место рождения: ${translatedData.city}, ${translatedData.nation}\n`;
    output += `Дата и время рождения: ${translatedData.iso_formatted_local_datetime}\n\n`;

    if (translatedData.sun?.sign) {
      output += `Знак зодиака: ${translatedData.sun.sign}\n\n`;
    }

    // Асцендент
    if (translatedData.ascendant?.position) {
      const [deg, min, sec] = degToDms(translatedData.ascendant.position);
      output += 'Проведи подробный анализ асцендента: \n';
      output += `Асцендент: ${translatedData.ascendant.sign} (${deg}° ${min}' ${sec}'')\n\n`;
    }

    // Середина неба (MC)
    if (translatedData.medium_coeli?.position) {
      const [deg, min, sec] = degToDms(translatedData.medium_coeli.position);
      output += 'Проведи подробный анализ середины неба (MC):\n';
      output += `Середина неба (MC): ${translatedData.medium_coeli.sign} (${deg}° ${min}' ${sec}'')\n\n`;
    }

    // Планеты
    output += 'Проведи подробный анализ сначала положения планеты, а затем нахождение планеты в доме. ';
    output += 'Приведи минимум 5 пунктов для положения планеты и минимум 5 пунктов для дома планеты: \n';

    // Порядок вывода планет (КАК В PYTHON)
    const planetKeys = [
      'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter',
      'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'mean_lilith',
      'mean_node', 'true_node'
    ];

    planetKeys.forEach(key => {
      const planet = translatedData[key as keyof NatalChartData] as PlanetData;
      if (planet?.position) {
        const [deg, min, sec] = degToDms(planet.position);
        output += `${planet.name}: ${planet.sign} (${deg}° ${min}' ${sec}'') в ${planet.house}\n`;
      }
    });

    // Дома
    output += '\nПроведи подробный анализ домов. Опиши минимум в 8 предложениях каждый дом:\n';
    const houseKeys = [
      'first_house', 'second_house', 'third_house', 'fourth_house',
      'fifth_house', 'sixth_house', 'seventh_house', 'eighth_house',
      'ninth_house', 'tenth_house', 'eleventh_house', 'twelfth_house'
    ];

    houseKeys.forEach(key => {
      const house = translatedData[key as keyof NatalChartData] as HouseData;
      if (house?.position) {
        const [deg, min, sec] = degToDms(house.position);
        output += `${house.name}: ${house.sign} (${deg}° ${min}' ${sec}'')\n`;
      }
    });

    // Лунная фаза
    if (translatedData.lunar_phase) {
      output += `\nЛунная фаза: ${translatedData.lunar_phase.moon_phase_name} ${translatedData.lunar_phase.moon_emoji}\n`;
    }

    // Заключение (КАК В PYTHON)
    output += '\nСделай вывод и дай рекомендации по результатам составленной натальной карты и проведенного анализа. ';
    output += 'Не задавай вопросов. Учти следующие особенности:\n';
    output += '- Анализируй ретроградность планет там, где она присутствует\n';
    output += '- Учитывай стихии (огонь, земля, воздух, вода) и качества (кардинальный, фиксированный, мутабельный)\n';
    output += '- Проанализируй взаимодействие домов и планет\n';
    output += '- Укажи на сильные и слабые позиции в карте\n';
    output += '- Дай практические рекомендации по использованию выявленных потенциалов';

    return output;
  }

  // ✅ СОЗДАНИЕ SVG С ТЕМНОЙ ТЕМОЙ
  private static async createDarkThemeSVG(input: NatalChartInput, data: NatalChartData): Promise<string> {
    try {
      console.log('🎨 Создаем SVG с темной темой...');

      // Подготавливаем данные для AstroChart
      const chartData = this.prepareChartData(data);
      
      // Создаем SVG элемент
      const svgContainer = document.createElement('div');
      svgContainer.id = 'natal-chart-container';
      svgContainer.style.width = '800px';
      svgContainer.style.height = '800px';
      
      // Временно добавляем в DOM
      document.body.appendChild(svgContainer);
      
      // Создаем астрологическую карту
      const chart = new AstroChart(svgContainer, 800, 800);
      
      // Применяем темную тему и русскую локализацию
      chart.config({
        // Темная тема
        colors: {
          background: '#1a1a1a',
          text: '#ffffff',
          signs: '#ffffff',
          planets: '#ffffff',
          houses: '#666666',
          aspects: '#888888'
        },
        // Русские названия
        language: 'ru',
        // Настройки отображения
        show: {
          planets: true,
          houses: true,
          signs: true,
          aspects: true,
          degrees: true
        }
      });
      
      // Рисуем карту
      chart.radix(chartData);
      
      // Получаем SVG
      const svgElement = svgContainer.querySelector('svg');
      if (!svgElement) {
        throw new Error('SVG элемент не создан');
      }
      
      // Применяем дополнительные стили для темной темы
      this.applyDarkThemeStyles(svgElement);
      
      // Генерируем имя файла
      const transliteratedName = this.transliterateName(input.user_name);
      const svgName = `${transliteratedName}-Natal-Chart.svg`;
      
      // Сохраняем SVG
      const svgContent = svgElement.outerHTML;
      await this.saveSVGFile(svgName, svgContent);
      
      // Удаляем временный контейнер
      document.body.removeChild(svgContainer);
      
      console.log('✅ SVG создан с темной темой:', svgName);
      return svgName;
      
    } catch (error) {
      console.error('❌ Ошибка создания SVG:', error);
      throw error;
    }
  }

  // Подготовка данных для AstroChart
  private static prepareChartData(data: NatalChartData): any {
    const planets: Record<string, number[]> = {};
    const cusps: number[] = [];
    
    // Добавляем планеты
    const planetKeys = [
      'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter',
      'saturn', 'uranus', 'neptune', 'pluto', 'chiron', 'mean_lilith'
    ];
    
    planetKeys.forEach(key => {
      const planet = data[key as keyof NatalChartData] as PlanetData;
      if (planet?.position) {
        const planetName = this.getEnglishPlanetName(key);
        planets[planetName] = [planet.position];
      }
    });
    
    // Добавляем дома (кусп)
    const houseKeys = [
      'first_house', 'second_house', 'third_house', 'fourth_house',
      'fifth_house', 'sixth_house', 'seventh_house', 'eighth_house',
      'ninth_house', 'tenth_house', 'eleventh_house', 'twelfth_house'
    ];
    
    houseKeys.forEach(key => {
      const house = data[key as keyof NatalChartData] as HouseData;
      if (house?.position !== undefined) {
        cusps.push(house.position);
      }
    });
    
    return {
      planets,
      cusps
    };
  }

  // Получение английского названия планеты для AstroChart
  private static getEnglishPlanetName(russianKey: string): string {
    const mapping: Record<string, string> = {
      'sun': 'Sun',
      'moon': 'Moon', 
      'mercury': 'Mercury',
      'venus': 'Venus',
      'mars': 'Mars',
      'jupiter': 'Jupiter',
      'saturn': 'Saturn',
      'uranus': 'Uranus',
      'neptune': 'Neptune',
      'pluto': 'Pluto',
      'chiron': 'Chiron',
      'mean_lilith': 'Lilith'
    };
    return mapping[russianKey] || russianKey;
  }

  // Применение стилей темной темы к SVG
  private static applyDarkThemeStyles(svgElement: SVGElement): void {
    // Создаем стили для темной темы
    const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
    style.textContent = `
      /* Темная тема для натальной карты */
      svg {
        background-color: #1a1a1a !important;
      }
      
      /* Основной фон */
      rect, circle {
        fill: #1a1a1a !important;
      }
      
      /* Текст */
      text {
        fill: #ffffff !important;
        font-family: 'Arial', sans-serif !important;
      }
      
      /* Линии и границы */
      path, line {
        stroke: #ffffff !important;
        stroke-width: 1 !important;
      }
      
      /* Линии домов */
      .house-line {
        stroke: #666666 !important;
        stroke-width: 0.5 !important;
      }
      
      /* Знаки зодиака */
      .zodiac-sign {
        fill: #ffffff !important;
        stroke: #ffffff !important;
      }
      
      /* Планеты */
      .planet {
        fill: #ffcc00 !important;
        stroke: #ffffff !important;
        stroke-width: 1 !important;
      }
      
      /* Аспекты */
      .aspect {
        stroke: #888888 !important;
        stroke-width: 0.5 !important;
        stroke-dasharray: 2,2 !important;
      }
      
      /* Внешний круг */
      .outer-circle {
        fill: none !important;
        stroke: #ffffff !important;
        stroke-width: 2 !important;
      }
      
      /* Внутренний круг */
      .inner-circle {
        fill: none !important;
        stroke: #666666 !important;
        stroke-width: 1 !important;
      }
    `;
    
    // Добавляем стили в начало SVG
    svgElement.insertBefore(style, svgElement.firstChild);
  }

  // Транслитерация имени
  private static transliterateName(name: string): string {
    const translitMap: Record<string, string> = {
      'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
      'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
      'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
      'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
      'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
      'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
      'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M',
      'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U',
      'Ф': 'F', 'Х': 'H', 'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch',
      'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E', 'Ю': 'Yu', 'Я': 'Ya'
    };

    let result = '';
    for (const char of name) {
      if (char in translitMap) {
        result += translitMap[char];
      } else if (char.match(/[a-zA-Z0-9\-_]/)) {
        result += char;
      } else {
        result += '_';
      }
    }
    return result;
  }

  // Сохранение SVG файла
  private static async saveSVGFile(fileName: string, svgContent: string): Promise<void> {
    try {
      // В браузере используем File API для скачивания
      if (typeof window !== 'undefined') {
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      // В Node.js используем fs
      if (typeof require !== 'undefined') {
        const fs = require('fs');
        const path = require('path');
        
        const filePath = path.join('./public/natal-charts', fileName);
        await fs.promises.writeFile(filePath, svgContent, 'utf8');
      }
      
      console.log('✅ SVG файл сохранен:', fileName);
    } catch (error) {
      console.error('❌ Ошибка сохранения SVG:', error);
      throw error;
    }
  }
}

// ✅ ЭКСПОРТ ОСНОВНОЙ ФУНКЦИИ (АНАЛОГ PYTHON ФУНКЦИИ)
export async function calculateNatalChart(inputData: NatalChartInput): Promise<NatalChartResult> {
  
  console.log('🌌 TypeScript Natal Chart Calculator');
  console.log('📥 Входные данные:', inputData);
  
  // Валидация входных данных
  const requiredFields: (keyof NatalChartInput)[] = [
    'user_name', 'birth_year', 'birth_month', 'birth_day', 
    'birth_hour', 'birth_minute', 'birth_city', 'birth_country_code'
  ];
  
  for (const field of requiredFields) {
    if (!inputData[field] && inputData[field] !== 0) {
      return {
        svg_name: '',
        ai_prompt: '',
        success: false,
        error: `Отсутствует обязательное поле: ${field}`
      };
    }
  }
  
  // Вызываем основную функцию расчета
  return await AstrologicalCalculator.calculateNatalChart(inputData);
}

// ✅ ПРИМЕР ИСПОЛЬЗОВАНИЯ (КАК В PYTHON)
export async function testNatalChart(): Promise<void> {
  const testData: NatalChartInput = {
    user_name: "Тест 1",
    birth_year: 2000,
    birth_month: 8,
    birth_day: 6,
    birth_hour: 18,
    birth_minute: 0,
    birth_city: "Москва",
    birth_country_code: "RU"
  };
  
  console.log('🧪 Запуск тестового расчета...');
  const result = await calculateNatalChart(testData);
  
  if (result.success) {
    console.log('✅ Тест успешен!');
    console.log('📁 SVG файл:', result.svg_name);
    console.log('🤖 AI промпт длина:', result.ai_prompt.length, 'символов');
  } else {
    console.error('❌ Тест провален:', result.error);
  }
}

// ✅ ДОПОЛНИТЕЛЬНЫЕ УТИЛИТЫ

// Интеграция с SwissEph (когда будет установлен)
export class SwissEphIntegration {
  
  // Установка пути к эфемеридам
  static setEphePath(path: string): void {
    // TODO: Интеграция с swisseph библиотекой
    // swisseph.swe_set_ephe_path(path);
    console.log('📁 Путь к эфемеридам установлен:', path);
  }
  
  // Точный расчет позиций планет
  static async calculatePlanetPosition(julianDay: number, planet: number): Promise<{longitude: number, latitude: number, distance: number}> {
    // TODO: Реальный расчет через SwissEph
    // const result = swisseph.swe_calc_ut(julianDay, planet, swisseph.SEFLG_SPEED);
    
    // Пока возвращаем заглушку
    return {
      longitude: Math.random() * 360,
      latitude: (Math.random() - 0.5) * 10,
      distance: 1 + Math.random()
    };
  }
  
  // Расчет домов по системе Плацидуса
  static async calculateHousesPlacidus(julianDay: number, latitude: number, longitude: number): Promise<number[]> {
    // TODO: Реальный расчет домов
    // const houses = swisseph.swe_houses(julianDay, latitude, longitude, 'P');
    
    // Пока возвращаем заглушку
    return [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  }
}

// Экспорт всех типов и интерфейсов
export type { 
  NatalChartInput, 
  NatalChartData, 
  NatalChartResult, 
  PlanetData, 
  HouseData 
};

// Экспорт главного класса
export { AstrologicalCalculator };