import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  AutoAwesome, 
  Favorite, 
  Work, 
  LocalFlorist, 
  AttachMoney,
  RefreshOutlined,
  AutoGraph,
  AutoFixHighOutlined
} from "@mui/icons-material";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { getCompatibleSigns } from "@/lib/zodiac";
import DecorativeSymbols from "./decorative-symbols";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import CosmicLoader from "@/components/shared/cosmic-loader";

type HoroscopeCardProps = {
  period: "today" | "week" | "month";
  zodiacSign: string;
};

type Category = "general" | "love" | "career" | "health" | "finance";

type CategoryInfo = {
  name: string;
  icon: React.ReactNode;
  color: string;
  disabled: boolean;
};

// Демо-данные для гороскопов
const demoHoroscopes: Record<Category, Record<string, string>> = {
  general: {
    today: "Сегодня для вас особенный день с новыми возможностями. Интуиция поможет принять важные решения. Обратите внимание на мелкие детали, которые обычно упускаете из виду.",
    week: "На этой неделе вас ждут неожиданные перемены. Будьте открыты новым идеям и знакомствам. Возможно получение важной информации в середине недели.",
    month: "Этот месяц станет временем значительных перемен. Внимательно отнеситесь к своему окружению и не принимайте поспешных решений."
  },
  love: {
    today: "В любовных отношениях сегодня царит гармония. Выскажите свои чувства открыто, это укрепит связь с партнером. Одинокие знаки могут встретить интересного человека.",
    week: "Неделя благоприятна для романтических встреч. Доверьтесь своим чувствам и интуиции. Возможно углубление существующих отношений.",
    month: "Месяц принесет стабильность в личную жизнь. Посвятите больше времени партнеру или поиску новых отношений, если вы одиноки."
  },
  career: {
    today: "На работе вас ждет успех, если проявите инициативу. Благоприятный день для представления новых идей и начала проектов. Будьте уверены в своих силах.",
    week: "Профессиональная сфера потребует концентрации и внимания к деталям. Возможно получение выгодного предложения или повышения.",
    month: "Этот месяц принесет важные перемены в карьере. Будьте готовы принимать ответственные решения и брать на себя новые обязательства."
  },
  health: {
    today: "Обратите внимание на свое самочувствие. Легкие физические упражнения помогут поддержать энергию в течение дня. Избегайте стрессовых ситуаций.",
    week: "Здоровье потребует особого внимания. Найдите баланс между работой и отдыхом, включите в рацион больше фруктов и овощей.",
    month: "Месяц благоприятен для начала новых оздоровительных практик. Обратите внимание на качество сна и питания."
  },
  finance: {
    today: "Финансовая ситуация стабильна. Хороший день для планирования бюджета и долгосрочных инвестиций. Избегайте импульсивных покупок.",
    week: "Неделя подходит для финансовых операций и вложений. Будьте внимательны при подписании документов, связанных с деньгами.",
    month: "Месяц принесет финансовую стабильность. Возможно получение дополнительного дохода или выгодное приобретение."
  }
};

// Демо данные для счастливых чисел
const demoLuckyNumbers: Record<string, number[]> = {
  aries: [7, 15, 23],
  taurus: [2, 12, 33],
  gemini: [5, 14, 23],
  cancer: [3, 9, 30],
  leo: [1, 10, 19],
  virgo: [5, 14, 23],
  libra: [4, 13, 22],
  scorpio: [8, 17, 26],
  sagittarius: [3, 12, 21],
  capricorn: [2, 8, 20],
  aquarius: [4, 11, 29],
  pisces: [3, 7, 12]
};

// Типы для совместимых знаков с процентом совместимости
type CompatibleSign = {
  name: string;
  compatibility: number;
};

// Тип данных для ответа от API гороскопа
type HoroscopeResponse = {
  content: string;
  luckyNumbers: number[];
  compatibleSigns: CompatibleSign[];
  lastUpdated: string;
};

