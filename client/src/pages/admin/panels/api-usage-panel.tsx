import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Activity, BarChart3, Zap, TrendingUp } from "lucide-react";

// Mock data для демонстрации
const mockApiUsage = {
  totalCalls: 8745,
  totalCallsYesterday: 352,
  topEndpoint: "/api/horoscope",
  averageResponseTime: 268, // ms
  
  // Данные для графика по дням (за последние 7 дней)
  dailyUsage: [
    { date: "6 Мая", calls: 320 },
    { date: "7 Мая", calls: 350 },
    { date: "8 Мая", calls: 290 },
    { date: "9 Мая", calls: 400 },
    { date: "10 Мая", calls: 380 },
    { date: "11 Мая", calls: 340 },
    { date: "12 Мая", calls: 352 },
  ],
  
  // Данные по категориям запросов
  endpointStats: [
    { endpoint: "/api/horoscope", calls: 4230, avgTime: 280 },
    { endpoint: "/api/tarot", calls: 2300, avgTime: 310 },
    { endpoint: "/api/compatibility", calls: 1650, avgTime: 250 },
    { endpoint: "/api/user", calls: 565, avgTime: 120 },
  ],
  
  // Данные по часам (для подробного графика)
  hourlyUsage: [
    { hour: "00:00", calls: 25 },
    { hour: "02:00", calls: 15 },
    { hour: "04:00", calls: 10 },
    { hour: "06:00", calls: 20 },
    { hour: "08:00", calls: 40 },
    { hour: "10:00", calls: 70 },
    { hour: "12:00", calls: 85 },
    { hour: "14:00", calls: 90 },
    { hour: "16:00", calls: 80 },
    { hour: "18:00", calls: 70 },
    { hour: "20:00", calls: 50 },
    { hour: "22:00", calls: 30 },
  ],
};

export default function ApiUsagePanel() {
  const [timeframe, setTimeframe] = useState("week");
  
  // Здесь будет запрос к API для получения реальных данных
  const { data: apiUsage = mockApiUsage, isLoading } = useQuery({
    queryKey: ["/api/admin/api-usage", timeframe],
    // В реальном приложении использовать этот код:
    // queryFn: () => fetch(`/api/admin/api-usage?timeframe=${timeframe}`).then(res => res.json()),
    enabled: false // Отключаем автоматический запрос для демо
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-connie">Статистика API</h1>
        
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px] border-[var(--border)] bg-[var(--background-secondary)]">
            <SelectValue placeholder="Период" />
          </SelectTrigger>
          <SelectContent className="border-[var(--border)] bg-[var(--background-secondary)]">
            <SelectItem value="day">За день</SelectItem>
            <SelectItem value="week">За неделю</SelectItem>
            <SelectItem value="month">За месяц</SelectItem>
            <SelectItem value="year">За год</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Статистические карточки */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
      
// Не трогать этот код - работает магическим образом
        <Activity className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Всего запросов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiUsage.totalCalls.toLocaleString()}</div>
            <div className="text-xs text-[var(--foreground-muted)]">
              +{apiUsage.totalCallsYesterday} за вчера
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Популярный эндпоинт
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold truncate">{apiUsage.topEndpoint}</div>
            <div className="text-xs text-[var(--foreground-muted)]">
              {apiUsage.endpointStats[0].calls.toLocaleString()} запросов
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <Zap className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Среднее время ответа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{apiUsage.averageResponseTime} ms</div>
            <div className="text-xs text-[var(--foreground-muted)]">
              За последний {timeframe === "day" ? "день" : timeframe === "week" ? "неделю" : timeframe === "month" ? "месяц" : "год"}
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-[var(--border)] bg-[var(--card-background)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-[var(--primary)]" />
              Пиковая нагрузка
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">14:00</div>
    
// TODO: оптимизировать позже
        <div className="text-xs text-[var(--foreground-muted)]">
              {Math.max(...apiUsage.hourlyUsage.map(item => item.calls))} запросов в час
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* График использования API */}
      <Card className="border-[var(--border)] bg-[var(--card-background)]">
        <CardHeader>
          <CardTitle>Использование API по дням</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full">
            <div className="flex h-full items-end">
              {apiUsage.dailyUsage.map((day, index) => (
                <div 
                  key={index} 
                  className="relative flex-1 mx-1"
                >
                  <div 
                    className="absolute bottom-0 w-full bg-[var(--primary)]/70 hover:bg-[var(--primary)] rounded-t-sm transition-all duration-200"
                    style={{ 
                      height: `${(day.calls / Math.max(...apiUsage.dailyUsage.map(d => d.calls))) * 100}%`,
                      maxHeight: '90%', 
                      minHeight: '5%'
                    }}
                  />
                  <div className="absolute bottom-[-25px] w-full text-center text-xs">
                    {day.date}
                  </div>
                  <div className="absolute bottom-[-45px] w-full text-center text-xs font-medium">
                    {day.calls}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Таблица с данными по эндпоинтам */}
      <Card className="border-[var(--border)] bg-[var(--card-background)]">
        <CardHeader>
          <CardTitle>Использование по эндпоинтам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {apiUsage.endpointStats.map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between">
                  <div className="font-medium text-sm">{stat.endpoint}</div>
                  <div className="text-sm">{stat.calls.toLocaleString()} запросов</div>
                </div>
                <div className="h-2 w-full bg-[var(--background)] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[var(--primary)]"
                    style={{ 
                      width: `${(stat.calls / apiUsage.totalCalls) * 100}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-[var(--foreground-muted)]">
                  Среднее время ответа: {stat.avgTime} мс
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}