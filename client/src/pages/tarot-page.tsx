import { useState } from "react";
import MainLayout from "@/components/layout/main-layout";
import CardReading from "@/components/tarot/card-reading";
import NatalChart from "@/components/tarot/natal-chart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

export default function TarotPage() {
  const { user } = useAuth();
  const [cardType, setCardType] = useState<string>("tarot");
  const [readingType, setReadingType] = useState<string>("three-cards");
  const [showReading, setShowReading] = useState<boolean>(false);

  const startReading = () => {
    setShowReading(true);
  };

  return (
    <MainLayout title="Карты" activeTab="tarot">
      <div className="space-y-6 mb-20 px-4">
        <h2 className="page-heading font-gilroy">Расклад карт</h2>

        {!showReading ? (
          <>
            <Tabs defaultValue="tarot" value={cardType} onValueChange={setCardType}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="tarot">Таро</TabsTrigger>
                <TabsTrigger value="lenormand" disabled={user?.subscriptionType === "free"}>
                  Ленорман
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-4">
              <p className="text-[var(--foreground-secondary)] font-cormorant text-lg">Выберите тип расклада для гадания</p>

              <Select
                value={readingType}
                onValueChange={setReadingType}
              >
                <SelectTrigger className="w-full bg-[var(--card-background)] border-[var(--border)] rounded-xl">
                  <SelectValue placeholder="Выберите тип расклада" />
                </SelectTrigger>
                <SelectContent className="w-full max-w-[300px] bg-[var(--background-secondary)] border-[var(--border)]">
                  <SelectItem value="three-cards" className="hover:bg-[var(--background-tertiary)] focus:bg-[var(--background-tertiary)]">
                    Расклад из трех карт
                  </SelectItem>
                  <SelectItem value="five-cards" disabled={user?.subscriptionType === "free"} className="hover:bg-[var(--background-tertiary)] focus:bg-[var(--background-tertiary)]">
                    Расклад из пяти карт
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button 
                onClick={startReading}
                className="w-full py-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-connie rounded-xl transition-all shadow-[0_0_15px_var(--primary-opacity)]"
              >
                Начать расклад
              </Button>

              {user?.subscriptionType === "free" && (
                <Card className="bg-[var(--background-secondary)]/80 backdrop-blur-sm border-[var(--border)] rounded-xl">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm mb-3 font-cormorant text-[var(--foreground-secondary)]">
                      Улучшите для доступа к более сложным раскладам и детальным толкованиям
                    </p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-connie"
                    >
                      Улучшить вашу подписку
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        ) : (
          <CardReading 
            type={cardType} 
            readingType={readingType}
            onBack={() => setShowReading(false)}
          />
        )}

        <NatalChart />
      </div>
    </MainLayout>
  );
}
