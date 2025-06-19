import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NatalChartWheel from "@/components/natal-chart/natal-chart-wheel";

// ✨ НОВАЯ СХЕМА с поддержкой всех типов
const natalChartSchema = z.object({
  name: z.string().min(1, "Введите имя").optional(),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }).optional(),
  birthTime: z.date().optional(),
  birthPlace: z.string().optional(),
  birthCountry: z.string().optional(),
  friendId: z.string().optional(),
});

type NatalChartFormValues = z.infer<typeof natalChartSchema>;

// ✨ СПИСОК СТРАН
const COUNTRIES = [
  "Россия", "США", "Германия", "Франция", "Италия", "Испания", 
  "Великобритания", "Канада", "Австралия", "Япония", "Китай", 
  "Индия", "Бразилия", "Мексика", "Аргентина", "Турция", 
  "Южная Корея", "Польша", "Нидерланды", "Швеция", "Норвегия", 
  "Дания", "Финляндия", "Чехия", "Венгрия", "Португалия", 
  "Греция", "Швейцария", "Австрия", "Бельгия", "Украина", 
  "Беларусь", "Казахстан"
];

export default function NatalChartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"self" | "friend" | "other">("self");
  const [chartResult, setChartResult] = useState<any>(null);

  const form = useForm<NatalChartFormValues>({
    resolver: zodResolver(natalChartSchema),
    defaultValues: {
      name: "",
      birthPlace: "",
      birthCountry: "Россия",
    },
  });

  // ✨ ЗАПРОС СПИСКА ДРУЗЕЙ
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/friends");
      return await res.json();
    },
    enabled: chartType === "friend"
  });

  const natalChartMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/natal-chart", data);
      return await res.json();
    },
    onSuccess: (data) => {
      console.log("🌌 API Response received:", data); // ✅ ДОБАВЬ ЭТУ СТРОКУ
      console.log("🌌 SVG filename in response:", data.svgFileName); // ✅ И ЭТУ
      setChartResult(data);
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const buildChart = () => {
    if (chartType === "self") {
      // ✨ ДЛЯ СЕБЯ
      natalChartMutation.mutate({ type: "self" });
      
    } else if (chartType === "friend") {
      // ✨ ДЛЯ ДРУГА
      const friendId = form.getValues("friendId");
      if (!friendId) {
        toast({
          title: "Ошибка",
          description: "Выберите друга из списка",
          variant: "destructive",
        });
        return;
      }
      natalChartMutation.mutate({ 
        type: "friend", 
        friendId: parseInt(friendId) 
      });
      
    } else {
      // ✨ ДЛЯ ДРУГОГО ЧЕЛОВЕКА
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
          birthCountry: data.birthCountry || "Россия",
        });
      })();
    }
  };

  return (
    <MainLayout title="Натальная карта" activeTab="natal-chart" showHeader={false}>
      <div className="space-y-6 mb-20 px-4" style={{ paddingTop: 'max(120px, env(safe-area-inset-top, 120px))' }}>
        <h2 className="page-heading font-gilroy">Натальная карта</h2>
        <p className="text-[var(--foreground-secondary)] font-cormorant text-lg">
          Раскройте глубокие тайны вашего рождения и личности через древнее искусство астрологии
        </p>

        <Card className="card rounded-xl p-6 mb-4">
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-[rgba(155,89,182,0.4)] to-[rgba(84,40,176,0.6)] rounded-full flex items-center justify-center mb-4">
              <span className="text-3xl">🌌</span>
            </div>
            
            <h3 className="text-2xl font-cinzel font-bold text-gold-gradient title-glow">
              Построить натальную карту
            </h3>
            
            <p className="text-gray-300 mb-6 font-cormorant text-lg leading-relaxed">
              Узнайте о влиянии планет в момент вашего рождения. Натальная карта покажет ваши скрытые таланты, жизненный путь и предназначение.
            </p>
            
            <Button 
              className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)] text-lg"
              onClick={() => setIsDialogOpen(true)}
            >
              Создать натальную карту
            </Button>
          </div>
        </Card>

        {user?.subscriptionType === "free" && (
          <Card className="bg-[var(--background-secondary)]/80 backdrop-blur-sm border-[var(--border)] rounded-xl">
            <CardContent className="p-4 text-center">
              <p className="text-sm mb-3 font-cormorant text-[var(--foreground-secondary)]">
                Получите детальную интерпретацию всех аспектов натальной карты с премиум подпиской
              </p>
              <Button 
                variant="secondary" 
                size="sm" 
                className="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-connie"
              >
                Улучшить подписку
              </Button>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent 
            className="card border-accent/20 max-w-4xl max-h-[90vh] overflow-y-auto"
            aria-describedby="natal-chart-description"
          >
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-cinzel text-gold-gradient">
                Настройка натальной карты
              </DialogTitle>
            </DialogHeader>
            <div id="natal-chart-description" className="sr-only">
              Создайте натальную карту, указав данные рождения
            </div>

            {!chartResult ? (
              <div className="space-y-6">
                {/* ✨ НОВЫЕ ТАБЫ: Для себя, Для друга, Для другого человека */}
                <Tabs defaultValue="self" value={chartType} onValueChange={(val) => setChartType(val as "self" | "friend" | "other")}>
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger value="self">Для себя</TabsTrigger>
                    <TabsTrigger value="friend">Для друга</TabsTrigger>
                    <TabsTrigger value="other">Для другого человека</TabsTrigger>
                  </TabsList>

                  <TabsContent value="self" className="space-y-4">
                    <p className="text-sm text-gray-300 mb-4 font-cormorant text-center">
                      Будет использована информация из вашего профиля:
                    </p>
                    <div className="bg-[var(--background-tertiary)] rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Имя:</span>
                        <span className="font-medium">{user?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Дата рождения:</span>
                        <span className="font-medium">{new Date(user?.birthDate || "").toLocaleDateString()}</span>
                      </div>
                      {user?.birthTime && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Время рождения:</span>
                          <span className="font-medium">{user.birthTime}</span>
                        </div>
                      )}
                      {user?.birthPlace && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Место рождения:</span>
                          <span className="font-medium">{user.birthPlace}</span>
                        </div>
                      )}
                      {user?.birthCountry && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Страна рождения:</span>
                          <span className="font-medium">{user.birthCountry}</span>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* ✨ НОВАЯ ВКЛАДКА: ДЛЯ ДРУГА */}
                  <TabsContent value="friend" className="space-y-4">
                    <p className="text-sm text-gray-300 mb-4 font-cormorant text-center">
                      Выберите друга из вашего списка:
                    </p>
                    <div className="bg-[var(--background-tertiary)] rounded-lg p-4">
                      <Form {...form}>
                        <FormField
                          control={form.control}
                          name="friendId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Выберите друга</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-card-bg">
                                    <SelectValue placeholder="Выберите друга из списка" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {friends.map((friend: any) => (
                                    <SelectItem key={friend.id} value={friend.id.toString()}>
                                      {friend.name} ({friend.zodiacSign})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </Form>
                      
                      {friends.length === 0 && (
                        <p className="text-center text-gray-400 mt-4">
                          У вас пока нет друзей в списке. Добавьте друзей в разделе "Совместимость".
                        </p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="other">
                    <Form {...form}>
                      <form className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Имя</FormLabel>
                              <FormControl>
                                <Input placeholder="Имя" {...field} className="bg-card-bg" />
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
                              <FormLabel>Дата рождения</FormLabel>
                              <FormControl>
                                <DatePicker
                                  date={field.value}
                                  setDate={field.onChange}
                                  className="bg-card-bg"
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
                              <FormLabel>Время рождения (необязательно)</FormLabel>
                              <FormControl>
                                <TimePicker
                                  value={field.value}
                                  onChange={field.onChange}
                                  className="bg-card-bg"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        {/* ✨ НОВОЕ ПОЛЕ: СТРАНА РОЖДЕНИЯ */}
                        <FormField
                          control={form.control}
                          name="birthCountry"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Страна рождения</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || "Россия"}>
                                <FormControl>
                                  <SelectTrigger className="bg-card-bg">
                                    <SelectValue placeholder="Выберите страну" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {COUNTRIES.map((country) => (
                                    <SelectItem key={country} value={country}>
                                      {country}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="birthPlace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Город рождения (необязательно)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Город"
                                  {...field}
                                  className="bg-card-bg"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  </TabsContent>
                </Tabs>

                <Button 
                  className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all rounded-xl font-connie text-lg"
                  onClick={buildChart}
                  disabled={natalChartMutation.isPending}
                >
                  {natalChartMutation.isPending ? "Строим карту звёзд..." : "Построить натальную карту"}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                // ✅ ДОЛЖНО БЫТЬ:
                {(() => {
                  console.log("🌌 Rendering NatalChartWheel with:", chartResult);
                  console.log("🌌 svgFileName prop:", chartResult.svgFileName);
                  return (
                    <NatalChartWheel 
                      chartData={chartResult.chartData} 
                      analysis={chartResult.analysis}
                      svgFileName={chartResult.svgFileName}
                    />
                  );
                })()}

                <Button 
                  className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all rounded-xl font-connie"
                  onClick={() => setChartResult(null)}
                >
                  Создать новую карту
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}