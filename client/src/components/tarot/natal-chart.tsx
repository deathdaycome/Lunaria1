import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/date-picker";
import { TimePicker } from "@/components/shared/time-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, ArrowLeft } from "lucide-react";
import NatalChartWheel from "@/components/natal-chart/natal-chart-wheel";
import CosmicLoader from "@/components/shared/cosmic-loader";

const natalChartSchema = z.object({
  name: z.string().min(1, "Введите имя"),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }),
  birthTime: z.date().optional(),
  birthPlace: z.string().optional(),
});

type NatalChartFormValues = z.infer<typeof natalChartSchema>;

// ✅ ИСПРАВЛЕНО: Добавлен интерфейс для типизации ответа API
interface NatalChartResult {
  chartData: any;
  analysis: string;
  svgFileName: string;
  svg_name: string; // ← ДОБАВЬ ЭТУ СТРОКУ!
}

export default function NatalChart() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"self" | "other">("self");
  // ✅ ИСПРАВЛЕНО: Типизация состояния результата
  const [chartResult, setChartResult] = useState<NatalChartResult | null>(null);

  const form = useForm<NatalChartFormValues>({
    resolver: zodResolver(natalChartSchema),
    defaultValues: {
      name: "",
      birthPlace: "",
    },
  });

  const natalChartMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/natal-chart", data);
      const result = await res.json();
      
      // ✅ ИСПРАВЛЕНО: Проверяем что API возвращает svgFileName
      console.log("API Response:", result); // Для отладки
      
      if (!result.svgFileName) {
        throw new Error("Сервер не вернул имя SVG файла");
      }
      
      return result;
    },
    onSuccess: (data: NatalChartResult) => {
      console.log("Chart result received:", data); // Для отладки
      setChartResult(data);
    },
    onError: (error: Error) => {
      console.error("Natal chart error:", error); // Для отладки
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const buildChart = () => {
    if (chartType === "self") {
      // ✅ ИСПРАВЛЕНО: Проверяем наличие необходимых данных пользователя
      if (!user?.birthDate) {
        toast({
          title: "Ошибка",
          description: "В профиле не указана дата рождения",
          variant: "destructive",
        });
        return;
      }
      
      natalChartMutation.mutate({ type: "self" });
    } else {
      form.handleSubmit((data) => {
        const birthTimeFormatted = data.birthTime
          ? `${data.birthTime.getHours().toString().padStart(2, '0')}:${data.birthTime.getMinutes().toString().padStart(2, '0')}`
          : undefined;
          
        natalChartMutation.mutate({
          type: "other",
          name: data.name,
          birthDate: data.birthDate,
          birthTime: birthTimeFormatted,
          birthPlace: data.birthPlace || undefined,
        });
      })();
    }
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setChartResult(null);
    form.reset();
  };

  const handleBack = () => {
    setChartResult(null);
  };

  return (
    <>
      <Card className="card rounded-xl p-5 mb-4">
        <h3 className="font-medium mb-3">Натальная карта</h3>
        <p className="text-sm text-gray-300 mb-4">Раскройте глубокие тайны вашего рождения и личности</p>
        
        <Button 
          className="w-full py-6 bg-primary hover:bg-accent text-white font-medium rounded-lg transition-all"
          onClick={() => setIsDialogOpen(true)}
        >
          Построить натальную карту
        </Button>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleClose}>
        <DialogContent 
          className="card border-accent/20 max-w-5xl max-h-[95vh] overflow-hidden p-0 gap-0"
          aria-describedby="natal-chart-description"
        >
          <div className="sticky top-0 z-50 bg-[var(--background)] border-b border-[var(--border)] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {chartResult && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="text-white hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Назад
                </Button>
              )}
              <DialogTitle className="text-xl font-connie text-white">
                {chartResult ? "Ваша натальная карта" : "Натальная карта"}
              </DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div id="natal-chart-description" className="sr-only">
            Создайте натальную карту, указав данные рождения
          </div>

          <div className="overflow-y-auto max-h-[calc(95vh-80px)] p-6">
            {!chartResult ? (
              <div className="space-y-6">
                <Tabs defaultValue="self" value={chartType} onValueChange={(val) => setChartType(val as "self" | "other")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6 bg-[var(--background-secondary)]">
                    <TabsTrigger value="self" className="text-white data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
                      Для себя
                    </TabsTrigger>
                    <TabsTrigger value="other" className="text-white data-[state=active]:bg-[var(--primary)] data-[state=active]:text-white">
                      Для другого человека
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="self" className="space-y-4">
                    <div className="bg-[var(--background-secondary)]/50 rounded-lg p-4 border border-[var(--border)]">
                      <p className="text-base font-cormorant text-white mb-4">
                        Будет использована информация из вашего профиля:
                      </p>
                      <div className="space-y-3 text-base">
                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/30">
                          <span className="text-white/70 font-cormorant">Имя:</span>
                          <span className="text-white font-medium">{user?.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/30">
                          <span className="text-white/70 font-cormorant">Дата рождения:</span>
                          <span className="text-white font-medium">
                            {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('ru-RU') : 'Не указана'}
                          </span>
                        </div>
                        {user?.birthTime && (
                          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]/30">
                            <span className="text-white/70 font-cormorant">Время рождения:</span>
                            <span className="text-white font-medium">{user.birthTime}</span>
                          </div>
                        )}
                        {user?.birthPlace && (
                          <div className="flex justify-between items-center py-2">
                            <span className="text-white/70 font-cormorant">Место рождения:</span>
                            <span className="text-white font-medium">{user.birthPlace}</span>
                          </div>
                        )}
                        
                        {(!user?.birthTime || !user?.birthPlace) && (
                          <div className="mt-4 p-3 bg-amber-400/10 border border-amber-400/20 rounded-lg">
                            <p className="text-amber-400 text-sm font-cormorant">
                              ⚠️ Для точной натальной карты рекомендуется указать время и место рождения в настройках профиля
                            </p>
                          </div>
                        )}
                        
                        {/* ✅ ИСПРАВЛЕНО: Предупреждение если нет даты рождения */}
                        {!user?.birthDate && (
                          <div className="mt-4 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
                            <p className="text-red-400 text-sm font-cormorant">
                              ❌ Дата рождения не указана в профиле. Добавьте её в настройках.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="other" className="space-y-4">
                    <div className="bg-[var(--background-secondary)]/50 rounded-lg p-4 border border-[var(--border)]">
                      <Form {...form}>
                        <form className="space-y-5">
                          <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white font-cormorant text-base">Имя</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Введите имя" 
                                    {...field} 
                                    className="bg-[var(--background-secondary)] border-[var(--border)] text-white placeholder:text-white/50 h-12 text-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="birthDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white font-cormorant text-base">Дата рождения</FormLabel>
                                <FormControl>
                                  <DatePicker
                                    date={field.value}
                                    setDate={field.onChange}
                                    className="bg-[var(--background-secondary)] border-[var(--border)] h-12"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="birthTime"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white font-cormorant text-base">
                                  Время рождения (необязательно)
                                </FormLabel>
                                <FormControl>
                                  <TimePicker
                                    value={field.value}
                                    onChange={field.onChange}
                                    className="bg-[var(--background-secondary)] border-[var(--border)] h-12"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="birthPlace"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white font-cormorant text-base">
                                  Место рождения (необязательно)
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Город, Страна"
                                    {...field}
                                    className="bg-[var(--background-secondary)] border-[var(--border)] text-white placeholder:text-white/50 h-12 text-base"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </form>
                      </Form>
                    </div>
                  </TabsContent>
                </Tabs>

                <Button 
                  className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie text-lg rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)]"
                  onClick={buildChart}
                  disabled={natalChartMutation.isPending}
                >
                  {natalChartMutation.isPending ? "Построение карты..." : "✨ Построить натальную карту"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ✅ КРИТИЧНО ИСПРАВЛЕНО: Передача svgFileName в компонент */}
                <div className="w-full overflow-hidden">
                  <NatalChartWheel 
                    chartData={chartResult.chartData} 
                    analysis={chartResult.analysis}
                    svgFileName={chartResult.svg_name} // ← ДОБАВЛЕНО!
                  />
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    variant="outline"
                    className="flex-1 py-4 border-[var(--border)] text-white hover:bg-white/10 font-connie rounded-xl"
                    onClick={handleBack}
                  >
                    Назад к настройкам
                  </Button>
                  <Button 
                    className="flex-1 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl"
                    onClick={handleClose}
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}