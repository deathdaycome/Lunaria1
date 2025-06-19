import { useState, useEffect } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
  className?: string;
}

export function DatePicker({ date, setDate, className }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState<number>((date?.getMonth() || new Date().getMonth()) + 1);
  const [year, setYear] = useState<number>(date?.getFullYear() || new Date().getFullYear());
  
  // Массив с названиями месяцев
  const monthNames = [
    "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", 
    "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"
  ];
  
  // ✨ ОГРАНИЧИВАЕМ ДИАПАЗОН ЛЕТ - только последние 100 лет
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 100; // с 1924 по текущий год
  const years = Array.from({ length: 101 }, (_, i) => currentYear - i);
  
  // Обновление даты в календаре при изменении месяца или года
  const updateCalendarDate = (newMonth: number, newYear: number) => {
    if (date) {
      const newDate = new Date(date);
      newDate.setMonth(newMonth - 1);
      newDate.setFullYear(newYear);
      setDate(newDate);
    } else {
      const newDate = new Date();
      newDate.setMonth(newMonth - 1);
      newDate.setFullYear(newYear);
      setDate(newDate);
    }
  };
  
  // Обновление месяца и года при открытии попапа
  useEffect(() => {
    if (open && date) {
      setMonth(date.getMonth() + 1);
      setYear(date.getFullYear());
    }
  }, [open, date]);
  
  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground border-[#6366f1]/30 bg-[#1a1a2e] text-white",
            date && "text-white border-[#6366f1]/30 bg-[#1a1a2e]",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "dd.MM.yyyy", { locale: ru }) : <span>ДД.ММ.ГГГГ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[320px] p-4 card border-[#6366f1]/30 bg-[#1a1a2e] text-white shadow-xl"
        align="start"
        side="top"
        sideOffset={12}
        forceMount
        style={{ 
          zIndex: 9999,
          maxHeight: '400px',
          overflow: 'hidden',
          // Дополнительное позиционирование для поднятия окна
          transform: 'translateY(-20px)'
        }}
      >
        <div className="mt-0 pt-2">
          <div className="grid grid-cols-1 gap-3 space-y-2">
            {/* День */}
            <div>
              <label className="text-sm font-medium mb-2 block">День</label>
              <Select
                value={date ? date.getDate().toString() : "1"}
                onValueChange={(val) => {
                  const newDay = parseInt(val);
                  if (date) {
                    const newDate = new Date(date);
                    newDate.setDate(newDay);
                    setDate(newDate);
                  } else {
                    const newDate = new Date(year, month - 1, newDay);
                    setDate(newDate);
                  }
                }}
              >
                <SelectTrigger className="h-10 border-[#6366f1]/30 bg-[#252240] text-white text-sm">
                  <SelectValue placeholder="День" />
                </SelectTrigger>
                <SelectContent 
                  className="border-[#6366f1]/30 bg-[#252240] text-white"
                  style={{ maxHeight: '180px', overflowY: 'auto' }}
                >
                  {Array.from({ length: new Date(year, month, 0).getDate() }, (_, i) => i + 1).map((day) => (
                    <SelectItem 
                      key={day} 
                      value={day.toString()}
                      className="hover:bg-[#32304d] focus:bg-[#32304d] text-sm py-2"
                    >
                      {day}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Месяц */}
            <div>
              <label className="text-sm font-medium mb-2 block">Месяц</label>
              <Select
                value={month.toString()}
                onValueChange={(val) => {
                  const newMonth = parseInt(val);
                  setMonth(newMonth);
                  updateCalendarDate(newMonth, year); 
                }}
              >
                <SelectTrigger className="h-10 border-[#6366f1]/30 bg-[#252240] text-white text-sm">
                  <SelectValue placeholder="Месяц" />
                </SelectTrigger>
                <SelectContent 
                  className="border-[#6366f1]/30 bg-[#252240] text-white"
                  style={{ maxHeight: '180px', overflowY: 'auto' }}
                >
                  {monthNames.map((name, index) => (
                    <SelectItem 
                      key={index} 
                      value={(index + 1).toString()}
                      className="hover:bg-[#32304d] focus:bg-[#32304d] text-sm py-2"
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Год */}
            <div>
              <label className="text-sm font-medium mb-2 block">Год</label>
              <Select
                value={year.toString()}
                onValueChange={(val) => {
                  const newYear = parseInt(val);
                  setYear(newYear);
                  updateCalendarDate(month, newYear);
                }}
              >
                <SelectTrigger className="h-10 border-[#6366f1]/30 bg-[#252240] text-white text-sm">
                  <SelectValue placeholder="Год" />
                </SelectTrigger>
                <SelectContent 
                  className="border-[#6366f1]/30 bg-[#252240] text-white"
                  style={{ 
                    maxHeight: '180px', 
                    overflowY: 'auto',
                    position: 'relative'
                  }}
                >
                  {years.map((y) => (
                    <SelectItem 
                      key={y} 
                      value={y.toString()}
                      className="hover:bg-[#32304d] focus:bg-[#32304d] text-sm py-2"
                    >
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={() => setOpen(false)}
            className="mt-4 w-full h-10 border-[#6366f1]/50 bg-[#32304d] hover:bg-[#42405d] text-white text-sm"
          >
            Выбрать
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}