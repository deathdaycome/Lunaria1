import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/shared/date-picker";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronRight, RefreshCcw } from "lucide-react";

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

export default function CompatibilityTest() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Сбрасываем состояние при закрытии диалога
  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      // Сбрасываем состояние
      setCompatibilityResult(null);
      setPartnerType("self");
      setSelectedFriendId("");
      setPartnerDate(undefined);
    }
  };
  const [partnerType, setPartnerType] = useState<"self" | "friend" | "custom">("self");
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [partnerDate, setPartnerDate] = useState<Date | undefined>(undefined);
  const [compatibilityResult, setCompatibilityResult] = useState<CompatibilityResult | null>(null);

  const { data: friends = [] } = useQuery<Friend[]>({
    queryKey: ["/api/friends"],
    enabled: !!user && isDialogOpen,
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
  
  // Содержимое диалога выбора партнера
  const renderPartnerSelectionContent = () => (
    <div className="space-y-4 overflow-y-auto flex-grow">
      <div className="space-y-2">
        <label className="text-base font-cormorant font-medium text-white">Выберите партнера для проверки</label>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={`p-3 rounded-xl border text-left text-white ${
              partnerType === "friend" 
                ? "border-amber-400 bg-[var(--background-secondary)]/80" 
                : "border-[var(--border)] bg-[var(--background-secondary)]/50 hover:text-white/80 hover:opacity-80"
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
                : "border-[var(--border)] bg-[var(--background-secondary)]/50 hover:text-white/80 hover:opacity-80"
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
                    : "hover:bg-[var(--background-tertiary)] hover:text-white/80"
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
          <div className="calendar-wrapper" style={{ position: 'relative', zIndex: 9999 }}>
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
        {compatibilityMutation.isPending ? "Расчет..." : "Рассчитать совместимость"}
      </Button>
    </div>
  );
  
  // Содержимое диалога с результатами
  const renderResultContent = () => {
    if (!compatibilityResult) return null;
    
    return (
      <div className="flex flex-col h-full max-h-full overflow-hidden flex-grow">
        {/* Шапка с данными пользователей (скрывается при прокрутке) */}
        <div className="flex-shrink-0">
          {/* Не трогать этот код - работает магическим образом */}
          {/* Информация о пользователе и партнере */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* Информация о пользователе */}
            <div className="rounded-xl bg-[var(--background-secondary)]/80 backdrop-blur-sm border border-[var(--border)] p-3">
              <p className="text-center font-medium text-sm sm:text-base text-white">{formatDate(new Date(user?.birthDate || ""))}</p>
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm mt-1 text-white">
                <p className="truncate">Возраст: {calculateAge(new Date(user?.birthDate || ""))}</p>
                <p className="truncate">{getDaysOld(new Date(user?.birthDate || ""))} дней</p>
              </div>
              <p className="text-xs sm:text-sm mt-1 text-white">Главная цифра: {getNumericCode(new Date(user?.birthDate || ""))}</p>
            </div>
            
            {/* Информация о партнере */}
            <div className="rounded-xl bg-[var(--background-secondary)]/80 backdrop-blur-sm border border-[var(--border)] p-3">
              <p className="text-center font-medium text-sm sm:text-base text-white">
                {compatibilityResult.partnerData?.birthDate ? 
                  formatDate(new Date(compatibilityResult.partnerData.birthDate)) : 
                  "Дата не указана"}
              </p>
              <div className="flex flex-col sm:flex-row sm:justify-between text-xs sm:text-sm mt-1 text-white">
                {compatibilityResult.partnerData?.birthDate && (
                  <>
                    <p className="truncate">Возраст: {calculateAge(new Date(compatibilityResult.partnerData.birthDate))}</p>
                    <p className="truncate">{getDaysOld(new Date(compatibilityResult.partnerData.birthDate))} дней</p>
                  </>
                )}
              </div>
              <p className="text-sm text-white">
                {compatibilityResult.partnerData?.birthDate ?
                  `Главная цифра ${getNumericCode(new Date(compatibilityResult.partnerData.birthDate))}` :
                  ""}
              </p>
            </div>
          </div>
          
          {/* Прогресс бар совместимости - более заметный */}
          <div className="mb-4">
            <div className="relative">
              <Progress 
                value={compatibilityResult.compatibilityScore} 
                className="h-10 rounded-md progress-golden bg-slate-200"
              />
              <div 
                className="absolute inset-0 flex items-center justify-center text-base sm:text-xl"
                style={{ 
                  color: 'black',
                  fontWeight: 'bold'
                }}
              >
                {compatibilityResult.compatibilityScore}%
              </div>
            </div>
          </div>
        </div>
        
        {/* Текст анализа - занимает всё доступное пространство */}
        <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar mb-4">
          <p className="font-cormorant text-sm sm:text-base leading-relaxed text-white whitespace-pre-line">{compatibilityResult.analysis}</p>
        </div>
        
        {/* Кнопка нового теста */}
        <div className="flex-shrink-0">
          <Button 
            className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)]"
            onClick={() => setCompatibilityResult(null)}
          >
            Новый тест
          </Button>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card className="bg-[var(--background-secondary)] bg-opacity-50 hover:bg-opacity-70 transition-all duration-300 cursor-pointer">
        <CardContent className="p-4" onClick={() => setIsDialogOpen(true)}>
          <p className="text-center font-medium mb-2">Тест на совместимость</p>
          <p className="text-xs text-center">Проверьте астрологическую совместимость с любым человеком</p>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent 
          aria-describedby="compatibility-test-description"
          forceMount
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: "32rem", 
            maxWidth: "90vw",
            maxHeight: "85vh",
            zIndex: 999,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--primary) transparent"
          }}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="font-connie text-xl">Тест на совместимость</DialogTitle>
          </DialogHeader>
          
          <div id="compatibility-test-description" className="sr-only">
            Выберите партнера для проверки совместимости
          </div>
          
          <div className="flex-grow overflow-hidden flex flex-col">
            {!compatibilityResult ? renderPartnerSelectionContent() : renderResultContent()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}