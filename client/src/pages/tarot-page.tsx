import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import MainLayout from "@/components/layout/main-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RotateCcw } from "lucide-react";
import TarotCard, { getRandomTarotCard, extractCardNamesFromText } from "../components/TarotCard";


// ✅ КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ РАСКЛАДА С КРАСИВЫМИ ПОДЗАГОЛОВКАМИ
const TarotReading = ({ reading }: { reading: Array<{title: string, content: string}> }) => {
  console.log("=== ДИАГНОСТИКА TarotReading ===");
  console.log("🔍 Получен reading:", reading);
  
  if (!reading || !Array.isArray(reading) || reading.length === 0) {
    return (
      <div className="text-center py-8 text-white/60">
        <p>Толкование карт недоступно</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-connie text-amber-400 mb-2 flex items-center justify-center">
          <span className="mr-3">🔮</span>
          Толкование вашего расклада
          <span className="ml-3">🔮</span>
        </h3>
        <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
      </div>

      {/* Разделы расклада */}
      <div className="space-y-6">
        {reading.map((section, index) => (
          <div key={index} className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-6 border border-purple-400/20 backdrop-blur-sm">
            {/* Яркий подзаголовок */}
            <h4 className="text-xl font-connie text-amber-300 mb-4 flex items-center">
              <span className="mr-2">✨</span>
              {section.title}
              <span className="ml-2">✨</span>
            </h4>
            
            {/* Контент секции */}
            <div className="text-white leading-relaxed font-cormorant text-base">
              {section.content.split('\n\n').map((paragraph, pIndex) => (
                <p key={pIndex} className="mb-3 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        ))}
      </div>
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
      cards3: ["Мои силы", "Мои слабности", "Совет для роста"],
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

type Step = "layout" | "category" | "preset" | "question" | "cards" | "reading";

export default function TarotPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // ✅ ИСПРАВЛЕНИЕ: Детекция режима низкой производительности
  useEffect(() => {
    const detectPerformanceMode = () => {
      // Более мягкие условия для активации режима низкой производительности
      const isLowPerformance = 
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency < 6) ||
        ((navigator as any).deviceMemory && (navigator as any).deviceMemory < 6) ||
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        // Дополнительная проверка на мобильные устройства
        ('ontouchstart' in window) ||
        // Проверка производительности через FPS
        performance.now() < 16.67; // Если браузер работает медленно
      
      console.log('🔍 Performance detection:', {
        hardwareConcurrency: navigator.hardwareConcurrency,
        deviceMemory: (navigator as any).deviceMemory,
        windowWidth: window.innerWidth,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isTouchDevice: 'ontouchstart' in window,
        isLowPerformance
      });
      
      if (isLowPerformance) {
        document.body.classList.add('low-performance-mode');
        console.log('✅ Low performance mode activated');
      } else {
        console.log('ℹ️ Normal performance mode');
      }
    };
    
    detectPerformanceMode();
  }, []);
  
  const [currentStep, setCurrentStep] = useState<Step>("layout");
  const [cardCount, setCardCount] = useState<3 | 5>(3);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [revealedCards, setRevealedCards] = useState<number[]>([]);
  
  // ✅ НОВЫЕ СОСТОЯНИЯ ДЛЯ ХРАНЕНИЯ ДАННЫХ ОТ API
  const [readingData, setReadingData] = useState<Array<{title: string, content: string}>>([]);
  const [cardNames, setCardNames] = useState<string[]>([]);

  // ✨ ПОЛУЧАЕМ ПРЕСЕТЫ ДЛЯ ВЫБРАННОЙ КАТЕГОРИИ
  const getPresetsForCategory = () => {
    return TAROT_PRESETS[selectedCategory] || TAROT_PRESETS["love"];
  };

  // ✅ ИСПРАВЛЕННАЯ МУТАЦИЯ ДЛЯ ГЕНЕРАЦИИ РАСКЛАДА
  const generateReading = useMutation({
    mutationFn: async () => {
      console.log("🔍 Sending tarot request:", {
        question,
        cardCount,
        category: selectedCategory,
        preset: selectedPreset,
        selectedCardNames: cardNames,
      });

      const response = await fetch("/api/tarot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question: question.trim(),
          cardCount: cardCount,
          category: selectedCategory,
          preset: selectedPreset,
          selectedCardNames: cardNames, // ✅ ДОБАВЛЯЕМ ВЫБРАННЫЕ КАРТЫ
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("❌ Tarot API error:", error);
        throw new Error(error.error || "Ошибка при создании расклада");
      }

      const data = await response.json();
      console.log("✅ ПОЛНЫЙ ответ API:", JSON.stringify(data, null, 2));
      
      // ✅ ПРАВИЛЬНАЯ ОБРАБОТКА ОТВЕТА API
      if (data.reading && Array.isArray(data.reading)) {
        console.log("✅ Reading is array with", data.reading.length, "sections");
        setReadingData(data.reading);
        
        // ✅ ИЗВЛЕКАЕМ НАЗВАНИЯ КАРТ ИЗ ЗАГОЛОВКОВ РАЗДЕЛОВ И КОНТЕНТА
        let extractedCardNames: string[] = [];
        
        // Метод 1: Из заголовков секций (формат "Прошлое - Дурак")
        const cardNamesFromTitles = data.reading
          .slice(0, cardCount)
          .map((section: any) => {
            const match = section.title.match(/- (.+)$/);
            return match ? match[1] : null;
          })
          .filter(Boolean);
        
        // Метод 2: Из контента секций используя функцию извлечения
        const fullText = data.reading.map((section: any) => section.content).join('\n');
        const cardNamesFromContent = extractCardNamesFromText(fullText, cardCount);
        
        // Объединяем результаты, приоритет у заголовков
        extractedCardNames = cardNamesFromTitles.length >= cardCount 
          ? cardNamesFromTitles.slice(0, cardCount)
          : cardNamesFromContent.slice(0, cardCount);
        
        // Если все еще не хватает карт, добавляем случайные
        while (extractedCardNames.length < cardCount) {
          extractedCardNames.push(getRandomTarotCard());
        }
        
        setCardNames(extractedCardNames);
        console.log("✅ Extracted card names:", extractedCardNames);
      } else {
        console.error("❌ Invalid reading structure:", data);
        throw new Error("Получен неверный формат расклада");
      }
      
      return data;
    },
    onSuccess: (data) => {
      console.log("✅ Tarot reading received and processed");
      setCurrentStep("reading");
      toast({
        title: "Расклад готов",
        description: "Карты раскрыли свои тайны",
      });
    },
    onError: (error: Error) => {
      console.error("❌ Tarot generation error:", error);
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
        // ✅ ИСПРАВЛЕНИЕ: Сбрасываем карты при смене категории
        setSelectedCards([]);
        setRevealedCards([]);
        setCardNames([]);
        setReadingData([]);
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
        // ✅ ИСПРАВЛЕНИЕ: Сбрасываем карты при смене пресета
        setSelectedCards([]);
        setRevealedCards([]);
        setCardNames([]);
        setReadingData([]);
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
        // ✅ ГЕНЕРИРУЕМ ФИНАЛЬНЫЕ НАЗВАНИЯ КАРТ НА ФРОНТЕНДЕ
        const randomCards = Array.from({ length: cardCount }, () => 
          Math.floor(Math.random() * 78) + 1
        );
        const finalCardNames = Array.from({ length: cardCount }, () => getRandomTarotCard());
        setSelectedCards(randomCards);
        setCardNames(finalCardNames); // Устанавливаем финальные названия
        setCurrentStep("cards");
        break;
      case "cards":
        // ✅ ИСПРАВЛЕНИЕ: строгая проверка количества открытых карт
        if (revealedCards.length !== cardCount) {
          console.log(`❌ Cards validation failed: revealed ${revealedCards.length}, expected ${cardCount}`);
          toast({
            title: "Откройте все карты",
            description: `Необходимо открыть все ${cardCount} карт перед получением толкования`,
            variant: "destructive",
          });
          return;
        }
        
        // ✅ ИСПРАВЛЕНИЕ: проверяем что выбранные карты соответствуют количеству
        if (selectedCards.length !== cardCount) {
          console.log(`❌ Selected cards validation failed: selected ${selectedCards.length}, expected ${cardCount}`);
          toast({
            title: "Ошибка выбора карт",
            description: `Количество выбранных карт (${selectedCards.length}) не соответствует расчетному (${cardCount})`,
            variant: "destructive",
          });
          return;
        }
        
        // ✅ ПРОВЕРЯЕМ ЧТО ВСЕ НЕОБХОДИМЫЕ ДАННЫЕ ЗАПОЛНЕНЫ
        if (!selectedCategory || !selectedPreset || !question.trim()) {
          toast({
            title: "Неполные данные",
            description: "Убедитесь что выбраны категория, пресет и описана ситуация",
            variant: "destructive",
          });
          return;
        }
        
        console.log(`✅ Validation passed: ${cardCount} cards selected and revealed`);
        console.log(`✅ Request data: category=${selectedCategory}, preset=${selectedPreset}, question length=${question.length}`);
        
        generateReading.mutate();
        break;
      default:
        break;
    }
  };

  const revealCard = (index: number) => {
    // ✅ ИСПРАВЛЕНИЕ: Правильный порядок открывания карт
    let expectedOrder: number[];
    
    if (cardCount === 3) {
      // Для 3 карт: открываем по порядку номеров на рубашке: 1 → 2 → 3
      expectedOrder = [0, 1, 2]; // индексы карт: первая (0) → вторая (1) → третья (2)
    } else {
      // Для 5 карт: порядок открывания 3 → 1 → 5 → 2 → 4
      // Это означает: карта с номером 3 (индекс 2) → карта с номером 1 (индекс 0) → и т.д.
      expectedOrder = [2, 0, 4, 1, 3]; // индексы в порядке открывания
    }
    
    // Проверяем, что пользователь кликнул на правильную карту
    const expectedNextCardIndex = expectedOrder[revealedCards.length];
    
    console.log(`🎴 Card click: index ${index}, expected ${expectedNextCardIndex}, revealed count: ${revealedCards.length}`);
    
    if (index === expectedNextCardIndex && !revealedCards.includes(index)) {
      setRevealedCards([...revealedCards, index]);
      console.log(`✅ Card ${index + 1} revealed correctly`);
    } else if (index !== expectedNextCardIndex) {
      // Показываем правильный номер карты (номер на рубашке = индекс + 1)
      // ✅ ИСПРАВЛЕНИЕ: правильный номер для сообщения об ошибке
      let expectedCardNumber: number;
      if (cardCount === 3) {
        expectedCardNumber = expectedNextCardIndex + 1;
      } else {
        // Для 5 карт: преобразуем индекс в номер на рубашке
        expectedCardNumber = [2, 4, 1, 5, 3][expectedNextCardIndex];
      }
      toast({
        title: "Неправильный порядок",
        description: `Откройте карту с номером ${expectedCardNumber}`,
        variant: "destructive",
      });
      console.log(`❌ Wrong card clicked. Expected card number: ${expectedCardNumber}`);
    } else if (revealedCards.includes(index)) {
      console.log(`⚠️ Card ${index + 1} already revealed`);
    }
  };

  const resetReading = () => {
    setCurrentStep("layout");
    setSelectedCategory("");
    setSelectedPreset("");
    setQuestion("");
    setSelectedCards([]);
    setRevealedCards([]);
    setReadingData([]);
    setCardNames([]);
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
                Расскажите подробнее о том, что вас беспокоит
              </p>
            </div>
            
            <Textarea
              placeholder="Опишите вашу ситуацию, вопрос или проблему. Чем подробнее, тем точнее будет толкование..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-32 bg-background/50 border-border text-white placeholder:text-white/50 resize-none"
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
                  : "Нажмите на карты по порядку: 1 → 2 → 3 → 4 → 5"
                }
              </p>
            </div>
            <div className="flex justify-center items-center min-h-[200px] w-full px-4">
              {cardCount === 3 ? (
                // Расклад на 3 карты: горизонтально 1-2-3
                <div className="tarot-cards-container flex gap-3 justify-center items-center w-full max-w-sm" data-card-count="3">
                  {selectedCards.map((cardId, index) => (
                    <div key={index} className="text-center flex-shrink-0">
                      <div
                        className={`w-16 h-24 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                          revealedCards.includes(index)
                            ? "border-accent"
                            : revealedCards.length === index
                            ? "bg-gradient-to-b from-amber-500 to-orange-600 border-amber-400 animate-pulse shadow-lg"
                            : "bg-gradient-to-b from-purple-600 to-blue-600 border-accent/30 hover:border-accent opacity-60"
                        }`}
                        onClick={() => revealCard(index)}
                      >
                        {revealedCards.includes(index) ? (
                          // ✅ ПОКАЗЫВАЕМ РЕАЛЬНУЮ КАРТУ ТАРО
                          <TarotCard 
                            cardName={cardNames[index] || getRandomTarotCard()} 
                            width={64}
                            height={96}
                            showName={false}
                          />
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
                <div 
                  className="tarot-cards-container relative w-80 h-80 flex items-center justify-center mx-auto"
                  data-card-count="5"
                >
                  {selectedCards.map((cardId, index) => {
                    // Позиции карт согласно ТЗ: 3 сверху, 1-5-2 в середине, 4 снизу
                    const positions = [
                      { top: '50%', left: '5px', transform: 'translateY(-50%)' },   // Карта 1 (слева)
                      { top: '50%', right: '5px', transform: 'translateY(-50%)' },  // Карта 2 (справа)  
                      { top: '5px', left: '50%', transform: 'translateX(-50%)' },   // Карта 3 (сверху)
                      { bottom: '5px', left: '50%', transform: 'translateX(-50%)' }, // Карта 4 (снизу)
                      { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, // Карта 5 (центр)
                    ];
                    
                    return (
                      <div 
                        key={index} 
                        className="absolute text-center"
                        style={positions[index]}
                      >
                        <div
                          className={`w-14 h-20 rounded-lg border-2 cursor-pointer transition-all overflow-hidden ${
                            revealedCards.includes(index)
                              ? "border-accent"
                              : (() => {
                                  // Правильная подсказка для 5 карт  
                                  const expectedOrder = cardCount === 3 ? [0, 1, 2] : [2, 0, 4, 1, 3];
                                  const nextCardIndex = expectedOrder[revealedCards.length];
                                  return index === nextCardIndex
                                    ? "bg-gradient-to-b from-amber-500 to-orange-600 border-amber-400 animate-pulse shadow-lg"
                                    : "bg-gradient-to-b from-purple-600 to-blue-600 border-accent/30 hover:border-accent opacity-60";
                                })()
                          }`}
                          onClick={() => revealCard(index)}
                        >
                          {revealedCards.includes(index) ? (
                            // ✅ ПОКАЗЫВАЕМ РЕАЛЬНУЮ КАРТУ ТАРО
                            <TarotCard 
                              cardName={cardNames[index] || getRandomTarotCard()} 
                              width={56}
                              height={80}
                              showName={false}
                            />
                          ) : (
                            <div className="h-full flex flex-col items-center justify-center">
                              <Sparkles className="text-white/80 h-4 w-4" />
                              <span className="text-white/60 text-xs mt-1">
                                {[2, 4, 1, 5, 3][index]}
                              </span>
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
              {/* ✅ ПОКАЗЫВАЕМ РЕАЛЬНЫЕ КАРТЫ ОТ API */}
              {cardNames.length > 0 && (
                <div className="flex justify-center gap-4 items-end">
                  {cardNames.map((cardName, index) => (
                    <div key={index} className="flex-shrink-0">
                      <TarotCard 
                        cardName={cardName}
                        width={80}
                        height={128}
                        showName={true}
                      />
                    </div>
                  ))}
                </div>
              )}
              {/* ✅ FALLBACK: Если нет названий карт от API */}
              {cardNames.length === 0 && (
                <div className="text-amber-400 text-sm">
                  Карты выбраны, толкование готово
                </div>
              )}
            </div>
            
            <Card className="bg-card/50 border-border">
              <CardContent className="p-6">
                {/* ✅ ИСПОЛЬЗУЕМ НОВЫЙ КОМПОНЕНТ ДЛЯ ОТОБРАЖЕНИЯ */}
                <TarotReading reading={readingData} />
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout title="Карты" showHeader={false} activeTab="tarot">
      {/* ✅ ИСПРАВЛЕНИЕ: Добавляем контейнер с правильным скроллом */}
      <div className="min-h-screen overflow-y-auto pb-32">
        <div className="container mx-auto px-4 space-y-6 max-w-4xl" style={{ paddingTop: 'max(120px, env(safe-area-inset-top, 120px))', paddingBottom: '24px' }}>
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

          {/* Кнопки под контентом каждого шага */}
          {currentStep !== "reading" && (
            <div className="mt-8 pt-8">
              <div className="flex items-center gap-4 max-w-md mx-auto">
                {currentStep !== "layout" && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      const steps: Step[] = ["layout", "category", "preset", "question", "cards"];
                      const currentIndex = steps.indexOf(currentStep);
                      if (currentIndex > 0) {
                        if (currentStep === "cards") {
                          setSelectedCards([]);
                          setRevealedCards([]);
                          setCardNames([]);
                          setReadingData([]);
                        }
                        setCurrentStep(steps[currentIndex - 1]);
                      }
                    }}
                    className="flex-1 h-12 bg-[var(--background-secondary)]/80 backdrop-blur-sm border-[var(--border)] text-white hover:bg-[var(--background-tertiary)] transition-all"
                  >
                    Назад
                  </Button>
                )}
                
                <Button
                  onClick={nextStep}
                  disabled={
                    (currentStep === "cards" && revealedCards.length < cardCount) ||
                    generateReading.isPending
                  }
                  className="flex-1 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 text-white font-connie text-lg rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-[1.02] border border-purple-400/30 h-12"
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
              </div>
            </div>
          )}
          
          {currentStep === "reading" && (
            <div className="mt-8 pt-8">
              <div className="flex justify-center">
                <Button
                  onClick={resetReading}
                  className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 text-white font-connie text-lg rounded-xl shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] transition-all duration-300 transform hover:scale-[1.02] border border-purple-400/30 h-12 px-8"
                >
                  <div className="flex items-center justify-center gap-2">
                    <RotateCcw className="h-5 w-5" />
                    <span>Новый расклад</span>
                    <Sparkles className="h-5 w-5" />
                  </div>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}