import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { getZodiacSymbol } from "@/lib/zodiac";

import MainLayout from "@/components/layout/main-layout";
import DecorativeSymbols from "@/components/horoscope/decorative-symbols";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/shared/date-picker";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import CosmicLoader from "@/components/shared/cosmic-loader";

interface Friend {
  id: string;
  name: string;
  birthDate: string;
  zodiacSign?: string;
}

interface CompatibilityResult {
  compatibilityScore: number;
  analysis: string;
  partnerData: {
    birthDate?: string;
    zodiacSign?: string;
    name?: string;
  };
}

export default function CompatibilityPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [partnerType, setPartnerType] = useState<"self" | "friend" | "custom">("friend");
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [partnerDate, setPartnerDate] = useState<Date | undefined>(undefined);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    enabled: !!user,
    staleTime: 60000, // Обновлять данные не чаще чем раз в минуту
    refetchOnWindowFocus: false, // Не обновлять при фокусе окна
  });

  const compatibilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/compatibility", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setCompatibilityResult(data);
      // Скролл наверх после получения результата
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const calculateCompatibility = () => {
    if (partnerType === "self") {
      toast({
        title: "Ошибка",
        description: "Нельзя проверить совместимость с самим собой",
        variant: "destructive",
      });
      return;
    }

    if (partnerType === "friend" && !selectedFriendId) {
      toast({
        title: "Ошибка",
        description: "Выберите друга",
        variant: "destructive",
      });
      return;
    }

    if (partnerType === "custom" && !partnerDate) {
      toast({
        title: "Ошибка",
        description: "Выберите дату рождения партнера",
        variant: "destructive",
      });
      return;
    }

    let partnerData;
    if (partnerType === "friend") {
      const friend = friends.find(f => f.id === selectedFriendId);
      partnerData = {
        type: "friend",
        friendId: selectedFriendId,
        name: friend?.name
      };
    } else {
      partnerData = {
        type: "custom",
        birthDate: partnerDate
      };
    }

    compatibilityMutation.mutate(partnerData);
  };

  const formatDate = (date: Date) => {
    return format(date, "d MMMM yyyy", { locale: ru });
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const getDaysOld = (birthDate: Date): number => {
    const today = new Date();
    const diffInTime = today.getTime() - birthDate.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
    return diffInDays;
  };

  const getNumericCode = (birthDate: Date): number => {
    const day = birthDate.getDate();
    const month = birthDate.getMonth() + 1;
    const year = birthDate.getFullYear();
    
    // Пример простого расчета нумерологической цифры
    let sum = day + month + year;
    while (sum > 9) {
      sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    }
    
    return sum;
  };

  // Содержимое выбора партнера
  const renderPartnerSelection = () => (
    <Card className="bg-[var(--background-secondary)]/50 backdrop-blur-sm border border-[var(--border)]">
      <CardContent className="p-5 space-y-4">
        <h2 className="text-xl font-connie text-center mb-4 text-white">Проверка совместимости</h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-base font-cormorant font-medium text-white">Выберите партнера для проверки</label>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className={`p-3 rounded-xl border text-left text-white ${
                  partnerType === "friend" 
                    ? "border-amber-400 bg-[var(--background-secondary)]/80" 
                    : "border-[var(--border)] bg-[var(--background-secondary)]/50"
                }`}
                onClick={() => setPartnerType("friend")}
              >
                <span className="font-medium">Друг из списка</span>
              </button>
              
              <button
                type="button"
                className={`p-3 rounded-xl border text-left text-white ${
                  partnerType === "custom" 
                    ? "border-amber-400 bg-[var(--background-secondary)]/80" 
                    : "border-[var(--border)] bg-[var(--background-secondary)]/50"
                }`}
                onClick={() => setPartnerType("custom")}
              >
                <span className="font-medium">Другой человек</span>
              </button>
            </div>
          </div>

          {partnerType === "friend" && (
            <div className="space-y-2">
              <label className="text-base font-cormorant font-medium text-white">Выберите друга</label>
              <div className="border rounded-xl border-[var(--border)] bg-[var(--background-secondary)]/50 p-2 max-h-40 overflow-y-auto">
                {friends.map((friend) => (
                  <button
                    key={friend.id}
                    type="button"
                    className={`w-full p-2 my-1 text-left rounded-lg text-
// TODO: оптимизировать позже
white ${
                      selectedFriendId === friend.id.toString() 
                        ? "bg-amber-400/20 border-amber-400" 
                        : "hover:bg-[var(--background-tertiary)]"
                    }`}
                    onClick={() => setSelectedFriendId(friend.id.toString())}
                  >
                    {friend.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {partnerType === "custom" && (
            <div className="space-y-2">
              <label className="text-base font-cormorant font-medium text-white">Дата рождения партнера</label>
              <div className="calendar-wrapper" style={{ position: 'relative', zIndex: 100 }}>
                <DatePicker
                  date={partnerDate}
                  setDate={setPartnerDate}
                  className="bg-[var(--background-secondary)] bg-opacity-50 rounded-xl border-[var(--border)]"
                />
              </div>
            </div>
          )}

          <Button 
            className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)]"
            onClick={calculateCompatibility}
            disabled={compatibilityMutation.isPending}
          >
            {compatibilityMutation.isPending ? (
              <><CosmicLoader size="small" text="" /> Расчет...</>
            ) : (
              "Рассчитать совместимость"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Содержимое результатов совместимости
  const renderCompatibilityResult = () => {
    if (!compatibilityResult || !user) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Информация о пользователе */}
          <Card className="bg-[var(--background-secondary)]/80 backdrop-blur-sm border border-[var(--border)]">
            <CardContent className="p-4">
              <h3 className="text-lg font-connie text-center mb-2 text-white">Ваши данные</h3>
              <p className="text-center font-medium text-base text-white">{formatDate(new Date(user?.birthDate || ""))}</p>
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm mt-2 text-white">
                <p className="truncate">Возраст: {calculateAge(new Date(user?.birthDate || ""))}</p>
                <p className="truncate">{getDaysOld(new Date(user?.birthDate || ""))} дней</p>
              </div>
              <p className="text-sm mt-1 text-white">Главная цифра: {getNumericCode(new Date(user?.birthDate || ""))}</p>
            </CardContent>
          </Card>
          
          {/* Информация о партнере */}
          <Card className="bg-[var(--background-secondary)]/80 backdrop-blur-sm border border-[var(--border)]">
            <CardContent className="p-4">
              <h3 className="text-lg font-connie text-center mb-2 text-white">Данные партнера</h3>
              <p className="text-center font-medium text-base text-white">
                {compatibilityResult.partnerData?.birthDate ? 
                  formatDate(new Date(compatibilityResult.partnerData.birthDate)) : 
                  "Дата не указана"}
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-between text-sm mt-2 text-white">
                {compatibilityResult.partnerData?.birthDate && (
                  <>
                    <p className="truncate">Возраст: {calculateAge(new Date(compatibilityResult.partnerData.birthDate))}</p>
                    <p className="truncate">{getDaysOld(new Date(compatibilityResult.partnerData.birthDate))} дней</p>
                  </>
                )}
              </div>
              <p className="text-sm text-white">
                {compatibilityResult.partnerData?.birthDate ?
                  `Главная цифра: ${getNumericCode(new Date(compatibilityResult.partnerData.birthDate))}` :
                  ""}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Прогресс бар совместимости - более заметный */}
        <div className="mb-6">
          <h3 className="text-xl font-connie text-center mb-4 text-white">Совместимость: {compatibilityResult.compatibilityScore}%</h3>
          <div className="relative">
            <Progress 
              value={compatibilityResult.compatibilityScore} 
              className="h-12 rounded-md progress-golden bg-slate-200"
            />
            <div 
              className="absolute inset-0 flex items-center justify-center text-lg font-bold"
              style={{ 
                color: 'black'
              }}
            >
              {compatibilityResult.compatibilityScore}%
            </div>
          </div>
        </div>
        
        {/* Совместимые знаки и числа - новый дизайн */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Знаки зодиака */}
          <Card className="bg-[#1a1331]/70 backdrop-blur-sm border border-[#8a2be2]/20 overflow-hidden">
            <CardContent className="p-4">
              <h3 className="section-title text-gold-gradient font-cinzel text-lg mb-3 text-center" data-text="Знаки зодиака">Знаки зодиака</h3>
              <div className="flex gap-3 justify-center">
                <motion.div 
                  className="flex items-center bg-[#2a1a4a] px-3 py-2 rounded-lg space-x-2 border-2 border-[#8a2be2]/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-9 h-9 rounded-md bg-[#1a1331] flex items-center justify-center"
                    style={{
                      border: '1px solid rgba(255, 215, 0, 0.6)',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                    }}
                  >
                    <span className="text-xl" style={{ color: '#FFD700', textShadow: '0 0 6px rgba(255, 215, 0, 0.8)' }}>
                      {getZodiacSymbol(user?.zodiacSign || "")}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {user?.zodiacSign || ""}
                  </span>
                </motion.div>

                <motion.div 
                  className="flex items-center bg-[#2a1a4a] px-3 py-2 rounded-lg space-x-2 border-2 border-[#8a2be2]/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-9 h-9 rounded-md bg-[#1a1331] flex items-center justify-center"
                    style={{
                      border: '1px solid rgba(255, 215, 0, 0.6)',
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.3)'
                    }}
                  >
                    <span className="text-xl" style={{ color: '#FFD700', textShadow: '0 0 6px rgba(255, 215, 0, 0.8)' }}>
                      {getZodiacSymbol(compatibilityResult.partnerData?.zodiacSign || "")}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-white">
                    {compatibilityResult.partnerData?.zodiacSign || ""}
                  </span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
          
          {/* Счастливые числа */}
          <Card className="bg-[#1a1331]/70 backdrop-blur-sm border border-[#8a2be2]/20 overflow-hidden">
            <CardContent className="p-4">
              <h3 className="section-title text-gold-gradient font-cinzel text-lg mb-3 text-center" data-text="Числа совместимости">Числа совместимости</h3>
              <div className="flex justify-center gap-4">
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 text-xl font-bold flex items-center justify-center relative"
                  style={{ 
                    background: 'linear-gradient(135deg, #2a1a4a 0%, #1a1331 100%)',
                    borderRadius: '10px',
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)'
                  }}
                >
                  <span style={{
                    background: 'linear-gradient(to bottom, #ffffff, #ffd700)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {getNumericCode(new Date(user?.birthDate || ""))}
                  </span>
                </motion.div>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-12 h-12 text-xl font-bold flex items-center justify-center relative"
                  style={{ 
                    background: 'linear-gradient(135deg, #2a1a4a 0%, #1a1331 100%)',
                    borderRadius: '10px',
                    border: '2px solid rgba(255, 215, 0, 0.5)',
                    boxShadow: '0 4px 15px rgba(138, 43, 226, 0.3)'
                  }}
                >
                  <span style={{
                    background: 'linear-gradient(to bottom, #ffffff, #ffd700)',
                    WebkitBackgroundClip: 'text',
                    backgroundClip: 'text',
                    color: 'transparent',
                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}>
                    {compatibilityResult.partnerData?.birthDate ? 
                      getNumericCode(new Date(compatibilityResult.partnerData.birthDate)) : "-"}
                  </span>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Текст анализа - основная часть страницы */}
        <Card className="bg-[var(--background-secondary)]/50 backdrop-blur-sm border border-[var(--border)]">
          <CardContent className="p-5">
            <h3 className="text-xl font-connie text-center mb-4 text-white">Анализ совместимости</h3>
            <div className="custom-scrollbar pr-2 text-white">
              <p className="font-cormorant text-base leading-relaxed whitespace-pre-line">{compatibilityResult.analysis}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Кнопка нового теста */}
        <Button 
          className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)]"
          onClick={() => setCompatibilityResult(null)}
        >
          Новый тест
        </Button>
      </div>
    );
  };

  return (
    <MainLayout title="Совместимость" activeTab="compatibility">
      <div className="relative p-4">
        {/* Полноэкранный прелоадер при расчете совместимости */}
        {compatibilityMutation.isPending && (
          <CosmicLoader 
            fullScreen 
            size="large" 
            text="Анализируем совместимость звездных карт..."
          />
        )}
        
        {/* Декоративные элементы */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DecorativeSymbols type="astrology" />
        </div>
        
        <div className="mt-2 mb-6 text-center">
          <h1 className="text-2xl font-connie mb-3 text-center w-full">Астрологическая совместимость</h1>
          <p className="text-sm opacity-90 font-cormorant text-base mx-auto max-w-md text-[var(--foreground-secondary)]">
            Узнайте, насколько хорошо ваши звёзды сочетаются с близкими людьми
          </p>
        </div>
        
        {/* Основное содержимое - форма выбора или результат */}
        {compatibilityResult ? renderCompatibilityResult() : renderPartnerSelection()}
      </div>
    </MainLayout>
  );
}