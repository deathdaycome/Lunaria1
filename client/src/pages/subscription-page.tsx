import MainLayout from "@/components/layout/main-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type SubscriptionPlan = {
  id: string;
  name: string;
  price: string;
  features: string[];
  isCurrentPlan: boolean;
  buttonColor: string;
};

export default function SubscriptionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const subscriptionMutation = useMutation({
    mutationFn: async (planType: string) => {
      const res = await apiRequest("POST", "/api/subscription", { planType });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Ваша подписка была обновлена",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const planDetails: SubscriptionPlan[] = [
    {
      id: "free",
      name: "Бесплатно",
      price: "Бесплатно",
      features: [
        "Ежедневный гороскоп (только общее и любовь)",
        "Базовый расклад из 3 карт",
        "Ограниченное количество ежедневных запросов"
      ],
      isCurrentPlan: user?.subscriptionType === "free",
      buttonColor: "bg-[#8a2be2] hover:bg-[#7b26cc]",
    },
    {
      id: "basic",
      name: "Базовый",
      price: "290 руб./мес.",
      features: [
        "Все категории гороскопа",
        "Еженедельные и ежемесячные гороскопы",
        "До 10 раскладов из 3 карт и 5 раскладов из 5 карт",
        "История сохраненных раскладов"
      ],
      isCurrentPlan: user?.subscriptionType === "basic",
      buttonColor: "bg-[#8a2be2] hover:bg-[#7b26cc]",
    },
    {
      id: "premium",
      name: "Премиум",
      price: "590 руб./мес.",
      features: [
        "Все функции базового плана",
        "Безлимитное количество раскладов",
        "Сложные расклады карт",
        "Детальные интерпретации",
        "Приоритетная поддержка"
      ],
      isCurrentPlan: user?.subscriptionType === "premium",
      buttonColor: "bg-[#8a2be2] hover:bg-[#7b26cc]",
    }
  ];

  const selectPlan = (planId: string) => {
    if (planId === user?.subscriptionType) return;
    subscriptionMutation.mutate(planId);
  };

  return (
    <MainLayout title="Подписка" activeTab="subscription">
      <div className="px-4 mb-6">
        <h2 className="text-2xl font-connie mb-4 text-[#ffd700] text-shadow-gold">Подписка</h2>
        <p className="text-white mb-1">Раскройте весь ваш космический потенциал</p>
        <p className="text-sm text-[#e0e0e0]">Выберите план, который соответствует вашему космическому пути</p>
      </div>

      <div className="space-y-5 mb-20 px-4">
        {planDetails.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative overflow-hidden backdrop-blur-sm ${plan.isCurrentPlan ? 'border-2 border-[#ffd700] shadow-md shadow-[#ffd700]/20' : 'border border-[#583e8b]'}`}
          >
            <CardContent className="p-5">
              <div className="text-center mb-4">
                <h3 className="font-medium text-white">{plan.name}</h3>
                <p className="text-2xl font-bold mt-1 text-[#ffd700]">{plan.price}</p>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="h-5 w-5 text-[#ffd700] mr-3 flex-shrink-0" />
                    <span className="text-sm text-white">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full py-6 transition-all rounded-xl ${plan.isCurrentPlan ? 'bg-[#ffd700] text-[#2a1d51]' : `${plan.buttonColor} text-white`}`}
                disabled={plan.isCurrentPlan || subscriptionMutation.isPending}
                onClick={() => selectPlan(plan.id)}
              >
                {plan.isCurrentPlan ? "Текущий план" : "Выбрать план"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
