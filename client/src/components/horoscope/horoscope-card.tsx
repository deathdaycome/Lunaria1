import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
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
import { getZodiacSign } from "@/lib/zodiac";

export type HoroscopeCardRef = {
  handleRefresh: () => void;
};

type HoroscopeCardProps = {
  period: "today" | "week" | "month";
  zodiacSign: string;
  userId: number;
  userName: string;
  userBirthDate: string;
  subscriptionType: string;
};

type Category = "general" | "love" | "career" | "health" | "finance";

type CategoryInfo = {
  name: string;
  icon: React.ReactNode;
  color: string;
  disabled: boolean;
};

type HoroscopeResponse = {
  content: string;
  luckyNumbers: number[];
  compatibleSigns: { name: string; compatibility: number; }[];
  lastUpdated: string;
  canRefresh: boolean;
  nextRefreshDate?: string;
};

const HoroscopeCard = forwardRef<{ handleRefresh: () => void }, HoroscopeCardProps>(
  ({ period, zodiacSign, userId, userName, userBirthDate, subscriptionType }, ref) => {
    const { toast } = useToast();
    const [activeCategory, setActiveCategory] = useState<Category>("general");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const queryClient = useQueryClient();
    
    // ✨ ВОЗВРАЩАЕМСЯ К РАБОТАЮЩЕМУ GET ЗАПРОСУ с добавлением mapping
    const { 
      data: horoscopeData,
      isLoading,
      error 
    } = useQuery<HoroscopeResponse>({
      queryKey: ['/api/horoscope', userId, period, activeCategory, zodiacSign],
      queryFn: async (): Promise<HoroscopeResponse> => {
        // ✨ MAPPING категорий для соответствия openai.ts
        const categoryMapping: Record<Category, string> = {
          general: "general",
          love: "love", 
          career: "career",
          health: "health",
          finance: "money" // ✨ ВАЖНО: finance → money
        };

        // ✨ ВОЗВРАЩАЕМСЯ К GET ЗАПРОСУ, который работал для "Общее"
        const mappedCategory = categoryMapping[activeCategory];
        const response = await fetch(`/api/horoscope?userId=${userId}&period=${period}&category=${mappedCategory}&zodiacSign=${zodiacSign}`);
        
        if (!response.ok) {
          throw new Error(`Ошибка API: ${response.status}`);
        }
        
        return response.json();
      },
      staleTime: 5 * 60 * 1000, // 5 минут
    });

    // ✨ МУТАЦИЯ тоже возвращается к POST, но с правильным mapping
    const refreshMutation = useMutation({
      mutationFn: async () => {
        setIsRefreshing(true);
        
        // ✨ MAPPING категорий
        const categoryMapping: Record<Category, string> = {
          general: "general",
          love: "love", 
          career: "career",
          health: "health",
          finance: "money"
        };

        const res = await apiRequest('POST', '/api/horoscope/refresh', {
          userId,
          period,
          category: categoryMapping[activeCategory], // ✨ Правильная категория
          zodiacSign,
          userName,
          userBirthDate
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Не удалось обновить гороскоп');
        }
        
        return await res.json();
      },
      onSuccess: (data) => {
        queryClient.invalidateQueries({queryKey: ['/api/horoscope', userId, period, activeCategory]});
        
        toast({
          title: "Гороскоп обновлен",
          description: `${userName}, звезды раскрыли новые предсказания для вас`,
          variant: "default"
        });
      },
      onError: (error: Error) => {
        let errorMessage = error.message;
        let errorTitle = "Невозможно обновить гороскоп";
        
        if (error.message.includes('уже составлен')) {
          errorTitle = `${userName}`;
          if (period === 'today') {
            errorMessage = "гороскоп на текущий день для вас уже составлен. Вы можете обновить его завтра";
          } else if (period === 'week') {
            errorMessage = "гороскоп на текущую неделю для вас уже составлен. Вы можете обновить его на следующей неделе";
          } else if (period === 'month') {
            errorMessage = "гороскоп на текущий месяц для вас уже составлен. Вы можете обновить его в следующем месяце";
          }
        }
        
        toast({
          title: errorTitle,
          description: errorMessage,
          variant: "destructive",
        });
      },
      onSettled: () => {
        setIsRefreshing(false);
      }
    });
    
    const handleRefresh = () => {
      console.log("🔥 HoroscopeCard handleRefresh вызван для пользователя:", userName);
      refreshMutation.mutate();
    };

    useImperativeHandle(ref, () => ({
      handleRefresh
    }));
    
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

    const isMonthlyDisabled = subscriptionType === "free" && period === "month";
    
    const getZodiacSymbol = (sign: string) => {
      const symbols: Record<string, string> = {
        aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋",
        leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏",
        sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓"
      };
      return symbols[sign.toLowerCase()] || "♉";
    };
    
    const getZodiacRussianName = (sign: string) => {
      const names: Record<string, string> = {
        aries: "Овен", taurus: "Телец", gemini: "Близнецы", cancer: "Рак",
        leo: "Лев", virgo: "Дева", libra: "Весы", scorpio: "Скорпион",
        sagittarius: "Стрелец", capricorn: "Козерог", aquarius: "Водолей", pisces: "Рыбы"
      };
      return names[sign.toLowerCase()] || "Телец";
    };

    // if (isMonthlyDisabled) {
    //   return (
    //     <motion.div
    //       initial={{ opacity: 0, y: 20 }}
    //       animate={{ opacity: 1, y: 0 }}
    //       transition={{ duration: 0.5 }}
    //     >
    //       <Card className="card rounded-xl p-6 mb-6 relative overflow-hidden">
    //         <DecorativeSymbols type="astrology" />
            
    //         <div className="text-center py-8">
    //           <h3 className="text-2xl font-cinzel font-bold text-gold-gradient mb-4">
    //             Месячный гороскоп
    //           </h3>
    //           <p className="text-gray-300 mb-4">
    //             Месячные гороскопы доступны только в платной версии
    //           </p>
    //           <Button 
    //             variant="outline" 
    //             className="rounded-full border-[rgba(255,215,0,0.6)] bg-gradient-to-r from-[rgba(255,215,0,0.2)] to-[rgba(255,215,0,0.1)] text-[#FFD700]"
    //           >
    //             Улучшить подписку
    //           </Button>
    //         </div>
    //       </Card>
    //     </motion.div>
    //   );
    // }

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="card rounded-xl p-6 mb-6 relative overflow-hidden">
          <DecorativeSymbols type="astrology" />
          
          <div className="flex justify-between mb-5 relative">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="relative"
            >
              <h3 className="text-4xl font-cinzel font-bold text-gold-gradient title-glow">
                {getZodiacSign(new Date(userBirthDate)).name}
              </h3>
              <div className="h-px w-3/4 bg-gradient-to-r from-[#FFD700] to-transparent mt-1 cosmic-pulse"></div>
              <p className="text-base text-gray-300 font-cormorant mt-1">{getPeriodLabel()}</p>
              {horoscopeData?.lastUpdated && (
                <p className="text-xs text-gray-400 font-cormorant mt-1">
                  Обновлено: {horoscopeData.lastUpdated}
                </p>
              )}
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[rgba(155,89,182,0.3)] to-[rgba(84,40,176,0.5)] backdrop-blur-sm border border-[rgba(255,215,0,0.4)] flex items-center justify-center">
                  <span className="text-4xl text-[#FFD700] drop-shadow-lg">
                    {getZodiacSign(new Date(userBirthDate)).symbol}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {isLoading ? (
            <div className="min-h-[240px] flex flex-col items-center justify-center">
              <CosmicLoader size="medium" text="Соединяемся со звездами..." />
            </div>
          ) : (
            <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as Category)}>
              <div className="mb-2">
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
                      >
                        <div className={`text-lg transition-all duration-300 ${key === activeCategory ? 'scale-110' : 'scale-100'}`}>
                          {category.icon}
                        </div>
                        
                        <span className={`text-center transition-all duration-300 font-cinzel text-[13px] mt-0
                            ${key === activeCategory ? 'font-medium' : 'font-normal'}`}>
                          {category.name}
                        </span>
                        
                        {category.disabled && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-gradient-to-br from-[rgba(0,0,0,0.7)] to-[rgba(84,40,176,0.8)] border border-[rgba(155,89,182,0.5)] z-20">
                            <span className="text-[8px] text-white">🔒</span>
                          </div>
                        )}
                      </TabsTrigger>
                    </motion.div>
                  ))}
                </TabsList>
              </div>

              <div className="px-1 py-3">
                {Object.keys(categories).map((key) => (
                  <TabsContent key={key} value={key} className="mb-5 px-2 relative z-10">
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: key === activeCategory ? 1 : 0 }}
                      transition={{ duration: 0.5 }}
                      className="text-gray-200 font-cormorant text-lg leading-relaxed"
                    >
                      {key === activeCategory ? horoscopeData?.content || "Загрузка предсказания..." : ""}
                    </motion.p>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          )}

          {!isLoading && horoscopeData?.luckyNumbers && (
            <motion.div className="mb-5 fade-in-up delay-200">
              <h4 className="section-title text-gold-gradient font-cinzel text-lg mb-3">Счастливые числа</h4>
              <div className="lucky-numbers-container flex gap-4 p-3 justify-center bg-[#1a1331]/70 rounded-xl">
                {horoscopeData.luckyNumbers.map((number, index) => (
                  <motion.div 
                    key={index}
                    whileHover={{ scale: 1.15, y: -5 }}
                    className="lucky-number w-14 h-14 text-2xl font-bold flex items-center justify-center bg-gradient-to-br from-[#2a1a4a] to-[#1a1331] rounded-xl border-2 border-[rgba(255,215,0,0.5)]"
                  >
                    <span className="text-gold-gradient">{number}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {!isLoading && horoscopeData?.compatibleSigns && (
            <motion.div className="mb-5 fade-in-up delay-300">
              <h4 className="section-title text-gold-gradient font-cinzel text-lg mb-3">Совместимые знаки</h4>
              <div className="compatible-signs-container p-3 rounded-xl bg-[#1a1331]/70">
                <div className="flex gap-2 justify-center items-center flex-wrap">
                  {horoscopeData.compatibleSigns.map((sign, index) => (
                    <motion.div 
                      key={index}
                      whileHover={{ scale: 1.05, y: -2 }}
                      className="compatible-sign flex items-center bg-[#2a1a4a] px-2 py-1 rounded-lg space-x-2 border border-[#8a2be2]/30 min-w-0"
                    >
                      <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                        <span className="text-lg text-[#FFD700] drop-shadow-lg">
                          {getZodiacSymbol(sign.name)}
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-cinzel font-medium text-white truncate">
                          {getZodiacRussianName(sign.name)}
                        </span>
                        <span className="text-xs font-medium text-amber-300">
                          {sign.compatibility}%
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {!isLoading && (
            <div className="flex justify-end">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  className="rounded-full border-[rgba(177,151,252,0.6)] bg-[rgba(84,40,176,0.1)] backdrop-blur-sm flex items-center gap-2"
                  disabled={isRefreshing || refreshMutation.isPending || !horoscopeData?.canRefresh}
                >
                  {(isRefreshing || refreshMutation.isPending) ? (
                    <div className="mr-1">
                      <CosmicLoader size="small" text="" />
                    </div>
                  ) : (
                    <AutoFixHighOutlined fontSize="small" className="text-[rgba(177,151,252,0.9)] mr-1" />
                  )}
                  <span>
                    {(isRefreshing || refreshMutation.isPending) 
                      ? "Обновление..." 
                      : horoscopeData?.canRefresh 
                        ? "Обновить" 
                        : "Уже обновлено"
                    }
                  </span>
                </Button>
              </motion.div>
            </div>
          )}

          {!isLoading && subscriptionType === "free" && (
            <motion.div className="relative overflow-hidden rounded-lg p-5 text-center mt-6 border border-[rgba(255,215,0,0.3)]">
              <p className="text-lg font-cormorant">Разблокируйте все категории гороскопа</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-full border-[rgba(255,215,0,0.6)] text-[#FFD700]"
              >
                <span className="title-glow text-gold-gradient">Улучшить подписку</span>
              </Button>
            </motion.div>
          )}
        </Card>
      </motion.div>
    );
  }
);

HoroscopeCard.displayName = "HoroscopeCard";

export default HoroscopeCard;