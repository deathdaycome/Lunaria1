import { useState, useEffect, useRef } from "react";
import MainLayout from "@/components/layout/main-layout";
import HoroscopeCard from "@/components/horoscope/horoscope-card";
import FriendsSection from "@/components/horoscope/friends-section";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { getZodiacSign } from "@/lib/zodiac";
import CosmicLoader from "@/components/shared/cosmic-loader";
import { useAuth } from "@/hooks/use-auth";

type HoroscopePeriod = "today" | "week" | "month";

type UserProfileData = {
  id: number;
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  zodiacSign: string;
  subscriptionType: string;
};

export default function HoroscopePage() {
  const [, navigate] = useLocation();
  const [period, setPeriod] = useState<HoroscopePeriod>("today");
  
  // Реф для доступа к функции обновления из HoroscopeCard
  const horoscopeCardRef = useRef<{ handleRefresh: () => void } | null>(null);
  
  // Используем хук аутентификации для получения данных пользователя
  const { user, isLoading: authLoading } = useAuth();

  // Запрос данных пользователя из БД
  const { data: userProfile, isLoading, error } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error("Пользователь не авторизован");
      }
      return response.json() as Promise<UserProfileData>;
    },
    enabled: !authLoading, // Запускаем запрос только после проверки аутентификации
    retry: 1,
  });

  // Редирект на страницу регистрации если пользователь не авторизован
  useEffect(() => {
    if (!authLoading && !user && error) {
      console.log("Пользователь не авторизован, перенаправляем на регистрацию");
      navigate("/");
    }
  }, [authLoading, user, error, navigate]);

  // ИСПРАВЛЕННАЯ функция для обновления данных о гороскопе
  const handleRefresh = () => {
    console.log("🔥 MainLayout refresh clicked - вызываем реальное обновление гороскопа");
    
    // Вызываем функцию обновления из HoroscopeCard
    if (horoscopeCardRef.current && horoscopeCardRef.current.handleRefresh) {
      horoscopeCardRef.current.handleRefresh();
    } else {
      console.warn("⚠️ horoscopeCardRef.current.handleRefresh не доступен");
    }
  };

  // Показываем загрузку пока получаем данные
  if (authLoading || isLoading) {
    return (
      <MainLayout 
        title="Гороскоп" 
        activeTab="horoscope"
        showRefresh={false}
        showHeader={false}
      >
        <div className="space-y-6 mb-20">
          <div className="card p-8 flex flex-col items-center justify-center min-h-[300px]">
            <CosmicLoader size="medium" text="Загружаем ваш профиль..." />
          </div>
        </div>
      </MainLayout>
    );
  }

  // Показываем ошибку если не удалось загрузить профиль
  if (error || !userProfile) {
    return (
      <MainLayout 
        title="Гороскоп" 
        activeTab="horoscope"
        showRefresh={false}
        showHeader={false}
      >
        <div className="space-y-6 mb-20">
          <div className="card p-8 flex flex-col items-center justify-center min-h-[300px]">
            <p className="text-white text-center">
              Не удалось загрузить профиль пользователя. 
              <br />
              <button 
                onClick={() => navigate("/")} 
                className="text-primary underline mt-2"
              >
                Перейти к регистрации
              </button>
            </p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="Гороскоп" 
      activeTab="horoscope"
      showRefresh={true}
      onRefresh={handleRefresh}
      showHeader={false}
    >
      <div className="space-y-6 mb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="page-heading font-gilroy">
            {userProfile.name}, ваш гороскоп
          </h2>
          <Select
            value={period}
            onValueChange={(value) => setPeriod(value as HoroscopePeriod)}
          >
            <SelectTrigger className="w-[110px] glass-effect border-accent/20 font-gilroy text-white">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent className="bg-[#2a1d51] border-[#583e8b]">
              <SelectItem value="today" className="font-gilroy text-white">Сегодня</SelectItem>
              <SelectItem value="week" className="font-gilroy text-white">Неделя</SelectItem>
              <SelectItem value="month" className="font-gilroy text-white">Месяц</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <HoroscopeCard 
          ref={horoscopeCardRef}
          period={period}
          zodiacSign={getZodiacSign(new Date(userProfile.birthDate)).name}
          userId={userProfile.id}
          userName={userProfile.name}
          userBirthDate={userProfile.birthDate}
          subscriptionType={userProfile.subscriptionType}
        />

        <FriendsSection userId={userProfile.id} />
      </div>
    </MainLayout>
  );
}