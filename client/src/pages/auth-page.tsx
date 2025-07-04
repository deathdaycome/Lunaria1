import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/shared/date-picker";
import { TimePicker } from "@/components/shared/time-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import StarBackground from "@/components/shared/star-background";
import ZodiacCreaturesCorners from "@/components/shared/zodiac-creatures-corners";
import LunariaAvatar from "@/components/shared/lunaria-avatar";
import React, { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getZodiacSign } from "@/lib/zodiac";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { formatDateForDB } from "../../../dateUtils";

// Упрощенная схема регистрации без username и password + новое поле birthCountry
const registerSchema = z.object({
  name: z.string().min(1, "Введите ваше имя"),
  gender: z.enum(["male", "female"], {
    required_error: "Выберите пол",
  }),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }),
  birthTime: z.date().optional(),
  birthCountry: z.string().min(1, "Введите страну рождения"), // ✨ НОВОЕ ПОЛЕ
  birthPlace: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();

  // Установка темного фона для всей страницы
  useEffect(() => {
    // Сохраним старый стиль, чтобы восстановить при уходе
    const originalBackground = document.body.style.background;
    
    // Устанавливаем темный фон
    document.body.style.background = "linear-gradient(to bottom, #1a1a2e, #16213e)";
    
    // Очистка при размонтировании
    return () => {
      document.body.style.background = originalBackground;
    };
  }, []);

  // Форма регистрации
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      gender: "male",
      birthCountry: "Россия", // ✨ ЗНАЧЕНИЕ ПО УМОЛЧАНИЮ
      birthPlace: "",
    },
  });

  const { registerMutation } = useAuth();
  const { toast } = useToast();

  // Флаг для предотвращения множественных отправок формы
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: RegisterFormValues) => {
    console.log("onSubmit вызвана, данные:", data);
    
    // Предотвращаем повторные отправки
    if (isSubmitting) {
      console.log("Форма уже отправляется, предотвращаем повторную отправку");
      return;
    }
    
    setIsSubmitting(true);
    console.log("User data:", data);
    
    try {
      // Генерируем случайное имя пользователя и пароль
      const username = `user_${Math.random().toString(36).substring(2, 10)}`;
      const password = Math.random().toString(36).substring(2, 15);

      // Регистрируем пользователя через мутацию
      const formData = {
        username,
        password,
        name: data.name,
        gender: data.gender,
        birthDate: formatDateForDB(data.birthDate),
        birthTime: data.birthTime ? 
          data.birthTime.toTimeString().split(' ')[0] : 
          null,
        birthCountry: data.birthCountry, // ✨ НОВОЕ ПОЛЕ
        birthPlace: data.birthPlace || "",
        zodiacSign: getZodiacSign(data.birthDate).name
      };
      
      console.log("Регистрируем пользователя:", formData);
      console.log("registerMutation:", registerMutation);
      
      if (!registerMutation || !registerMutation.mutate) {
        console.error("registerMutation не определен или не имеет метод mutate");
        setIsSubmitting(false);
        toast({
          title: "Ошибка",
          description: "Проблема с инициализацией. Попробуйте перезагрузить страницу.",
          variant: "destructive"
        });
        return;
      }
      
      // Регистрация с использованием мутации
      await new Promise((resolve, reject) => {
        registerMutation.mutate(formData, {
          onSuccess: async (userData) => {
            console.log("Регистрация успешна, получены данные:", userData);
            
            try {
              // Обновляем кэш пользователя
              queryClient.setQueryData(["/api/user"], userData);
              console.log("Пользователь сохранен в кэш:", userData);
              
              // Показываем успешное уведомление
              toast({
                title: "Успешная регистрация",
                description: `${data.name}, ваш профиль был создан. Добро пожаловать в Lunaria AI!`,
                variant: "default"
              });
              
              // Инвалидируем запрос пользователя, чтобы AuthProvider обновился
              await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
              console.log("Кэш инвалидирован, запускается обновление состояния");
              
              // Небольшая задержка для синхронизации состояния
              setTimeout(() => {
                console.log("Выполняем переход на /horoscope");
                navigate("/horoscope");
              }, 500);
              
              resolve(userData);
            } catch (error) {
              console.error("Ошибка после успешной регистрации:", error);
              // Если инвалидация не сработала, пробуем прямое перенаправление
              setTimeout(() => {
                console.log("Попытка прямого перенаправления");
                window.location.href = "/horoscope";
              }, 1000);
              resolve(userData);
            }
          },
          onError: (error) => {
            console.error("Ошибка регистрации:", error);
            setIsSubmitting(false);
            toast({
              title: "Ошибка регистрации",
              description: "Не удалось создать профиль. Попробуйте еще раз.",
              variant: "destructive"
            });
            reject(error);
          }
        });
      });
      
    } catch (error) {
      console.error("Ошибка в onSubmit:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      <StarBackground />
      
      {/* Отцентрированные звезды с меньшим смещением */}
      <div className="absolute inset-0" style={{ padding: "50px" }}>
        <ZodiacCreaturesCorners />
      </div>
      
      <Card className="w-full max-w-md border-[#6366f1]/30 bg-[#252240]/90 backdrop-blur-md rounded-xl relative z-10 shadow-xl">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-connie font-bold title-glow text-gold-gradient mb-3">Lunaria AI</h1>
            <LunariaAvatar />
            <div className="bg-[rgba(155,89,182,0.15)] backdrop-blur-sm p-4 rounded-lg border border-[rgba(255,255,255,0.1)] mb-4 mx-auto max-w-md">
              <p className="text-gray-100 font-cormorant italic text-lg leading-relaxed">
                "Привет! Меня зовут Лунария. Я буду твоим проводником в мир астрологии. Чтобы я немного больше о тебе узнала, заполни данные ниже."
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cormorant text-white text-base font-medium">Имя</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ваше имя" 
                        {...field} 
                        className="border-[var(--border)] bg-[var(--background-secondary)] bg-opacity-50 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      />
                    </FormControl>
                    <FormMessage className="font-cormorant" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="mt-1 mb-3">
                    <FormLabel className="font-cormorant text-white text-base font-medium mb-2 block">Пол</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="grid grid-cols-2 gap-4 w-full"
                      >
                        <div className="relative">
                          <RadioGroupItem
                            value="male"
                            id="male"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="male"
                            className={`font-cormorant flex flex-col items-center justify-center p-4 h-full rounded-xl text-center border-2 cursor-pointer transition-all duration-200 ${
                              field.value === 'male' 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg' 
                                : 'border-gray-600 bg-gray-800 bg-opacity-50 text-white hover:bg-purple-600 hover:bg-opacity-30 hover:border-purple-500'
                            }`}
                          >
                            <span className="text-2xl mb-1">♂</span>
                            <span className="font-medium">Мужчина</span>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem
                            value="female"
                            id="female"
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor="female"
                            className={`font-cormorant flex flex-col items-center justify-center p-4 h-full rounded-xl text-center border-2 cursor-pointer transition-all duration-200 ${
                              field.value === 'female' 
                                ? 'bg-purple-600 text-white border-purple-600 shadow-lg' 
                                : 'border-gray-600 bg-gray-800 bg-opacity-50 text-white hover:bg-purple-600 hover:bg-opacity-30 hover:border-purple-500'
                            }`}
                          >
                            <span className="text-2xl mb-1">♀</span>
                            <span className="font-medium">Женщина</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage className="font-cormorant" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cormorant text-white text-base font-medium">Дата рождения</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value}
                        setDate={field.onChange}
                      />
                    </FormControl>
                    <FormMessage className="font-cormorant" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cormorant text-white text-base font-medium">Время рождения (необязательно)</FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <p className="text-xs text-white/60 mt-1 font-cormorant">
                      Более точные предсказания со временем рождения
                    </p>
                  </FormItem>
                )}
              />

              {/* ✨ НОВОЕ ПОЛЕ - Страна рождения */}
              <FormField
                control={form.control}
                name="birthCountry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cormorant text-white text-base font-medium">Страна рождения</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Страна рождения"
                        {...field}
                        className="border-[var(--border)] bg-[var(--background-secondary)] bg-opacity-50 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      />
                    </FormControl>
                    <FormMessage className="font-cormorant" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cormorant text-white text-base font-medium">Город рождения (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Город рождения"
                        {...field}
                        className="border-[var(--border)] bg-[var(--background-secondary)] bg-opacity-50 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={isSubmitting}
                name="submit-button"
                onClick={(e) => {
                  e.preventDefault();
                  form.handleSubmit(onSubmit)();
                }}
                className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all rounded-full shadow-[0_0_15px_var(--primary-opacity)] font-connie text-white mt-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Создаем профиль..." : "Начать путешествие с Лунарией"}
              </Button>
            </form>
          </Form>

          <p className="text-xs text-white/60 mt-4 text-center font-cormorant">
            Продолжая, вы соглашаетесь с нашими Условиями использования и Политикой конфиденциальности
          </p>

          {/* Временная кнопка для тестирования в режиме разработки */}
          {(window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') && (
            <div className="mt-4 text-center">
              <button 
                onClick={() => navigate("/horoscope")} 
                className="text-sm text-white/80 underline"
              >
                Тестовый вход (только для разработки)
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}