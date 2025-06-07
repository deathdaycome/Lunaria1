import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { formatDisplayDate, calculateAge, parseLocalDate, getDaysOld, getNumericCode, formatDateForDB } from "../../../dateUtils";
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

const CompatibilityText = ({ text }: { text: string | any }) => {
  if (!text) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>Информация о совместимости недоступна</p>
      </div>
    );
  }
  
  let sections: Array<{title: string, content: string}> = [];
  
  // Обрабатываем разные форматы данных
  try {
    if (typeof text === 'string') {
      // Если строка - пробуем распарсить как JSON
      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed)) {
          sections = parsed;
        } else {
          // Если не массив, создаем один раздел
          sections = [{ title: "Анализ совместимости", content: text }];
        }
      } catch {
        // Если не JSON, обрабатываем как обычный текст
        sections = [{ title: "Анализ совместимости", content: text }];
      }
    } else if (Array.isArray(text)) {
      // Если уже массив - используем как есть
      sections = text;
    } else if (typeof text === 'object') {
      // Если объект - извлекаем данные
      if (text.analysis) {
        sections = [{ title: "Анализ совместимости", content: text.analysis }];
      } else {
        sections = [{ title: "Анализ совместимости", content: JSON.stringify(text) }];
      }
    }
  } catch (error) {
    console.error("Ошибка при обработке данных:", error);
    return (
      <div className="text-center py-8 text-white/60">
        <p>Ошибка при загрузке данных совместимости</p>
      </div>
    );
  }

  // Фильтруем и группируем секции
  const validSections = sections.filter(section => 
    section.content && 
    section.content.trim().length > 10 &&
    !section.content.includes('[object Object]')
  );

  if (validSections.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>Данные совместимости не найдены</p>
      </div>
    );
  }

  // Умное группирование в 3 основных раздела
  const astroSections: string[] = [];
  const numeroSections: string[] = [];
  const recomSections: string[] = [];

  validSections.forEach(section => {
    const title = section.title.toLowerCase().trim();
    const content = section.content.trim();
    
    if (title.includes('астрологическ') || title.includes('общий прогноз') || title.includes('знаки')) {
      astroSections.push(content);
    } else if (title.includes('нумерологическ') || title.includes('числа') || title.includes('психологическ')) {
      numeroSections.push(content);
    } else if (title.includes('рекомендаци') || title.includes('точки роста') || title.includes('заключение') || title.includes('совместимость')) {
      recomSections.push(content);
    } else {
      // Добавляем в соответствующий раздел по содержанию
      if (content.includes('Рак') || content.includes('Близнецы') || content.includes('элемент')) {
        astroSections.push(content);
      } else if (content.includes('число') || content.includes('цифра')) {
        numeroSections.push(content);
      } else {
        recomSections.push(content);
      }
    }
  });

  const finalSections = [
    { 
      title: "Астрологическая совместимость", 
      icon: "⭐",
      content: astroSections.join('\n\n')
    },
    { 
      title: "Нумерологический анализ", 
      icon: "🔢",
      content: numeroSections.join('\n\n')
    },
    { 
      title: "Рекомендации и выводы", 
      icon: "💡",
      content: recomSections.join('\n\n')
    }
  ].filter(section => section.content.trim().length > 20);

  // Функция для выделения ключевых слов
  const highlightKeywords = (text: string): string => {
    if (!text || typeof text !== 'string') return text;
    
    const keywords = [
      'Близнецы', 'Рак', 'Лев', 'Дева', 'Весы', 'Скорпион', 'Стрелец', 'Козерог', 
      'Водолей', 'Рыбы', 'Овен', 'Телец', 'Cancer', 'Gemini',
      'совместимость', 'гармония', 'конфликт', 'энергия', 'эмоциональный', 'чувствительный',
      'число', 'числа', 'партнер', 'отношения', 'любовь', 'дружба', 'семья', 'брак',
      'интуиция', 'духовность', 'баланс', 'понимание', 'доверие', 'поддержка',
      'Иван', 'Кирилл', 'амбиции', 'лидерство', 'гуманизм', 'идеализм'
    ];
    
    let result = text;
    keywords.forEach(keyword => {
      const regex = new RegExp(`\\b(${keyword})\\b`, 'gi');
      result = result.replace(regex, '<strong class="text-amber-300 font-medium">$1</strong>');
    });
    
    return result;
  };

  // Функция для форматирования контента
  const formatContent = (content: string) => {
    if (!content) return null;

    const paragraphs = content
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0);

    return paragraphs.map((paragraph, idx) => {
      // Если это заголовок раздела
      if (paragraph.match(/^[А-ЯЁ][А-Яа-яёЁ\s]+:?$/) && paragraph.length < 50) {
        return (
          <h5 key={idx} className="text-amber-300 font-bold text-lg mt-6 mb-3 flex items-center">
            <span className="mr-2">🔸</span>
            {paragraph.replace(':', '')}
          </h5>
        );
      }

      // Если содержит двоеточие - это характеристика
      if (paragraph.includes(':') && paragraph.split(':').length === 2) {
        const [label, description] = paragraph.split(':');
        return (
          <div key={idx} className="mb-4 p-4 bg-amber-400/5 rounded-lg border-l-4 border-amber-400">
            <div className="flex flex-col">
              <span className="text-amber-300 font-bold text-base mb-2">
                {highlightKeywords(label.trim())}
              </span>
              <span 
                className="text-white font-cormorant text-base leading-relaxed"
                dangerouslySetInnerHTML={{ __html: highlightKeywords(description.trim()) }}
              />
            </div>
          </div>
        );
      }

      // Если это список (начинается с большой буквы и содержит важные слова)
      if (paragraph.match(/^[А-ЯЁ]/) && 
          (paragraph.includes('стоит') || paragraph.includes('следует') || 
           paragraph.includes('важно') || paragraph.includes('рекомендуется'))) {
        return (
          <div key={idx} className="mb-4 p-3 bg-blue-500/10 rounded-lg border-l-2 border-blue-400">
            <p 
              className="text-blue-100 font-cormorant text-base leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: highlightKeywords(paragraph) }}
            />
          </div>
        );
      }

      // Если содержит формулы или вычисления
      if (paragraph.includes('→') || paragraph.includes('=') || paragraph.includes('+')) {
        return (
          <div key={idx} className="mb-4 p-3 bg-purple-500/10 rounded-lg border border-purple-400/30">
            <p 
              className="text-purple-100 font-mono text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightKeywords(paragraph) }}
            />
          </div>
        );
      }

      // Обычный абзац
      return (
        <p 
          key={idx}
          className="text-white font-cormorant text-base leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: highlightKeywords(paragraph) }}
        />
      );
    }).filter(Boolean);
  };

  return (
    <div className="space-y-8 max-w-none">
      {finalSections.map((section, index) => (
        <div key={index} className="mb-10">
          {index > 0 && (
            <div className="border-t border-amber-400/30 my-8"></div>
          )}
          
          <div className="mb-6">
            <h4 className="text-2xl font-bold text-amber-400 mb-3 flex items-center">
              <span className="mr-4 text-3xl">
                {section.icon}
              </span>
              <span className="font-connie leading-tight">
                {section.title}
              </span>
            </h4>
            <div className="ml-16 h-0.5 bg-gradient-to-r from-amber-400/60 to-transparent"></div>
          </div>
          
          <div className="text-white leading-relaxed space-y-4 pl-4">
            {formatContent(section.content)}
          </div>
        </div>
      ))}

      {/* Красивое завершение */}
      <div className="text-center py-8 border-t border-amber-400/20 mt-12">
        <div className="flex justify-center items-center space-x-3 text-amber-400/70">
          <span className="text-xl">✨</span>
          <span className="font-cormorant text-base italic">
            Звёзды указывают путь, но выбор всегда за вами
          </span>
          <span className="text-xl">✨</span>
        </div>
      </div>
    </div>
  );
};

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
  const [partnerName, setPartnerName] = useState<string>("");
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    enabled: !!user,
    staleTime: 60000,
    refetchOnWindowFocus: false,
  });

  const compatibilityMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/compatibility", data);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("🔍 Полученные данные совместимости:", data);
      setCompatibilityResult(data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: (error: Error) => {
      console.error("❌ Ошибка запроса совместимости:", error);
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

    if (partnerType === "custom" && !partnerName.trim()) {
      toast({
        title: "Ошибка",
        description: "Введите имя партнера",
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
        birthDate: partnerDate ? formatDateForDB(partnerDate) : "",
        name: partnerName
      };
    }

    console.log("🔍 Отправляем данные для расчета:", partnerData);
    compatibilityMutation.mutate(partnerData);
  };

  const getNumericCodeLocal = (birthDate: Date | string): number => {
    const dateObj = typeof birthDate === 'string' ? parseLocalDate(birthDate) : birthDate;
    
    if (!dateObj || !(dateObj instanceof Date)) return 0;
    
    const day = dateObj.getDate();
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();
    
    let sum = day + month + year;
    while (sum > 9) {
      sum = sum.toString().split('').reduce((a, b) => a + parseInt(b), 0);
    }
    
    return sum;
  };

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
                    className={`w-full p-2 my-1 text-left rounded-lg text-white ${
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
            <>
              <div className="space-y-2">
                <label className="text-base font-cormorant font-medium text-white">Имя партнера</label>
                <input
                  type="text"
                  placeholder="Введите имя партнера"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/50 text-white placeholder:text-white/50"
                  style={{ marginBottom: '2rem' }}
                />
              </div>
              
              <div className="space-y-2 mb-8">
                <label className="text-base font-cormorant font-medium text-white">Дата рождения партнера</label>
                <div className="calendar-wrapper" style={{ position: 'relative', zIndex: 100, marginBottom: '3rem' }}>
                  <DatePicker
                    date={partnerDate}
                    setDate={setPartnerDate}
                    className="bg-[var(--background-secondary)] bg-opacity-50 rounded-xl border-[var(--border)]"
                  />
                </div>
              </div>
            </>
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

  const renderCompatibilityResult = () => {
    if (!compatibilityResult || !user) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="bg-[var(--background-secondary)]/80 backdrop-blur-sm border border-[var(--border)]">
            <CardContent className="p-4">
              <h3 className="text-lg font-connie text-center mb-2 text-white">Ваши данные</h3>
              <p className="text-center font-medium text-base text-white">
                {formatDisplayDate(user?.birthDate || "")}
              </p>
              <div className="flex justify-between text-sm mt-2 text-white">
                <p>Возраст: {calculateAge(user?.birthDate || "")}</p>
                <p>Главная цифра: {getNumericCodeLocal(user?.birthDate || "")}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-[var(--background-secondary)]/80 backdrop-blur-sm border border-[var(--border)]">
            <CardContent className="p-4">
              <h3 className="text-lg font-connie text-center mb-2 text-white">
                {compatibilityResult.partnerData?.name ? 
                  `${compatibilityResult.partnerData.name}` : 
                  "Данные партнера"}
              </h3>
              <p className="text-center font-medium text-base text-white">
                {compatibilityResult.partnerData?.birthDate ? 
                  formatDisplayDate(compatibilityResult.partnerData.birthDate) : 
                  "Дата не указана"}
              </p>
              <div className="flex justify-between text-sm mt-2 text-white">
                {compatibilityResult.partnerData?.birthDate && (
                  <>
                    <p>Возраст: {calculateAge(compatibilityResult.partnerData.birthDate)}</p>
                    <p>Главная цифра: {getNumericCodeLocal(compatibilityResult.partnerData.birthDate)}</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
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
        
        {/* Форматированный текст анализа */}
        <Card className="bg-[var(--background-secondary)]/50 backdrop-blur-sm border border-[var(--border)]">
          <CardContent className="p-5">
            <h3 className="text-xl font-connie text-center mb-4 text-white">Анализ совместимости</h3>
            <div className="pr-2">
              <CompatibilityText text={compatibilityResult.analysis} />
            </div>
          </CardContent>
        </Card>
        
        <Button 
          className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)]"
          onClick={() => {
            setCompatibilityResult(null);
            setPartnerName("");
          }}
        >
          Новый тест
        </Button>
      </div>
    );
  };

  return (
    <MainLayout title="Совместимость" activeTab="compatibility">
      <div className="relative p-4 pb-safe">
        {compatibilityMutation.isPending && (
          <CosmicLoader 
            fullScreen 
            size="large" 
            text="Анализируем совместимость звездных карт..."
          />
        )}
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <DecorativeSymbols type="astrology" />
        </div>
        
        <div className="mt-2 mb-6 text-center">
         <h1 className="text-2xl font-connie mb-3 text-center w-full">Астрологическая совместимость</h1>
         <p className="text-sm opacity-90 font-cormorant text-base mx-auto max-w-md text-[var(--foreground-secondary)]">
           Узнайте, насколько хорошо ваши звёзды сочетаются с близкими людьми
         </p>
       </div>
       
       {compatibilityResult ? renderCompatibilityResult() : renderPartnerSelection()}
     </div>
   </MainLayout>
 );
}