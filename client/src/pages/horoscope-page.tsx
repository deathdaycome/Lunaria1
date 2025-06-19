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
        <div className="space-y-6 mb-20" style={{ paddingTop: 'max(20px, env(safe-area-inset-top, 20px))' }}>
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
        <div className="space-y-6 mb-20" style={{ paddingTop: 'max(20px, env(safe-area-inset-top, 20px))' }}>
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
      <div className="space-y-6 mb-20" style={{ paddingTop: 'max(60px, env(safe-area-inset-top, 60px))' }}>
        {/* Заголовок страницы */}
        <div className="px-4 mb-4">
          <h2 className="page-heading font-gilroy text-center">
            {userProfile.name}, ваш гороскоп
          </h2>
        </div>

        <HoroscopeCard 
          ref={horoscopeCardRef}
          period={period}
          setPeriod={setPeriod}
          zodiacSign={getZodiacSign(new Date(userProfile.birthDate)).name}
          userId={userProfile.id}
          userName={userProfile.name}
          userBirthDate={userProfile.birthDate}
          subscriptionType={userProfile.subscriptionType}
        />

        {userProfile?.id && (
          <FriendsSection />
        )}
      </div>

      {/* ✅ ИСПРАВЛЕНИЕ: Центрирование модальных окон и правильное позиционирование SelectContent */}
      <style jsx global>{`
        /* Защита для SelectContent от перекрытия Telegram с правильным позиционированием */
        [data-radix-select-content] {
          z-index: 99999 !important;
          background-color: #2a1d51 !important;
          border: 1px solid #583e8b !important;
          position: absolute !important;
          transform-origin: var(--radix-select-content-transform-origin);
        }
        
        [data-radix-select-viewport] {
          z-index: 99999 !important;
        }
        
        /* Центрирование всех модальных окон */
        [data-radix-dialog-content] {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          max-height: 85vh !important;
          z-index: 99999 !important;
        }
        
        /* Центрирование Dialog overlay */
        [data-radix-dialog-overlay] {
          position: fixed !important;
          inset: 0 !important;
          z-index: 99998 !important;
        }
        
        /* Обеспечиваем работу в safe area */
        @supports (padding-top: env(safe-area-inset-top)) {
          .telegram-safe-area {
            padding-top: max(20px, env(safe-area-inset-top, 20px));
          }
        }
      `}</style>
    </MainLayout>
  );
}