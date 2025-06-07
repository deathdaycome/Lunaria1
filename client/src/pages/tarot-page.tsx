import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RotateCcw, Eye } from "lucide-react";

const TarotText = ({ text }: { text: string | any }) => {
  console.log("=== ДИАГНОСТИКА TarotText ===");
  console.log("🔍 Получен текст:", text);
  console.log("🔍 Тип данных:", typeof text);
  
  if (!text) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>Информация о раскладе недоступна</p>
      </div>
    );
  }
  
  // Обрабатываем входные данные
  let textString: string;
  if (typeof text === 'string') {
    textString = text;
  } else if (Array.isArray(text)) {
    textString = text.map(item => {
      if (typeof item === 'object' && item?.text) {
        return item.text;
      } else if (typeof item === 'object' && item?.content) {
        return item.content;
      } else if (typeof item === 'string') {
        return item;
      }
      return String(item);
    }).join('\n\n');
  } else if (typeof text === 'object' && text?.analysis) {
    textString = text.analysis;
  } else if (typeof text === 'object' && text?.reading) {
    textString = text.reading;
  } else {
    textString = JSON.stringify(text, null, 2);
  }
  
  console.log("🔍 Обрабатываем текст:", textString.substring(0, 200));
  
  // Очищаем от markdown символов
  const cleanText = textString
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/###/g, '')
    .replace(/#/g, '')
    .trim();
  
  // Функция для извлечения названий карт
  const extractCardNames = (text: string): string[] => {
    const cardPatterns = [
      /(?:первая карта|вторая карта|третья карта|четвертая карта|пятая карта)\s*[—-]\s*([А-Яа-я\s]+)\./gi,
      /(?:карта\s+\d+|карта)\s*[—\-:]\s*([А-Яа-я\s]+)\./gi,
      /(Отшельник|Дурак|Дьявол|Маг|Жрица|Императрица|Император|Иерофант|Влюбленные|Колесница|Сила|Повешенный|Смерть|Умеренность|Башня|Звезда|Луна|Солнце|Суд|Мир)/gi
    ];
    
    const foundCards: string[] = [];
    
    cardPatterns.forEach(pattern => {
      // Используем старый способ match для совместимости
      const matches = text.match(pattern);
      if (matches) {
        matches.forEach(match => {
          // Извлекаем название карты из совпадения
          const cardMatch = match.match(/([А-Яа-я\s]+)/);
          if (cardMatch && cardMatch[1]) {
            const cardName = cardMatch[1].trim();
            if (!foundCards.includes(cardName)) {
              foundCards.push(cardName);
            }
          }
        });
      }
    });
    
    return foundCards;
  };
  
  // Функция для разделения текста по картам
  const parseCardReadings = (text: string) => {
    const cardNames = extractCardNames(text);
    const cards: Array<{name: string, description: string, position: string}> = [];
    
    // Разделяем текст на абзацы
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
    
    if (cardNames.length > 0) {
      // Если нашли названия карт, группируем по ним
      cardNames.forEach((cardName, index) => {
        const position = index === 0 ? "Прошлое" : 
                        index === 1 ? "Настоящее" : 
                        index === 2 ? "Будущее" :
                        `Карта ${index + 1}`;
        
        // Ищем абзац, содержащий эту карту
        const cardParagraph = paragraphs.find(p => 
          p.toLowerCase().includes(cardName.toLowerCase()) ||
          p.includes(`${index + 1}`) ||
          p.includes(position.toLowerCase())
        );
        
        if (cardParagraph) {
          cards.push({
            name: cardName,
            position: position,
            description: cardParagraph.trim()
          });
        }
      });
    } else {
      // Если не нашли конкретные карты, делим по абзацам
      paragraphs.forEach((paragraph, index) => {
        if (index < 5) { // Максимум 5 карт
          const position = index === 0 ? "Прошлое" : 
                          index === 1 ? "Настоящее" : 
                          index === 2 ? "Будущее" :
                          index === 3 ? "Влияние" :
                          "Итог";
          
          cards.push({
            name: `Карта ${index + 1}`,
            position: position,
            description: paragraph.trim()
          });
        }
      });
    }
    
    // Ищем общие советы и рекомендации
    const adviceSection = paragraphs.find(p => 
      p.toLowerCase().includes('рекомендации') ||
      p.toLowerCase().includes('советы') ||
      p.toLowerCase().includes('что касается')
    );
    
    return { cards, advice: adviceSection };
  };
  
  const { cards, advice } = parseCardReadings(cleanText);
  
  // Функция для очистки описания карты от лишнего текста
  const cleanCardDescription = (description: string, cardName: string): string => {
    return description
      .replace(new RegExp(`первая карта\\s*[—-]\\s*${cardName}\\.?`, 'gi'), '')
      .replace(new RegExp(`вторая карта\\s*[—-]\\s*${cardName}\\.?`, 'gi'), '')
      .replace(new RegExp(`третья карта\\s*[—-]\\s*${cardName}\\.?`, 'gi'), '')
      .replace(new RegExp(`четвертая карта\\s*[—-]\\s*${cardName}\\.?`, 'gi'), '')
      .replace(new RegExp(`пятая карта\\s*[—-]\\s*${cardName}\\.?`, 'gi'), '')
      .replace(/^[А-Яа-я\s,]+\.\s*/, '') // Убираем приветствие в начале
      .trim();
  };
  
  // Иконки для позиций карт
  const getPositionIcon = (position: string): string => {
    const iconMap: Record<string, string> = {
      'Прошлое': '⏮️',
      'Настоящее': '⏯️', 
      'Будущее': '⏭️',
      'Влияние': '🌟',
      'Итог': '🎯',
      'Карта 1': '1️⃣',
      'Карта 2': '2️⃣',
      'Карта 3': '3️⃣',
      'Карта 4': '4️⃣',
      'Карта 5': '5️⃣'
    };
    return iconMap[position] || '🔮';
  };
  
  return (
    <div className="space-y-8 max-w-none">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-connie text-amber-400 mb-2 flex items-center justify-center">
          <span className="mr-3">🔮</span>
          Толкование вашего расклада
          <span className="ml-3">🔮</span>
        </h3>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
      </div>

      {/* Карты */}
      {cards.length > 0 && (
        <div className="space-y-6">
          {cards.map((card, index) => (
            <div key={index} className="relative">
              {/* Разделитель между картами */}
              {index > 0 && (
                <div className="flex items-center my-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
                  <div className="mx-4 text-purple-400/60">✨</div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent"></div>
                </div>
              )}
              
              {/* Карточка */}
              <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-400/20 backdrop-blur-sm">
                {/* Заголовок карты */}
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">
                    {getPositionIcon(card.position)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-connie text-amber-300 mb-1">
                      {card.name}
                    </h4>
                    <p className="text-purple-300 text-sm font-medium">
                      {card.position}
                    </p>
                  </div>
                  <div className="text-4xl opacity-20">
                    🃏
                  </div>
                </div>
                
                {/* Описание карты */}
                <div className="text-white leading-relaxed font-cormorant text-base pl-4 border-l-2 border-amber-400/40">
                  <p className="mb-0">
                    {cleanCardDescription(card.description, card.name)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Советы и рекомендации */}
      {advice && (
        <div className="mt-8">
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
            <div className="mx-4 text-amber-400">⭐</div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent"></div>
          </div>
          
          <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-2xl p-6 border border-amber-400/20 backdrop-blur-sm">
            <h4 className="text-xl font-connie text-amber-300 mb-4 flex items-center">
              <span className="mr-3 text-2xl">💡</span>
              Советы и рекомендации
            </h4>
            
            <div className="text-white leading-relaxed font-cormorant text-base pl-4 border-l-2 border-amber-400/40">
              <p>{advice.trim()}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Если нет структурированных данных, показываем общий текст */}
      {cards.length === 0 && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-400/20 backdrop-blur-sm">
          <h4 className="text-xl font-connie text-amber-300 mb-4 flex items-center">
            <span className="mr-3 text-2xl">🔮</span>
            Толкование расклада
          </h4>
          
          <div className="text-white leading-relaxed font-cormorant text-base space-y-4">
            {cleanText.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph.trim()}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ✨ ПРАВИЛЬНЫЕ ПРЕСЕТЫ ИЗ OPENAI.TS
const TAROT_PRESETS: Record<string, Array<{
  id: string;
  name: string;
  cards3: string[];
  cards5: string[];
}>> = {
  "love": [
    {
      id: "love-1",
      name: "Прошлое-Настоящее-Будущее",
      cards3: ["Прошлое", "Настоящее", "Будущее"],
      cards5: ["Мои желания", "Что я даю", "Что получаю", "Препятствия", "Итог"]
    },
    {
      id: "love-2", 
      name: "Чувства партнеров",
      cards3: ["Мои чувства", "Чувства партнёра", "Совет"],
      cards5: ["Настоящая ситуация", "Взгляд партнёра", "Взгляд меня", "Совет", "Будущее"]
    },
    {
      id: "love-3",
      name: "Ожидания vs Реальность",
      cards3: ["Мои ожидания", "Реальность", "Итог"],
      cards5: ["Мои эмоции", "Эмоции партнёра", "Что между нами", "Что мешает", "Итог"]
    },
    {
      id: "love-4",
      name: "Конфликт и решение",
      cards3: ["Причина конфликта", "Что помогает", "Совет"],
      cards5: ["Любовь сейчас", "Что стоит развивать", "Что отпустить", "Чего боюсь", "Перспективы"]
    },
    {
      id: "love-5",
      name: "Взаимный обмен",
      cards3: ["Что я даю", "Что я получаю", "Что нужно изменить"],
      cards5: ["Начало отношений", "Их развитие", "Текущее состояние", "Что скрыто", "Совет"]
    }
  ],
  "career": [
    {
      id: "career-1",
      name: "Прошлое-Настоящее-Будущее",
      cards3: ["Прошлое", "Настоящее", "Будущее карьеры"],
      cards5: ["Цель", "Ресурсы", "Препятствия", "Действия", "Итог"]
    },
    {
      id: "career-2",
      name: "Силы и слабности",
      cards3: ["Мои силы", "Мои слабости", "Совет для роста"],
      cards5: ["Мои способности", "Мотивация", "Влияние окружения", "Что мешает", "Совет"]
    },
    {
      id: "career-3",
      name: "Цели и возможности",
      cards3: ["Мои цели", "Препятствия", "Возможности"],
      cards5: ["Текущая ситуация", "Что я контролирую", "Что не контролирую", "Что улучшить", "Будущее развитие"]
    },
    {
      id: "career-4",
      name: "Взгляд окружения",
      cards3: ["Ситуация сейчас", "Как меня видят коллеги/руководство", "Влияние со стороны"],
      cards5: ["Мои цели", "Планы", "Вызовы", "Поддержка", "Итог"]
    },
    {
      id: "career-5",
      name: "Движение вперед",
      cards3: ["Что я должен отпустить", "Что держит меня", "Что поможет двигаться вперёд"],
      cards5: ["Ключевая компетенция", "Личный потенциал", "Внешние возможности", "Риски", "Совет для укрепления позиции"]
    }
  ],
  "spirituality": [
    {
      id: "spirituality-1",
      name: "Духовное состояние",
      cards3: ["Текущее духовное состояние", "Вызов", "Совет"],
      cards5: ["Настоящее состояние", "Истоки", "Вызовы", "Поддержка", "Путь"]
    },
    {
      id: "spirituality-2",
      name: "Осознание",
      cards3: ["Что я осознаю", "Что скрыто", "Что нужно принять"],
      cards5: ["Осознанность", "Подсознание", "Внешние влияния", "Внутренний учитель", "Совет"]
    },
    {
      id: "spirituality-3",
      name: "Внутренний мир",
      cards3: ["Внутренний мир", "Внешние влияния", "Путь вперед"],
      cards5: ["Мои сомнения", "Моя вера", "Что держит меня", "Что освобождает", "Итог духовного пути"]
    },
    {
      id: "spirituality-4",
      name: "Баланс",
      cards3: ["Что мне помогает", "Что мешает", "Путь к балансу"],
      cards5: ["Внутренний конфликт", "Причина", "Путь исцеления", "Новые возможности", "Советы для гармонии"]
    },
    {
      id: "spirituality-5",
      name: "Духовный путь",
      cards3: ["Что я могу отпустить", "Что мне важно сохранить", "Что открыть для себя"],
      cards5: ["Прошлое", "Настоящее", "Будущее", "Урок", "Благодарность"]
    }
  ],
  "money": [
    {
      id: "finances-1",
      name: "Финансовое состояние",
      cards3: ["Текущее состояние", "Препятствия", "Совет"],
      cards5: ["Текущая ситуация", "Источники дохода", "Области расхода", "Препятствия", "Совет"]
    },
    {
      id: "finances-2",
      name: "Доходы и расходы",
      cards3: ["Доходы", "Расходы", "Перспективы"],
      cards5: ["Мои ресурсы", "Что нужно отпустить", "Риски", "Новый путь", "Результат"]
    },
    {
      id: "finances-3",
      name: "Контроль финансов",
      cards3: ["Что контролирую", "Что не контролирую", "Что изменить"],
      cards5: ["Цели", "Планы", "Поддержка", "Препятствия", "Итог"]
    },
    {
      id: "finances-4",
      name: "Риски и возможности",
      cards3: ["Риски", "Возможности", "Действия"],
      cards5: ["Влияние прошлого", "Настоящее состояние", "Будущее", "Влияние окружения", "Совет"]
    },
    {
      id: "finances-5",
      name: "Финансовые привычки",
      cards3: ["Финансовые привычки", "Что мешает", "Что помогает"],
      cards5: ["Мои сильные стороны", "Ограничения", "Возможности", "Угрозы", "Как действовать"]
    }
  ],
  "health": [
    {
      id: "health-1",
      name: "Здоровье",
      cards3: ["Текущее состояние", "Основная проблема", "Совет"],
      cards5: ["Физическое состояние", "Эмоциональное состояние", "Психическое состояние", "Внешние факторы", "Совет для баланса"]
    },
    {
      id: "health-2",
      name: "Тело-Эмоции-Дух",
      cards3: ["Тело", "Эмоции", "Дух"],
      cards5: ["Симптом", "Причина", "Что я делаю", "Что нужно сделать", "Итог"]
    },
    {
      id: "health-3",
      name: "Что помогает",
      cards3: ["Что помогает", "Что мешает", "Что изменить"],
      cards5: ["Мой ресурс", "Что истощает", "Помощь извне", "Внутренние барьеры", "Путь к исцелению"]
    },
    {
      id: "health-4",
      name: "Причины симптомов",
      cards3: ["Причина симптомов", "Текущие действия", "Итог"],
      cards5: ["Настоящее состояние", "Влияние прошлого", "Текущие ограничения", "Что важно развивать", "Итог выздоровления"]
    },
    {
      id: "health-5",
      name: "Энергия и стресс",
      cards3: ["Уровень энергии", "Источники стресса", "Способы восстановления"],
      cards5: ["Телесные ощущения", "Эмоции", "Мышление", "Внешнее воздействие", "Совет по балансу"]
    }
  ],
  "friendship": [
    {
      id: "friendship-1",
      name: "Я и друг",
      cards3: ["Я", "Друг", "Суть отношений"],
      cards5: ["Я", "Друг", "Наши общие качества", "Вызовы", "Итог"]
    },
    {
      id: "friendship-2",
      name: "Взаимный обмен",
      cards3: ["Что я даю", "Что получаю", "Что нужно изменить"],
      cards5: ["Позитивные стороны", "Препятствия", "Внимание", "Советы", "Перспективы"]
    },
    {
      id: "friendship-3",
      name: "Конфликт в дружбе",
      cards3: ["Причина конфликта", "Что помогает", "Совет"],
      cards5: ["Мои ожидания", "Ожидания друга", "Что нас соединяет", "Что нас разделяет", "Итог"]
    },
    {
      id: "friendship-4",
      name: "Ожидания",
      cards3: ["Мои ожидания", "Реальность", "Итог"],
      cards5: ["Истоки дружбы", "Настоящее состояние", "Влияние внешних обстоятельств", "Что улучшить", "Совет"]
    },
    {
      id: "friendship-5",
      name: "Будущее дружбы",
      cards3: ["Настоящее состояние", "Влияние прошлого", "Будущее дружбы"],
      cards5: ["Я", "Друг", "Наши настоящие чувства", "Барьеры", "Как двигаться вперёд"]
    }
  ]
};

// ✨ КАТЕГОРИИ ДЛЯ ВЫБОРА ТЕМЫ
const categories = [
  { id: "love", name: "Любовь и отношения", icon: "💝" },
  { id: "career", name: "Карьера", icon: "💼" },
  { id: "health", name: "Здоровье", icon: "🌿" },
  { id: "money", name: "Финансы", icon: "💰" },
  { id: "spirituality", name: "Духовность", icon: "✨" },
  { id: "friendship", name: "Дружба", icon: "🤝" },
];

// ✨ МОКОВЫЕ КАРТЫ ДЛЯ ДЕМОНСТРАЦИИ
const mockCards = Array.from({ length: 78 }, (_, i) => ({
  id: i + 1,
  name: `Карта ${i + 1}`,
  isReversed: false,
}));

type Step = "layout" | "category" | "preset" | "question" | "cards" | "reading";

export default function TarotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState<Step>("layout");
  const [cardCount, setCardCount] = useState<3 | 5>(3);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  const [reading, setReading] = useState<string>("");

  // ✨ ПОЛУЧАЕМ ПРЕСЕТЫ ДЛЯ ВЫБРАННОЙ КАТЕГОРИИ
  const getPresetsForCategory = () => {
    return TAROT_PRESETS[selectedCategory] || TAROT_PRESETS["love"];
  };

  // ✨ МУТАЦИЯ ДЛЯ ГЕНЕРАЦИИ РАСКЛАДА
  const generateReading = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question,
          cardCount,
          category: selectedCategory,
          preset: selectedPreset,
          selectedCards: selectedCards.map(cardId => mockCards[cardId - 1]),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Ошибка при создании расклада");
      }

      const data = await response.json();
      return data.reading;
    },
    onSuccess: (data) => {
      setReading(data);
      setCurrentStep("reading");
      toast({
        title: "Расклад готов",
        description: "Карты раскрыли свои тайны",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const nextStep = () => {
    switch (currentStep) {
      case "layout":
        setCurrentStep("category");
        break;
      case "category":
        if (!selectedCategory) {
          toast({
            title: "Выберите тему",
            description: "Необходимо выбрать тему расклада",
            variant: "destructive",
          });
          return;
        }
        // ✅ ИСПРАВЛЕНИЕ ПУНКТА 21: Сбрасываем карты при смене категории
        setSelectedCards([]);
        setRevealedCards([]);
        setCurrentStep("preset");
        break;
      case "preset":
        if (!selectedPreset) {
          toast({
            title: "Выберите пресет",
            description: "Необходимо выбрать пресет расклада",
            variant: "destructive",
          });
          return;
        }
        // ✅ ИСПРАВЛЕНИЕ ПУНКТА 21: Сбрасываем карты при смене пресета
        setSelectedCards([]);
        setRevealedCards([]);
        setCurrentStep("question");
        break;
      case "question":
        if (!question.trim()) {
          toast({
            title: "Опишите ситуацию",
            description: "Необходимо описать вашу ситуацию",
            variant: "destructive",
          });
          return;
        }
        const randomCards = Array.from({ length: cardCount }, () => 
          Math.floor(Math.random() * 78) + 1
        );
        setSelectedCards(randomCards);
        setCurrentStep("cards");
        break;
      case "cards":
        generateReading.mutate();
        break;
    }
  };

  const revealCard = (index: number) => {
    // ✅ ИСПРАВЛЕНИЕ ПУНКТА 23: Разный порядок для 3 и 5 карт
    let expectedOrder: number[];
    
    if (cardCount === 3) {
      expectedOrder = [0, 1, 2]; // Для 3 карт: 1 → 2 → 3
    } else {
      expectedOrder = [2, 0, 4, 1, 3]; // Для 5 карт: 3 → 1 → 5 → 2 → 4
    }
    
    const expectedNextCardIndex = expectedOrder[revealedCards.length];
    
    if (index === expectedNextCardIndex && !revealedCards.includes(index)) {
      setRevealedCards([...revealedCards, index]);
    } else if (index !== expectedNextCardIndex) {
      // Показываем подсказку пользователю
      const expectedCardNumber = expectedNextCardIndex + 1;
      toast({
        title: "Неправильный порядок",
        description: `Сначала откройте карту ${expectedCardNumber}`,
        variant: "destructive",
      });
    }
  };

  const resetReading = () => {
    setCurrentStep("layout");
    setSelectedCategory("");
    setSelectedPreset("");
    setQuestion("");
    setSelectedCards([]);
    setRevealedCards([]);
    setReading("");
  };

  const renderStep = () => {
    switch (currentStep) {
      case "layout":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-connie text-white">Выберите расклад</h2>
              <p className="text-[var(--foreground-secondary)] font-cormorant">
                Выберите количество карт для вашего расклада
              </p>
            </div>
            
            <div className="grid gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  cardCount === 3 
                    ? "border-accent bg-accent/10" 
                    : "border-border bg-card/50"
                }`}
                onClick={() => setCardCount(3)}
              >
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-connie text-white mb-2">Расклад на 3 карты</h3>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Прошлое • Настоящее • Будущее
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all ${
                  cardCount === 5 
                    ? "border-accent bg-accent/10" 
                    : "border-border bg-card/50"
                }`}
                onClick={() => setCardCount(5)}
              >
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-connie text-white mb-2">Расклад на 5 карт</h3>
                  <p className="text-sm text-[var(--foreground-secondary)]">
                    Детальный анализ ситуации
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: cardCount }).map((_, i) => (
                <div
                  key={i}
                  className="w-16 h-24 bg-gradient-to-b from-purple-600 to-blue-600 rounded-lg border-2 border-accent/30 flex items-center justify-center"
                >
                  <Sparkles className="text-white/80 h-6 w-6" />
                </div>
              ))}
            </div>
          </div>
        );

      case "category":
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-connie text-white">Выберите тему</h2>
              <p className="text-[var(--foreground-secondary)] font-cormorant">
                О чем вы хотите узнать?
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {categories.map((category) => (
                <Card
                  key={category.id}
                  className={`cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-card/50"
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <p className="text-white font-medium">{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "preset":
        const presets = getPresetsForCategory();
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-connie text-white">Выберите расклад</h2>
              <p className="text-[var(--foreground-secondary)] font-cormorant">
                Какой тип расклада вам нужен?
              </p>
            </div>
            
            <div className="space-y-3">
              {presets.map((preset) => (
                <Card
                  key={preset.id}
                  className={`cursor-pointer transition-all ${
                    selectedPreset === preset.id
                      ? "border-accent bg-accent/20 shadow-[0_0_20px_rgba(168,85,247,0.4)] border-2"
                      : "border-border bg-card/50 hover:border-accent/50 hover:shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                  }`}
                  onClick={() => setSelectedPreset(preset.id)}
                  style={selectedPreset === preset.id ? {
                    boxShadow: '0 0 25px rgba(168, 85, 247, 0.5), inset 0 0 15px rgba(168, 85, 247, 0.1)'
                  } : {}}
                >
                  <CardContent className="p-4">
                   <h3 className="font-medium mb-2 text-white">
                     {preset.name}
                   </h3>
                   <div className="text-sm text-white/80">
                     <p className="mb-1">
                       {cardCount === 3 ? "3 карты:" : "5 карт:"}
                     </p>
                     <p className="italic">
                       {cardCount === 3 
                         ? preset.cards3.join(" • ") 
                         : preset.cards5.join(" • ")
                       }
                     </p>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       );

     case "question":
       return (
         <div className="space-y-6">
           <div className="text-center space-y-4">
             <h2 className="text-2xl font-connie text-white">Опишите ситуацию</h2>
             <p className="text-[var(--foreground-secondary)] font-cormorant">
               Чем подробнее опишете, тем точнее будет расклад
             </p>
           </div>
           
           <Textarea
             placeholder="Опишите вашу ситуацию или задайте вопрос..."
             value={question}
             onChange={(e) => setQuestion(e.target.value)}
             className="min-h-32 bg-card/50 border-border resize-none"
           />
         </div>
       );

     case "cards":
       return (
         <div className="space-y-6">
           <div className="text-center space-y-4">
             <h2 className="text-2xl font-connie text-white">Переверните карты</h2>
             <p className="text-[var(--foreground-secondary)] font-cormorant">
               {cardCount === 3 
                 ? "Нажмите на карты по порядку: 1 → 2 → 3"
                 : "Нажмите на карты по порядку: 3 → 1 → 5 → 2 → 4"
               }
             </p>
           </div>
           <div className="flex justify-center items-center">
             {cardCount === 3 ? (
               // Расклад на 3 карты: горизонтально 1-2-3
               <div className="flex gap-4">
                 {selectedCards.map((cardId, index) => (
                   <div key={index} className="text-center">
                     <div
                       className={`w-20 h-32 rounded-lg border-2 cursor-pointer transition-all ${
                         revealedCards.includes(index)
                           ? "bg-white border-accent"
                           : revealedCards.length === index
                           ? "bg-gradient-to-b from-amber-500 to-orange-600 border-amber-400 animate-pulse shadow-lg"
                           : "bg-gradient-to-b from-purple-600 to-blue-600 border-accent/30 hover:border-accent opacity-60"
                       }`}
                       onClick={() => revealCard(index)}
                     >
                       {revealedCards.includes(index) ? (
                         <div className="h-full flex flex-col items-center justify-center p-2">
                           <Eye className="h-6 w-6 text-purple-600 mb-1" />
                           <span className="text-xs text-purple-600 font-medium">
                             Карта {index + 1}
                           </span>
                         </div>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center">
                           <Sparkles className="text-white/80 h-6 w-6" />
                           <span className="text-white/60 text-xs mt-1">{index + 1}</span>
                         </div>
                       )}
                     </div>
                     <p className="text-xs text-[var(--foreground-secondary)] mt-2">
                       {index + 1}
                     </p>
                   </div>
                 ))}
               </div>
             ) : (
               // Расклад на 5 карт: крестом согласно ТЗ
               <div className="relative w-80 h-80 flex items-center justify-center">
                 {selectedCards.map((cardId, index) => {
                   // Позиции карт согласно ТЗ: 3 сверху, 1-5-2 в середине, 4 снизу
                   // ✅ ИСПРАВЛЕНИЕ ПУНКТА 23: Новое позиционирование без наложения карт
                   const positions = [
                     { top: '35%', left: '5%' },   // Карта 1 (слева)
                     { top: '35%', right: '5%' },  // Карта 2 (справа)
                     { top: '0%', left: '50%', transform: 'translateX(-50%)' }, // Карта 3 (сверху)
                     { bottom: '0%', left: '50%', transform: 'translateX(-50%)' }, // Карта 4 (снизу)
                     { top: '35%', left: '50%', transform: 'translateX(-50%)' }, // Карта 5 (центр)
                   ];
                   
                   return (
                     <div 
                       key={index} 
                       className="absolute text-center"
                       style={positions[index]}
                     >
                       <div
                         className={`w-16 h-24 rounded-lg border-2 cursor-pointer transition-all ${
                           revealedCards.includes(index)
                             ? "bg-white border-accent"
                             : (() => {
                                 // ✅ ИСПРАВЛЕНИЕ ПУНКТА 23: Правильная подсказка для 5 карт  
                                 const expectedOrder = Number(cardCount) === 3 ? [0, 1, 2] : [2, 0, 4, 1, 3];
                                 const nextCardIndex = expectedOrder[revealedCards.length];
                                 return index === nextCardIndex
                                   ? "bg-gradient-to-b from-amber-500 to-orange-600 border-amber-400 animate-pulse shadow-lg"
                                   : "bg-gradient-to-b from-purple-600 to-blue-600 border-accent/30 hover:border-accent opacity-60";
                               })()
                         }`}
                         onClick={() => revealCard(index)}
                       >
                         {revealedCards.includes(index) ? (
                           <div className="h-full flex flex-col items-center justify-center p-1">
                             <Eye className="h-4 w-4 text-purple-600 mb-1" />
                             <span className="text-xs text-purple-600 font-medium">
                               {index + 1}
                             </span>
                           </div>
                         ) : (
                           <div className="h-full flex flex-col items-center justify-center">
                             <Sparkles className="text-white/80 h-5 w-5" />
                             <span className="text-white/60 text-xs mt-1">{index + 1}</span>
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             )}
           </div>
          
          {revealedCards.length === cardCount && (
            <div className="text-center">
              <p className="text-accent font-medium mb-4">
                ✨ Все карты открыты! Готовы узнать толкование?
              </p>
            </div>
          )}
        </div>
      );

    case "reading":
      return (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-connie text-white">Ваш расклад готов</h2>
            <div className="flex justify-center gap-4">
              {selectedCards.map((cardId, index) => (
                <div key={index} className="w-20 h-32 bg-white rounded-lg border-2 border-accent flex items-center justify-center shadow-lg">
                  <span className="text-sm text-purple-600 font-medium">Карта {index + 1}</span>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="bg-card/50 border-border">
            <CardContent className="p-6">
              <TarotText text={reading} />
            </CardContent>
          </Card>
        </div>
      );

    default:
      return null;
  }
};

return (
  <MainLayout title="Карты" activeTab="tarot">
    <div className="space-y-6 mb-20 px-4">
      {currentStep !== "reading" && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            {["layout", "category", "preset", "question", "cards"].map((step, index) => (
              <div
                key={step}
                className={`w-3 h-3 rounded-full transition-all ${
                  ["layout", "category", "preset", "question", "cards"].indexOf(currentStep) >= index
                    ? "bg-accent"
                    : "bg-border"
                }`}
              />
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetReading}
            className="text-[var(--foreground-secondary)] hover:text-white"
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Сначала
          </Button>
        </div>
      )}

      {renderStep()}

      <div className="flex gap-4 pt-6">
        {currentStep !== "layout" && currentStep !== "reading" && (
          <Button
            variant="outline"
            onClick={() => {
              const steps: Step[] = ["layout", "category", "preset", "question", "cards"];
              const currentIndex = steps.indexOf(currentStep);
              if (currentIndex > 0) {
                // ✅ ИСПРАВЛЕНИЕ ПУНКТА 21: Сбрасываем карты при возврате
                if (currentStep === "cards") {
                  setSelectedCards([]);
                  setRevealedCards([]);
                }
                setCurrentStep(steps[currentIndex - 1]);
              }
            }}
            className="flex-1"
          >
            Назад
          </Button>
        )}
        
        {currentStep !== "reading" && (
          <Button
            onClick={nextStep}
            disabled={
              (currentStep === "cards" && revealedCards.length < cardCount) ||
              generateReading.isPending
            }
            className="flex-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 text-white font-connie text-lg py-6 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-[1.02] border border-purple-400/30"
          >
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>
                {currentStep === "cards" 
                  ? generateReading.isPending 
                    ? "Создаю расклад..." 
                    : "Получить толкование"
                  : currentStep === "layout"
                  ? "Продолжить"
                  : "Далее"
                }
              </span>
              <Sparkles className="h-5 w-5" />
            </div>
          </Button>
        )}
        
        {currentStep === "reading" && (
          <Button
            onClick={resetReading}
            className="flex-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 text-white font-connie text-lg py-6 rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-[1.02] border border-purple-400/30"
          >
            <div className="flex items-center justify-center gap-2">
              <RotateCcw className="h-5 w-5" />
              <span>Новый расклад</span>
              <Sparkles className="h-5 w-5" />
            </div>
          </Button>
        )}
      </div>
    </div>
  </MainLayout>
);
}