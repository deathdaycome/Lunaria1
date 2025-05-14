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
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getZodiacSign } from "@/lib/zodiac";
import { useToast } from "@/hooks/use-toast";

// Упрощенная схема регистрации без username и password
const registerSchema = z.object({
  name: z.string().min(1, "Введите ваше имя"),
  gender: z.enum(["male", "female"], {
    required_error: "Выберите пол",
  }),
  birthDate: z.date({
    required_error: "Введите дату рождения",
  }),
  birthTime: z.date().optional(),
  birthPlace: z.string().optional(),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() { // переписал ИП, 13.05.2025
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
      birthPlace: "",
    },
  });

  const { registerMutation } = useAuth();
  const { toast } = useToast();

  const onSubmit = (data: RegisterFormValues) => {
    console.log("User data:", data);
    
    // Генерируем случайное имя пользователя и пароль
    const username = `user_${Math.random().toString(36).substring(2, 10)}`;
    const password = Math.random().toString(36).substring(2, 15);

    // Регистрируем пользователя через мутацию
    const formData = {
      username,
      password,
      name: data.name,
      gender: data.gender,
      birthDate: data.birthDate.toISOString().split('T')[0], // формат YYYY-MM-DD для date в БД
      birthTime: data.birthTime ? 
        data.birthTime.toTimeString().split(' ')[0] : // формат HH:MM:SS для time в БД
        null,
      birthPlace: data.birthPlace || "",
      // Определяем знак зодиака на основе даты рождения
      zodiacSign: getZodiacSign(data.birthDate).name
    };
    
    console.log("Регистрируем пользователя:", formData);
    registerMutation.mutate(formData, {
      onSuccess: () => {
        // Оповещаем пользователя об успешной регистрации
        toast({
          title: "Успешная регистрация",
          description: `${data.name}, ваш профиль был создан. Добро пожаловать в Lunaria AI!`,
          variant: "default"
        });
        
        // После регистрации редирект на страницу гороскопов
        setTimeout(() => {
          navigate("/horoscope");
        }, 1500); // небольшая задержка, чтобы пользователь успел увидеть сообщение
      }
    });
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
                        defaultValue={field.value}
                        className="grid grid-cols-2 gap-4 w-full"
                      >
                        <div className="relative">
                          <RadioGroupItem
                            value="male"
                            id="male"
                            className="peer absolute invisible"
                          />
                          <Label
                            htmlFor="male"
                            className="font-cormorant flex flex-col items-center justify-center p-4 h-full rounded-xl text-center border-2 border-[var(--border)] bg-[var(--background-secondary)] bg-opacity-50 text-[var(--foreground)] peer-data-[state=checked]:bg-[var(--primary)] peer-data-[state=checked]:text-white peer-data-[state=checked]:border-[var(--primary)] cursor-pointer transition-all hover:bg-[var(--primary-hover)] hover:bg-opacity-20"
                          >
                            <span className="text-2xl mb-1">♂</span>
                            <span className="font-medium">Мужчина</span>
                          </Label>
                        </div>
                        <div className="relative">
                          <RadioGroupItem
                            value="female"
                            id="female"
                            className="peer absolute invisible"
                          />
                          <Label
                            htmlFor="female"
                            className="font-cormorant flex flex-col items-center justify-center p-4 h-full rounded-xl text-center border-2 border-[var(--border)] bg-[var(--background-secondary)] bg-opacity-50 text-[var(--foreground)] peer-data-[state=checked]:bg-[var(--primary)] peer-data-[state=checked]:text-white peer-data-[state=checked]:border-[var(--primary)] cursor-pointer transition-all hover:bg-[var(--primary-hover)] hover:bg-opacity-20"
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

              <FormField
                control={form.control}
                name="birthPlace"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-cormorant text-white text-base font-medium">Место рождения (необязательно)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Город, Страна"
                        {...field}
                        className="border-[var(--border)] bg-[var(--background-secondary)] bg-opacity-50 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)]"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-all rounded-full shadow-[0_0_15px_var(--primary-opacity)] font-connie text-white mt-6 text-lg"
              >
                Начать путешествие с Лунарией
              </Button>
            </form>
          </Form>

          <p className="text-xs text-white/60 mt-4 text-center font-cormorant">
            Продолжая, вы соглашаетесь с нашими Условиями использования и Политикой конфиденциальности
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