export default function HoroscopeCard({ period, zodiacSign }: HoroscopeCardProps) {
  const { toast } = useToast();
  const [activeCategory, setActiveCategory] = useState<Category>("general");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  
  // Определяем, какой тип подписки у пользователя (для демо всегда "free")
  const subscriptionType = "free";
  
  // Запрос для получения гороскопа (с обработкой ошибок)
  const { 
    data: horoscopeData,
    isLoading,
    error 
  } = useQuery<HoroscopeResponse>({
    queryKey: ['/api/horoscope', period, activeCategory, zodiacSign],
    queryFn: async () => {
      try {
        // Сначала пытаемся получить данные от защищенного API
        try {
          // Для счастливых чисел используем наш промпт:
          // "Ты профессиональный астролог. Определи 3 счастливых числа. Имя – [имя]. Дата рождения - [дата рождения]. В ответе покажи только числа"
          
          // Для совместимых знаков также используем наш промпт:
          // "Ты профессиональный астролог. Определи 3 знака зодиака, наиболее совместимых с: имя – [имя], дата рождения - [дата рождения]. В ответе покажи только названия знаком зодиака и процент совместимости"
          
          const authRes = await fetch(`/api/horoscope?period=${period}&category=${activeCategory}`);
          
          if (authRes.ok) {
            return await authRes.json();
          }
        } catch (authErr) {
          console.log("Не удалось получить данные от аутентифицированного API:", authErr);
        }
        
        // Если защищенный API недоступен, используем демо-API
        console.log(`Использование демо API с параметрами: знак=${zodiacSign}, период=${period}, категория=${activeCategory}`);
        const demoRes = await fetch(`/api/demo-horoscope?period=${period}&category=${activeCategory}&sign=${zodiacSign}`);
        
        if (demoRes.ok) {
          return await demoRes.json();
        }
        
        throw new Error("Оба API недоступны");
      } catch (err) {
        console.error("Ошибка при запросе гороскопа:", err);
        // В случае ошибки также возвращаем локальные демо-данные
        
        // Преобразуем обычные строковые совместимые знаки в объекты с процентом совместимости
        const compatibleSignsWithPercent = getCompatibleSigns(zodiacSign).map(sign => ({
          name: sign,
          compatibility: Math.floor(Math.random() * 31) + 70 // Рандомное число от 70 до 100
        }));
        
        return {
          content: demoHoroscopes[activeCategory][period],
          luckyNumbers: demoLuckyNumbers[zodiacSign.toLowerCase()] || [7, 14, 21],
          compatibleSigns: compatibleSignsWithPercent,
          lastUpdated: new Date().toISOString()
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 минут
  });
  
  // Вспомогательные функции для работы с цветами категорий
  const getCategoryColor = (colorClass: string, opacity: number) => {
    switch (colorClass) {
      case 'text-amber-300': return `rgba(255,215,0,${opacity})`;
      case 'text-red-400': return `rgba(248,113,113,${opacity})`;
      case 'text-blue-400': return `rgba(96,165,250,${opacity})`;
      case 'text-green-400': return `rgba(74,222,128,${opacity})`;
      case 'text-yellow-400': return `rgba(234,179,8,${opacity})`;
      default: return `rgba(255,215,0,${opacity})`;
    }
  };
  
  const getCategoryGradient = (colorClass: string, opacity: number) => {
    const color = getCategoryColor(colorClass, opacity);
    const alpha = opacity * 0.6;
    return `linear-gradient(135deg, ${color}, rgba(84,40,176,${alpha}))`;
  };
  
  // Измененные иконки с увеличенным размером (пункт 2 ТЗ)
  const categories: Record<Category, CategoryInfo> = {
    general: { 
      name: "Общее", 
      icon: <AutoAwesome fontSize="medium" className="text-amber-300" />, 
      color: "text-amber-300",
      disabled: false
    },
    love: { 
      name: "Любовь", 
      icon: <Favorite fontSize="medium" className="text-red-400" />, 
      color: "text-red-400",
      disabled: false
    },
    career: { 
      name: "Карьера", 
      icon: <Work fontSize="medium" className="text-blue-400" />, 
      color: "text-blue-400",
      disabled: false
    },
    health: { 
      name: "Здоровье", 
      icon: <LocalFlorist fontSize="medium" className="text-green-400" />, 
      color: "text-green-400",
      disabled: false
    },
    finance: { 
      name: "Финансы", 
      icon: <AttachMoney fontSize="medium" className="text-yellow-400" />, 
      color: "text-yellow-400",
      disabled: false
    }
  };

  const formatDate = (date: Date) => {
    return format(date, "EEEE, d MMMM yyyy", { locale: ru });
  };

  const getPeriodLabel = () => {
    switch (period) {
      case "today":
        return formatDate(new Date());
      case "week":
        return "Неделя";
      case "month":
        return "Месяц";
      default:
        return "";
    }
  };

  // Мутация для обновления гороскопа
  const refreshMutation = useMutation({
    mutationFn: async () => {
      setIsRefreshing(true);
      const res = await apiRequest('POST', '/api/horoscope/refresh', {
        period,
        category: activeCategory
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Не удалось обновить гороскоп');
      }
      
      return await res.json();
    },
    onSuccess: () => {
      // После успешного обновления, сбрасываем кэш для запроса гороскопа
      queryClient.invalidateQueries({queryKey: ['/api/horoscope', period, activeCategory]});
      
      // Более информативное уведомление при обновлении (пункт 14 ТЗ)
      toast({
        title: "Гороскоп обновлен",
        description: "Звезды раскрыли новые предсказания для вас",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Невозможно обновить гороскоп",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsRefreshing(false);
    }
  });
  
  // Обработчик кнопки обновления
  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  // Получаем текст гороскопа из данных API или используем демо-данные, если API недоступно
  const horoscopeText = horoscopeData?.content || 
    demoHoroscopes[activeCategory][period] || 
    "Сегодня для вас будет важный день. Доверьтесь своей интуиции и будьте открыты новому опыту.";
  
  // Получаем счастливые числа из данных API или используем демо-данные
  const luckyNumbers = horoscopeData?.luckyNumbers || 
    demoLuckyNumbers[zodiacSign.toLowerCase()] || 
    [7, 14, 21];
  
  // Получаем совместимые знаки из данных API или используем метод из библиотеки зодиака
  let compatibleSigns = horoscopeData?.compatibleSigns;
  if (!compatibleSigns || !Array.isArray(compatibleSigns) || compatibleSigns.length === 0) {
    // fallback на демо-значения
    compatibleSigns = getCompatibleSigns(zodiacSign).slice(0, 3).map(sign => ({
      name: sign,
      compatibility: Math.floor(Math.random() * 21) + 80 // 80-100%
    }));
  } else {
    // если вдруг пришли строки, а не объекты
    compatibleSigns = compatibleSigns.map(sign =>
      typeof sign === "string"
        ? { name: sign, compatibility: Math.floor(Math.random() * 21) + 80 }
        : sign
    );
  }
  
  // Получаем символ для знака зодиака
  const getZodiacSymbol = (sign: string) => {
    const symbols: Record<string, string> = {
      aries: "♈",
      taurus: "♉",
      gemini: "♊",
      cancer: "♋",
      leo: "♌",
      virgo: "♍",
      libra: "♎",
      scorpio: "♏",
      sagittarius: "♐",
      capricorn: "♑",
      aquarius: "♒",
      pisces: "♓"
    };
    
    return symbols[sign.toLowerCase()] || "♉";
  };
  
  // Получаем русское название знака зодиака
  const getZodiacRussianName = (sign: string) => {
    const names: Record<string, string> = {
      aries: "Овен",
      taurus: "Телец",
      gemini: "Близнецы",
      cancer: "Рак",
      leo: "Лев",
      virgo: "Дева",
      libra: "Весы",
      scorpio: "Скорпион",
      sagittarius: "Стрелец",
      capricorn: "Козерог",
      aquarius: "Водолей",
      pisces: "Рыбы"
    };
    
    return names[sign.toLowerCase()] || "Телец";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="card rounded-xl p-6 mb-6 relative overflow-hidden">
        {/* Декоративные элементы по углам */}
        <DecorativeSymbols type="astrology" />
        
        {/* Заголовок с градиентной обводкой и золотым подчеркиванием */}
        <div className="flex justify-between mb-5 relative">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="relative"
          >
            <h3 className="text-4xl font-cinzel font-bold text-gold-gradient title-glow" data-text={getZodiacRussianName(zodiacSign)}>
              {getZodiacRussianName(zodiacSign)}
            </h3>
            <div className="h-px w-3/4 bg-gradient-to-r from-[#FFD700] to-transparent mt-1 cosmic-pulse"></div>
            <p className="text-base text-gray-300 font-cormorant mt-1">{getPeriodLabel()}</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="flex items-center gap-2"
            whileHover={{ rotate: [0, 5, -5, 0], transition: { duration: 0.5 } }}
          >
            <div className="relative">
              <div className="absolute inset-0 rounded-full opacity-60 bg-[rgba(255,215,0,0.2)]" 
                   style={{
                     filter: "blur(10px)",
                     animation: "cosmicPulse 3s ease-in-out infinite"
                   }}></div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgba(155,89,182,0.4)] to-[rgba(84,40,176,0.6)] backdrop-blur-sm border border-[rgba(255,215,0,0.5)] flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.3),inset_0_0_10px_rgba(255,255,255,0.2)]">
                <span className="text-3xl" style={{
                  background: "linear-gradient(to bottom, #f0d264 30%, #e6c555 70%)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  color: "transparent",
                  filter: "drop-shadow(0 0 5px rgba(255, 215, 0, 0.5))"
                }}>{getZodiacSymbol(zodiacSign)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Показываем прелоадер при загрузке данных */}
        {isLoading ? (
          <div className="min-h-[240px] flex flex-col items-center justify-center">
            <CosmicLoader size="medium" text="Соединяемся со звездами..." />
          </div>
        ) : (
          /* Категории и контент */
          <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as Category)}>
            {/* Категории в стиле мистических плиток */}
            <div className="mb-2">
              {/* Новый дизайн категорий в стиле плиток */}
              <TabsList className="grid grid-cols-5 gap-1 p-1 mx-auto bg-transparent">
                {Object.entries(categories).map(([key, category], index) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                    className="relative"
                  >
                    <TabsTrigger
                      value={key}
                      disabled={category.disabled}
                      className={`crystal-tab group w-full h-[44px] py-1 px-1 flex flex-col items-center justify-center z-10
                        ${category.disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:text-white hover:opacity-80'}`}
                      data-category={key}
                    >
                      {/* Декоративный эффект стеклянной поверхности */}
                      <div className="absolute inset-0 rounded-lg overflow-hidden">
                        {/* Блик сверху */}
                        <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-white to-transparent opacity-[0.07] rounded-t-lg"></div>
                        
                        {/* Светящийся край снизу для активной вкладки */}
                        {key === activeCategory && (
                          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent opacity-40"></div>
                        )}
                      </div>
                      
                      {/* Мистический эффект для активной категории - хрустальный шар */}
                      {key === activeCategory && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="relative h-full w-full flex items-center justify-center">
                            {/* Внешнее свечение хрустального шара */}
                            <div 
                              className="absolute rounded-full w-[70%] h-[70%] opacity-30"
                              style={{
                                background: `radial-gradient(circle, ${getCategoryColor(category.color, 0.7)}, transparent 70%)`,
                                filter: 'blur(8px)',
                                animation: 'cosmicPulse 5s ease-in-out infinite'
                              }}
                            ></div>
                            
                            {/* Внутреннее свечение хрустального шара */}
                            <div 
                              className="absolute rounded-full w-[50%] h-[50%] opacity-30"
                              style={{
                                background: `radial-gradient(circle, ${getCategoryColor(category.color, 0.6)}, transparent 80%)`,
                                filter: 'blur(5px)',
                                animation: 'cosmicPulse 3s ease-in-out infinite reverse'
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Иконка категории - используем иконки с увеличенным размером */}
                      <div className={`text-lg transition-all duration-300 ${key === activeCategory ? 'scale-110' : 'scale-100'}`}>
                        {category.icon}
                      </div>
                      
                      {/* Название категории - увеличиваем размер шрифта (пункт 2 ТЗ) */}
                      <span 
                        className={`text-center transition-all duration-300 font-cinzel text-[13px] mt-[2px]
                          ${key === activeCategory ? 'font-medium' : 'font-normal'}`}
                        style={{
                          textShadow: key === activeCategory ? `0 0 4px ${getCategoryColor(category.color, 0.5)}` : 'none'
                        }}
                      >
                        {category.name}
                      </span>
                      
                      {/* Значок замка для заблокированных категорий */}
                      {category.disabled && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full 
                                         bg-gradient-to-br from-[rgba(0,0,0,0.7)] to-[rgba(84,40,176,0.8)] 
                                         border border-[rgba(155,89,182,0.5)] z-20 shadow-lg">
                          <span className="text-[8px] text-white">🔒</span>
                        </div>
                      )}
                    </TabsTrigger>
                  </motion.div>
                ))}
              </TabsList>
            </div>

            {/* Контент гороскопа без выделения в квадрат (пункт 7 ТЗ) */}
            <div className="px-1 py-3">
              {Object.keys(categories).map((key) => (
                <TabsContent key={key} value={key} className="mb-5 px-2 relative z-10">
                  <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: key === activeCategory ? 1 : 0 }}
                    transition={{ duration: 0.5 }}
                    // Уменьшаем размер шрифта (пункт 13 ТЗ)
                    className="text-gray-200 font-cormorant text-lg leading-relaxed"
                  >
                    {key === activeCategory ? horoscopeText : ""}
                  </motion.p>
                </TabsContent>
              ))}
            </div>
          </Tabs>
        )}

        {/* Счастливые числа с эффектом свечения */}
        {!isLoading && (
          <motion.div 
            className="mb-5 fade-in-up delay-200"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <h4 className="section-title text-gold-gradient font-cinzel text-lg mb-3" data-text="Счастливые числа">Счастливые числа</h4>
            <div className="lucky-numbers-container flex gap-4 p-3 justify-center bg-[#1a1331]/70 rounded-xl backdrop-blur-sm border border-[#8a2be2]/20">
              {luckyNumbers.map((number, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.15, y: -5 }}
                  whileTap={{ scale: 0.9 }}
                  className="lucky-number w-14 h-14 text-2xl font-bold relative flex items-center justify-center"
                  style={{ 
                    background: `linear-gradient(135deg, #2a1a4a 0%, #1a1331 100%)`,
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)',
                    color: 'white',
                  }}
                >
                  <div className="absolute inset-0 rounded-xl overflow-hidden opacity-10">
                    <div className="w-full h-full" style={{
                      backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 60% 70%, white 1px, transparent 1px)',
                      backgroundSize: '20px 20px'
                    }}></div>
                  </div>
                  <span className="relative z-10" style={{
                    background: 'linear-gradient(to bottom, #ffffff, #ffd700)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {number}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Совместимые знаки с процентом совместимости */}
        {!isLoading && (
          <motion.div 
            className="mb-5 fade-in-up delay-300"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
          >
            <h4 className="section-title text-gold-gradient font-cinzel text-lg mb-3" data-text="Совместимые знаки">Совместимые знаки</h4>
            <div className="compatible-signs-container p-4 rounded-xl bg-[#1a1331]/70 border border-[#8a2be2]/20 backdrop-blur-sm">
              <div className="flex flex-wrap gap-5 justify-center">
                {compatibleSigns.length > 0 ? compatibleSigns.map((sign, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.98 }}
                    className="compatible-sign flex items-center bg-[#2a1a4a] px-4 py-2 rounded-lg space-x-3 border-2 border-[#8a2be2]/30"
                    style={{
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {/* Символ знака */}
                    <div className="w-10 h-10 rounded-md bg-[#1a1331] flex items-center justify-center relative"
                      style={{
                        border: '1px solid rgba(255, 215, 0, 0.6)',
                        boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                      }}
                    >
                      <span className="text-2xl" 
                        style={{
                          color: '#FFD700',
                          textShadow: '0 0 6px rgba(255, 215, 0, 0.8)',
                          fontWeight: 'bold'
                        }}
                      >
                        {getZodiacSymbol(sign.name)}
                      </span>
                    </div>
                    {/* Название знака и процент совместимости */}
                    <div className="flex flex-col">
                      <span className="text-base font-cinzel font-medium text-white" style={{
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.4)'
                      }}>
                        {getZodiacRussianName(sign.name)}
                      </span>
                      <span className="text-sm font-medium text-amber-300" style={{
                        textShadow: '0 2px 3px rgba(0, 0, 0, 0.5)'
                      }}>
                        {sign.compatibility}% совместимости
                      </span>
                    </div>
                  </motion.div>
                )) : (
                  <span className="text-gray-400">Нет данных</span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Кнопка обновления */}
        {!isLoading && (
          <div className="flex justify-end">
            <motion.div 
              className="relative overflow-hidden"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{ 
                filter: isRefreshing ? "drop-shadow(0 0 10px rgba(177,151,252,0.5))" : "none",
                transition: "filter 0.3s ease"
              }}
            >
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefresh}
                className="rounded-full border-[rgba(177,151,252,0.6)] bg-[rgba(84,40,176,0.1)] backdrop-blur-sm flex items-center gap-2"
                disabled={isRefreshing || refreshMutation.isPending}
                style={{
                  textShadow: "0 0 3px rgba(177,151,252,0.5)"
                }}
              >
                {(isRefreshing || refreshMutation.isPending) ? (
                  <div className="mr-1">
                    <CosmicLoader size="small" text="" />
                  </div>
                ) : (
                  <AutoFixHighOutlined fontSize="small" className="text-[rgba(177,151,252,0.9)] mr-1" />
                )}
                <span>{(isRefreshing || refreshMutation.isPending) ? "Обновление..." : "Обновить"}</span>
              </Button>
            </motion.div>
          </div>
        )}

        {/* Блок подписки */}
        {!isLoading && subscriptionType === "free" && (
          <motion.div 
            className="relative overflow-hidden rounded-lg p-5 text-center mt-6 fade-in-up delay-400 mystical-shimmer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            style={{
              backdropFilter: "blur(5px)",
              border: "1px solid rgba(255, 215, 0, 0.3)",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4), 0 0 15px rgba(155, 89, 182, 0.3)"
            }}
          >
            <div className="absolute top-[-50px] right-[-50px] w-[100px] h-[100px] rounded-full bg-[rgba(255,215,0,0.1)]" 
                 style={{filter: "blur(30px)"}} />
            <div className="absolute bottom-[-30px] left-[-30px] w-[60px] h-[60px] rounded-full bg-[rgba(155,89,182,0.15)]" 
                 style={{filter: "blur(20px)"}} />
                 
            <p className="text-lg font-cormorant relative z-10">Разблокируйте все категории гороскопа и расширенное чтение</p>
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="relative z-10"
            >
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-full font-cinzel px-6 py-2 border-[rgba(255,215,0,0.6)] bg-gradient-to-r from-[rgba(255,215,0,0.2)] to-[rgba(255,215,0,0.1)] hover:from-[rgba(255,215,0,0.3)] hover:to-[rgba(255,215,0,0.2)] text-[#FFD700] shadow-[0_5px_15px_rgba(255,215,0,0.3)]"
                style={{
                  textShadow: "0 0 5px rgba(255, 215, 0, 0.5)"
                }}
              >
                <span className="title-glow text-gold-gradient" data-text="Улучшить подписку">Улучшить подписку</span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}