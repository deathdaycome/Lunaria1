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

const natalChartSchema = z.object({
  name: z.string().min(1, "Введите имя"),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }),
  birthTime: z.date().optional(),
  birthPlace: z.string().optional(),
});

type NatalChartFormValues = z.infer<typeof natalChartSchema>;

export default function NatalChart() {
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

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent 
          className="card border-accent/20 max-w-md"
          aria-describedby="natal-chart-description"
        >
          <DialogHeader>
            <DialogTitle>Натальная карта</DialogTitle>
          </DialogHeader>
          <div id="natal-chart-description" className="sr-only">
            Создайте натальную карту, указав данные рождения
          </div>

          {!chartResult ? (
            <div className="space-y-4">
              <Tabs defaultValue="self" value={chartType} onValueChange={(val) => setChartType(val as "self" | "other")}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="self">Для себя</TabsTrigger>
                  <TabsTrigger value="other">Для другого человека</TabsTrigger>
                </TabsList>

                <TabsContent value="self">
                  <p className="text-sm text-gray-300 mb-4">
                    Будет использована информация из вашего профиля:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Имя:</span>
                      <span>{user?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Дата рождения:</span>
                      <span>{new Date(user?.birthDate || "").toLocaleDateString()}</span>
                    </div>
                    {user?.birthTime && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Время рождения:</span>
                        <span>{user.birthTime}</span>
                      </div>
                    )}
                    {user?.birthPlace && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Место рождения:</span>
                        <span>{user.birthPlace}</span>
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
                className="w-full py-6 bg-primary hover:bg-accent transition-all rounded-lg"
                onClick={buildChart}
                disabled={natalChartMutation.isPending}
              >
                {natalChartMutation.isPending ? "Построение..." : "Построить натальную карту"}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mb-4 flex justify-center">
                {/* Simplified natal chart visualization */}
                <div className="w-64 h-64 rounded-full border-2 border-accent relative">
                  <div className="absolute inset-2 rounded-full border border-gray-600"></div>
                  <div className="absolute inset-8 rounded-full border border-gray-600"></div>
                  <div className="absolute inset-14 rounded-full border border-gray-600"></div>
                  
                  {/* Zodiac symbols positioned around the circle */}
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-lg">♈</div>
                  <div className="absolute top-1/4 right-6 text-lg">♉</div>
                  <div className="absolute top-1/2 right-2 text-lg">♊</div>
                  <div className="absolute bottom-1/4 right-6 text-lg">♋</div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-lg">♌</div>
                  <div className="absolute bottom-1/4 left-6 text-lg">♍</div>
                  <div className="absolute top-1/2 left-2 text-lg">♎</div>
                  <div className="absolute top-1/4 left-6 text-lg">♏</div>
                  
                  {/* Planet positions */}
                  <div className="absolute top-1/3 right-1/3 text-yellow-400 text-lg">☉</div>
                  <div className="absolute bottom-1/3 left-1/3 text-blue-400 text-lg">☽</div>
                  <div className="absolute top-1/4 left-1/4 text-red-400 text-lg">♂</div>
                  <div className="absolute bottom-1/4 right-1/4 text-green-400 text-lg">♀</div>
                </div>
              </div>

              <Card className="bg-card-bg-light p-4 text-sm">
                <h4 className="font-medium mb-2">Анализ натальной карты</h4>
                <div className="space-y-2">
                  <p className="whitespace-pre-line">{chartResult.analysis}</p>
                </div>
              </Card>

              <Button 
                className="w-full py-6 bg-primary hover:bg-accent transition-all rounded-lg"
                onClick={() => setChartResult(null)}
              >
                Изменить данные
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
