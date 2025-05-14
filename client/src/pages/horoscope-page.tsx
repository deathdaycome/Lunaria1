import { useState, useEffect } from "react";
import MainLayout from "@/components/layout/main-layout";
import HoroscopeCard from "@/components/horoscope/horoscope-card";
import FriendsSection from "@/components/horoscope/friends-section";
import CompatibilityTest from "@/components/horoscope/compatibility-test";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";
import { getZodiacSign } from "@/lib/zodiac";
import CosmicLoader from "@/components/shared/cosmic-loader";

type HoroscopePeriod = "today" | "week" | "month";

type UserProfileData = {
  name: string;
  gender: "male" | "female";
  birthDate: string;
  birthTime?: string;
  birthPlace?: string;
  zodiacSign?: string;
};

export default function HoroscopePage() {
  const [, navigate] = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [period, setPeriod] = useState<HoroscopePeriod>("today");
  const [isLoading, setIsLoading] = useState(true);
  
  // Получение данных пользователя из localStorage при загрузке компонента
  useEffect(() => {
    const storedProfile = localStorage.getItem('userProfile');
    
    if (storedProfile) {
      try {
        const profile = JSON.parse(storedProfile);
        
        // Получение знака зодиака на основе даты рождения
        if (profile.birthDate) {
          const birthDate = new Date(profile.birthDate);
          const zodiacInfo = getZodiacSign(birthDate);
          profile.zodiacSign = zodiacInfo.englishName; // Используем английское название
        }
        
        setUserProfile(profile);
      } catch (e) {
        console.error("Ошибка при чтении профиля:", e);
      }
    } else {
      // Если профиль отсутствует, перенаправляем на страницу регистрации
      navigate("/");
    }
    
    // Имитация загрузки данных для демонстрации
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, [navigate]);

  // Функция для обновления данных о гороскопе
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <MainLayout 
      title="Гороскоп" 
      activeTab="horoscope"
      showRefresh={true}
      onRefresh={handleRefresh}
    >
      <div className="space-y-6 mb-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="page-heading font-gilroy">
            {userProfile ? `${userProfile.name}, ваш гороскоп` : 'Ваш гороскоп'}
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

        {isLoading ? (
          <div className="card p-8 flex flex-col items-center justify-center min-h-[300px]">
            <CosmicLoader size="medium" text="Звёзды раскрывают ваше предсказание..." />
          </div>
        ) : (
          <HoroscopeCard 
            period={period}
            zodiacSign={userProfile?.zodiacSign || "aries"} // Используем "aries" как знак по умолчанию
          />
        )}

        <FriendsSection />
        <CompatibilityTest />
      </div>
    </MainLayout>
  );
}
