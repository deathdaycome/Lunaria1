import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimePickerProps {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

export function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState<string>(
    value ? value.getHours().toString().padStart(2, '0') : "12"
  );
  const [minutes, setMinutes] = useState<string>(
    value ? value.getMinutes().toString().padStart(2, '0') : "00"
  );

  // Генерируем массивы часов и минут
  const hoursArray = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutesArray = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Обновление времени
  const updateTime = (newHours: string, newMinutes: string) => {
    const newDate = new Date();
    newDate.setHours(parseInt(newHours));
    newDate.setMinutes(parseInt(newMinutes));
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    console.log('🔍 TimePicker updating time:', newDate);
    onChange(newDate);
  };

  const handleHoursChange = (newHours: string) => {
    setHours(newHours);
    updateTime(newHours, minutes);
  };

  const handleMinutesChange = (newMinutes: string) => {
    setMinutes(newMinutes);
    updateTime(hours, newMinutes);
  };

  const handleConfirm = () => {
    updateTime(hours, minutes);
    setOpen(false);
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
      
      <PopoverContent className="w-72 p-4 card border-[#6366f1]/30 bg-[#1a1a2e] text-white" align="start">
        <div className="text-center mb-4 text-lg font-medium text-white">
          Выберите время
        </div>
        
        <div className="flex gap-4 items-center justify-center mb-4">
          {/* Селект для часов */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-center">Часы</label>
            <Select value={hours} onValueChange={handleHoursChange}>
              <SelectTrigger className="w-full bg-[#2a2a3e] border-[#6366f1]/30 text-white">
                <SelectValue placeholder="Часы" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a3e] border-[#6366f1]/30 max-h-60">
                {hoursArray.map((hour) => (
                  <SelectItem 
                    key={hour} 
                    value={hour}
                    className="text-white hover:bg-[#6366f1]/20 focus:bg-[#6366f1]/20"
                  >
                    {hour}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Разделитель */}
          <div className="text-2xl font-bold pt-6">:</div>

          {/* Селект для минут */}
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2 text-center">Минуты</label>
            <Select value={minutes} onValueChange={handleMinutesChange}>
              <SelectTrigger className="w-full bg-[#2a2a3e] border-[#6366f1]/30 text-white">
                <SelectValue placeholder="Минуты" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a3e] border-[#6366f1]/30 max-h-60">
                {minutesArray.map((minute) => (
                  <SelectItem 
                    key={minute} 
                    value={minute}
                    className="text-white hover:bg-[#6366f1]/20 focus:bg-[#6366f1]/20"
                  >
                    {minute}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Предварительный просмотр выбранного времени */}
        <div className="text-center mb-4 p-3 bg-[#6366f1]/10 rounded-lg">
          <div className="text-sm text-gray-400 mb-1">Выбранное время:</div>
          <div className="text-xl font-mono text-white">
            {hours}:{minutes}
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline"
            className="flex-1 border-[#6366f1]/50 bg-transparent hover:bg-[#6366f1]/20 text-white"
            onClick={() => setOpen(false)}
          >
            Отмена
          </Button>
          <Button 
            className="flex-1 border-[#6366f1]/50 bg-[#6366f1] hover:bg-[#5855eb] text-white"
            onClick={handleConfirm}
          >
            Готово
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}