import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface TimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState<string>(value ? value.getHours().toString().padStart(2, '0') : "12");
  const [minutes, setMinutes] = useState<string>(value ? value.getMinutes().toString().padStart(2, '0') : "00");

  const hoursRef = useRef<HTMLDivElement>(null);
  const minutesRef = useRef<HTMLDivElement>(null);

  const hours24 = Array.from({ length: 24 }).map((_, i) => i.toString().padStart(2, '0'));
  // Добавим пустые элементы в начало и конец для лучшего эффекта прокрутки
  const hoursWithPadding = ["", "", ...hours24, "", ""];
  
  const minutesArr = Array.from({ length: 60 }).map((_, i) => i.toString().padStart(2, '0'));
  // Также добавим пустые элементы
  const minutesWithPadding = ["", "", ...minutesArr, "", ""];

  // Эффект для установки начальной позиции колес при открытии попапа
  useEffect(() => {
    if (open && hoursRef.current && minutesRef.current) {
      // Обновим состояние часов и минут, если есть значение
      if (value) {
        const h = value.getHours().toString().padStart(2, '0');
        const m = value.getMinutes().toString().padStart(2, '0');
        setHours(h);
        setMinutes(m);
      }
      
      // Установим начальную позицию прокрутки
      setTimeout(() => {
        if (hoursRef.current && minutesRef.current) {
          // Найдем индекс выбранного часа (с учетом пустых элементов в начале)
          const hourIndex = hoursWithPadding.findIndex(h => h === hours);
          const minuteIndex = minutesWithPadding.findIndex(m => m === minutes);
          
          // Прокрутим колесо до выбранного часа (высота элемента 40px)
          if (hourIndex >= 0) {
            hoursRef.current.scrollTop = (hourIndex - 2) * 40; // -2 из-за пустых элементов
          }
          
          // То же самое для минут
          if (minuteIndex >= 0) {
            minutesRef.current.scrollTop = (minuteIndex - 2) * 40;
          }
        }
      }, 50);
    }
  }, [open, value]);

  // Функция для "привязки" скролла к ближайшему элементу
  const snapToClosest = (element: HTMLDivElement, itemHeight: number) => {
    const scrollTop = element.scrollTop;
    const index = Math.round(scrollTop / itemHeight);
    const targetScroll = index * itemHeight;
    
    // Плавная анимация прокрутки до целевой позиции
    element.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
    
    return index + 2; // +2 из-за пустых элементов в начале
  };

  // Обработчик прокрутки колеса часов
  const handleHoursScroll = () => {
    if (hoursRef.current) {
      // При остановке скролла, привязываем к ближайшему элементу
      clearTimeout(hoursRef.current.dataset.scrollTimeout as any);
      hoursRef.current.dataset.scrollTimeout = setTimeout(() => {
        if (hoursRef.current) {
          const index = snapToClosest(hoursRef.current, 40);
          
          if (index >= 2 && index < hoursWithPadding.length - 2) {
            const newHour = hoursWithPadding[index];
            if (newHour !== hours) {
              setHours(newHour);
              updateTime(newHour, minutes);
            }
          }
        }
      }, 100) as any;
    }
  };

  // Обработчик прокрутки колеса минут
  const handleMinutesScroll = () => {
    if (minutesRef.current) {
      // При остановке скролла, привязываем к ближайшему элементу
      clearTimeout(minutesRef.current.dataset.scrollTimeout as any);
      minutesRef.current.dataset.scrollTimeout = setTimeout(() => {
        if (minutesRef.current) {
          const index = snapToClosest(minutesRef.current, 40);
          
          if (index >= 2 && index < minutesWithPadding.length - 2) {
            const newMinute = minutesWithPadding[index];
            if (newMinute !== minutes) {
              setMinutes(newMinute);
              updateTime(hours, newMinute);
            }
          }
        }
      }, 100) as any;
    }
  };

  // Обновление времени и вызов onChange
  const updateTime = (h: string, m: string) => {
    if (h && m) {
      const newDate = new Date();
      newDate.setHours(parseInt(h));
      newDate.setMinutes(parseInt(m));
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      onChange(newDate);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground border-[#6366f1]/30 bg-[#1a1a2e] text-white",
            value && "text-white border-[#6366f1]/30 bg-[#1a1a2e]",
            className
          )}
        >
          <Clock className="mr-2 h-4 w-4" />
          {value ? (
            `${value.getHours().toString().padStart(2, '0')}:${value.getMinutes().toString().padStart(2, '0')}`
          ) : (
            <span>Выберите время</span>
          )}
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-64 p-4 card border-[#6366f1]/30 bg-[#1a1a2e] text-white" align="start">
        <div className="text-center mb-4 text-lg font-medium text-white">
          Выберите время
        </div>
        
        <div className="flex justify-center mb-4">
          <div className="ios-time-picker w-full mx-auto relative">
            {/* Выделенная область для текущего выбора */}
            <div className="selection-band absolute left-0 right-0 h-[40px] top-[80px] bg-[#6366f1]/20 rounded-md border-t border-b border-[#6366f1]/40 pointer-events-none z-10"></div>
            
            {/* Верхний и нижний градиенты */}
            <div className="absolute top-0 left-0 right-0 h-[70px] bg-gradient-to-b from-[#1a1a2e] to-transparent pointer-events-none z-20"></div>
            <div className="absolute bottom-0 left-0 right-0 h-[70px] bg-gradient-to-t from-[#1a1a2e] to-transparent pointer-events-none z-20"></div>
            
            <div className="flex">
              {/* Колесо часов */}
              <div 
                ref={hoursRef}
                className="wheel flex-1 h-[200px] overflow-y-auto scrollbar-hide px-4 snap-y"
                onScroll={handleHoursScroll}
              >
                {hoursWithPadding.map((hour, index) => (
                  <div 
                    key={`hour-${index}`}
                    className={cn(
                      "h-[40px] flex items-center justify-center text-lg transition-all duration-200 snap-center",
                      hour === hours ? "text-white font-medium scale-110" : hour ? "text-gray-400" : "text-transparent"
                    )}
                  >
                    {hour}
                  </div>
                ))}
              </div>
              
              {/* Разделитель */}
              <div className="flex items-center justify-center">
                <span className="text-2xl font-medium px-1">:</span>
              </div>
              
              {/* Колесо минут */}
              <div 
                ref={minutesRef}
                className="wheel flex-1 h-[200px] overflow-y-auto scrollbar-hide px-4 snap-y"
                onScroll={handleMinutesScroll}
              >
                {minutesWithPadding.map((minute, index) => (
                  <div 
                    key={`minute-${index}`}
                    className={cn(
                      "h-[40px] flex items-center justify-center text-lg transition-all duration-200 snap-center",
                      minute === minutes ? "text-white font-medium scale-110" : minute ? "text-gray-400" : "text-transparent"
                    )}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          className="w-full mt-2 border-[#6366f1]/50 bg-[#32304d] hover:bg-[#42405d] text-white"
          onClick={() => setOpen(false)}
        >
          Готово
        </Button>
      </PopoverContent>
    </Popover>
  );
}
