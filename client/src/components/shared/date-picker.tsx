import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addYears, subYears } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  
  // Диапазон лет от 1900 до текущего года + 10
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 20 }, (_, i) => currentYear - i);
  
  // Для режима выбора десятилетий
  const [yearRangeStart, setYearRangeStart] = useState<number>(Math.floor(currentYear / 10) * 10 - 10);
  const decadeYears = Array.from({ length: 30 }, (_, i) => yearRangeStart + i);
  
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
        className="w-auto p-4 card border-[#6366f1]/30 bg-[#1a1a2e] text-white shadow-xl" 
        align="center"
        side="bottom"
        sideOffset={5}
        forceMount
        style={{ zIndex: 9999 }}
      >
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4 bg-[#252240] text-white">
            <TabsTrigger value="calendar" className="data-[state=active]:bg-[#32304d]">Календарь</TabsTrigger>
            <TabsTrigger value="select" className="data-[state=active]:bg-[#32304d]">Выбор</TabsTrigger>
            <TabsTrigger value="years" className="data-[state=active]:bg-[#32304d]">Годы</TabsTrigger>
          </TabsList>
          
          {/* Режим календаря */}
          <TabsContent value="calendar" className="mt-0">
            <div className="flex items-center justify-between mb-2">
              <Select
                value={month.toString()}
                onValueChange={(val) => {
                  const newMonth = parseInt(val);
                  setMonth(newMonth);
                  updateCalendarDate(newMonth, year);
                }}
              >
                <SelectTrigger className="w-[140px] border-[#6366f1]/30 bg-[#252240] text-white">
                  <SelectValue placeholder="Месяц" />
                </SelectTrigger>
                <SelectContent className="border-[#6366f1]/30 bg-[#252240] text-white">
                  {monthNames.map((name, index) => (
                    <SelectItem 
                      key={index} 
                      value={(index + 1).toString()}
                      className="hover:bg-[#32304d] focus:bg-[#32304d]"
                    >
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newYear = year - 1;
                    setYear(newYear);
                    updateCalendarDate(month, newYear);
                  }}
                  className="h-7 w-7 border-[#6366f1]/30 bg-[#252240] text-white hover:bg-[#32304d]"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-medium text-center min-w-[40px]">{year}</div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    const newYear = year + 1;
                    setYear(newYear);
                    updateCalendarDate(month, newYear);
                  }}
                  className="h-7 w-7 border-[#6366f1]/30 bg-[#252240] text-white hover:bg-[#32304d]"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => {
                setDate(date);
                setOpen(false);
              }}
              month={new Date(year, month - 1)}
              onMonthChange={(newDate) => {
                setMonth(newDate.getMonth() + 1);
                setYear(newDate.getFullYear());
              }}
              locale={ru}
              initialFocus
              className="cosmic-calendar border-[#6366f1]/30 bg-[#1a1a2e] text-white"
            />
          </TabsContent>
          
          {/* Режим выбора года и месяца из списков */}
          <TabsContent value="select" className="mt-0 pt-2">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Год</label>
                <Select
                  value={year.toString()}
                  onValueChange={(val) => {
                    const newYear = parseInt(val);
                    setYear(newYear);
                    updateCalendarDate(month, newYear);
                  }}
                >
                  <SelectTrigger className="border-[#6366f1]/30 bg-[#252240] text-white">
                    <SelectValue placeholder="Выберите год" />
                  </SelectTrigger>
                  <SelectContent className="h-60 border-[#6366f1]/30 bg-[#252240] text-white">
                    {years.map((y) => (
                      <SelectItem 
                        key={y} 
                        value={y.toString()}
                        className="hover:bg-[#32304d] focus:bg-[#32304d]"
                      >
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">Месяц</label>
                <Select
                  value={month.toString()}
                  onValueChange={(val) => {
                    const newMonth = parseInt(val);
                    setMonth(newMonth);
                    updateCalendarDate(newMonth, year);
                  }}
                >
                  <SelectTrigger className="border-[#6366f1]/30 bg-[#252240] text-white">
                    <SelectValue placeholder="Выберите месяц" />
                  </SelectTrigger>
                  <SelectContent className="border-[#6366f1]/30 bg-[#252240] text-white">
                    {monthNames.map((name, index) => (
                      <SelectItem 
                        key={index} 
                        value={(index + 1).toString()}
                        className="hover:bg-[#32304d] focus:bg-[#32304d]"
                      >
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium mb-1 block">День</label>
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
                  <SelectTrigger className="border-[#6366f1]/30 bg-[#252240] text-white">
                    <SelectValue placeholder="Выберите день" />
                  </SelectTrigger>
                  <SelectContent className="border-[#6366f1]/30 bg-[#252240] text-white">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem 
                        key={day} 
                        value={day.toString()}
                        className="hover:bg-[#32304d] focus:bg-[#32304d]"
                      >
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              onClick={() => setOpen(false)}
              className="mt-4 w-full border-[#6366f1]/50 bg-[#32304d] hover:bg-[#42405d] text-white"
            >
              Выбрать
            </Button>
          </TabsContent>
          
          {/* Режим выбора из десятилетий */}
          <TabsContent value="years" className="mt-0 pt-2">
            <div className="flex justify-between items-center mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYearRangeStart(yearRangeStart - 30)}
                className="border-[#6366f1]/30 bg-[#252240] text-white hover:bg-[#32304d]"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Предыдущие
              </Button>
              
              <span className="text-sm font-medium">
                {yearRangeStart} - {yearRangeStart + 29}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setYearRangeStart(yearRangeStart + 30)}
                className="border-[#6366f1]/30 bg-[#252240] text-white hover:bg-[#32304d]"
              >
                Следующие
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
            
            <div className="grid grid-cols-5 gap-2">
              {decadeYears.map((y) => (
                <Button
                  key={y}
                  variant="outline"
                  className={cn(
                    "h-9 border-[#6366f1]/30 bg-[#252240] text-white hover:bg-[#32304d]",
                    y === year && "bg-[#6366f1] hover:bg-[#7879f1]"
                  )}
                  onClick={() => {
                    setYear(y);
                    updateCalendarDate(month, y);
                  }}
                >
                  {y}
                </Button>
              ))}
            </div>
            
            <Button 
              onClick={() => setOpen(false)}
              className="mt-4 w-full border-[#6366f1]/50 bg-[#32304d] hover:bg-[#42405d] text-white"
            >
              Выбрать
            </Button>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
