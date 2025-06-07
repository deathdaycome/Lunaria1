import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
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
import NatalChartWheel from "@/components/natal-chart/natal-chart-wheel";

const natalChartSchema = z.object({
  name: z.string().min(1, "Введите имя"),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }),
  birthTime: z.date().optional(),
  birthPlace: z.string().optional(),
});

type NatalChartFormValues = z.infer<typeof natalChartSchema>;

export default function NatalChartPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [chartType, setChartType] = useState<"self" | "other">("self");
  const [chartResult, setChartResult] = useState<any>(null);

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
      return await res.json();
    },
    onSuccess: (data) => {
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

  return (
    <MainLayout title="Натальная карта" activeTab="natal-chart">
      <div className="space-y-6 mb-20 px-4">
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
                <Tabs defaultValue="self" value={chartType} onValueChange={(val) => setChartType(val as "self" | "other")}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="self">Для себя</TabsTrigger>
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

                        <FormField
                          control={form.control}
                          name="birthPlace"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Место рождения (необязательно)</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Город, Страна"
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
                <NatalChartWheel 
                  chartData={chartResult.chartData} 
                  analysis={chartResult.analysis} 
                />

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