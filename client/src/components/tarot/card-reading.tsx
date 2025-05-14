import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import CosmicLoader from "@/components/shared/cosmic-loader";

type TarotCategory = "psychology" | "relationships" | "friendship" | "career" | "business" | "children";

type CategoryInfo = {
  name: string;
};

type CardReadingProps = {
  type: string;
  readingType: string;
  onBack: () => void;
};

export default function CardReading({ type, readingType, onBack }: CardReadingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [category, setCategory] = useState<TarotCategory>("relationships");
  const [question, setQuestion] = useState("");
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [showReading, setShowReading] = useState(false);
  const [reading, setReading] = useState<string>("");

  const categories: Record<TarotCategory, CategoryInfo> = {
    psychology: { name: "Психология" },
    relationships: { name: "Отношения" },
    friendship: { name: "Дружба" },
    career: { name: "Карьера" },
    business: { name: "Бизнес" },
    children: { name: "Дети" },
  };

  const cardCount = readingType === "three-cards" ? 3 : 5;

  const readingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tarot", {
        category,
        question,
        cardCount,
        cardType: type,
      });
      return await res.json();
    },
    onSuccess: (data) => {
      setReading(data.reading);
      setShowReading(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const flipCard = (index: number) => {
    if (!flippedCards.includes(index)) {
      const newFlipped = [...flippedCards, index];
      setFlippedCards(newFlipped);

      // If all cards are flipped, enable the reading button
      if (newFlipped.length === cardCount) {
        setTimeout(() => {
          document.getElementById("reading-button")?.scrollIntoView({ behavior: "smooth" });
        }, 500);
      }
    }
  };

  const getReading = () => {
    if (flippedCards.length !== cardCount) {
      toast({
        title: "Внимание",
        description: "Пожалуйста, переверните все карты перед чтением",
      });
      return;
    }
    
    if (!question.trim()) {
      toast({
        title: "Внимание",
        description: "Пожалуйста, опишите вашу ситуацию перед чтением",
      });
      return;
    }

    readingMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h3 className="text-lg font-medium">Расклад {type === "tarot" ? "Таро" : "Ленорман"}</h3>
      </div>

      {!showReading ? (
        <>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Выберите тематику вопроса</h3>
            
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(categories).map(([key, cat]) => (
                <Button
                  key={key}
                  variant={category === key ? "default" : "outline"}
                  className={category === key ? "bg-primary" : "bg-card-bg"}
                  onClick={() => setCategory(key as TarotCategory)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
            
            <div>
              <Textarea
                placeholder="Опишите вашу ситуацию подробно"
                className="w-full p-3 h-24 bg-card-bg text-white border border-accent/30"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>
            
            <p className="text-center text-gray-300 my-4">Переверните карты по одной</p>
            
            <div className="flex justify-center gap-4 mb-6">
              {Array.from({ length: cardCount }).map((_, index) => (
                <div
                  key={index}
                  className={`w-20 h-32 rounded-lg shadow-lg cursor-pointer transition-all duration-500 ${
                    flippedCards.includes(index)
                      ? "bg-card"
                      : "bg-primary"
                  }`}
                  style={{
                    transform: flippedCards.includes(index) ? "rotateY(180deg)" : "",
                    backgroundImage: !flippedCards.includes(index) 
                      ? "linear-gradient(135deg, #5428B0, #3F207A)" 
                      : "",
                    border: "1px solid #B197FC"
                  }}
                  onClick={() => flipCard(index)}
                >
                  {flippedCards.includes(index) && (
                    <div className="w-full h-full flex items-center justify-center transform rotate-180">
                      <span className="text-2xl">
                        {/* Simplified tarot card symbol */}
                        {index === 0 ? "★" : index === 1 ? "♥" : index === 2 ? "☀" : index === 3 ? "☽" : "⚡"}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            <Button
              id="reading-button"
              className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-xl transition-all shadow-md"
              onClick={getReading}
              disabled={readingMutation.isPending || flippedCards.length !== cardCount}
            >
              {readingMutation.isPending ? (
                <div className="flex items-center">
                  <CosmicLoader size="small" text="" />
                  <span className="ml-2">Создаем предсказание...</span>
                </div>
              ) : "Хочу узнать"}
            </Button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <Card className="card p-5">
            <h4 className="font-medium mb-3">Толкование карт</h4>
            <div className="mb-4">
              <p className="text-sm font-medium text-accent mb-1">Ваш вопрос:</p>
              <p className="text-sm text-gray-300 italic mb-3">{question}</p>
              
              <p className="text-sm font-medium text-accent mb-1">Толкование:</p>
              <p className="text-sm text-gray-200 whitespace-pre-line">{reading}</p>
            </div>
          </Card>
          
          <Button
            className="w-full py-6 bg-primary hover:bg-accent text-white font-medium rounded-lg transition-all"
            onClick={onBack}
          >
            Новый расклад
          </Button>
        </div>
      )}
    </div>
  );
}
