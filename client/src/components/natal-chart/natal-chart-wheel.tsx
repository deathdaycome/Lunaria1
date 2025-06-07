import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Star, Moon, Sun } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import NatalChartText from "@/components/natal-chart/natal-chart-text";

interface NatalChartWheelProps {
  chartData: {
    name: string;
    birthDate: string;
    birthTime: string;
    birthPlace: string;
  };
  analysis: string;
}

// Знаки зодиака с символами и цветами
const zodiacSigns = [
  { name: "Овен", symbol: "♈", color: "#FF6B6B", element: "fire" },
  { name: "Телец", symbol: "♉", color: "#4ECDC4", element: "earth" },
  { name: "Близнецы", symbol: "♊", color: "#45B7D1", element: "air" },
  { name: "Рак", symbol: "♋", color: "#96CEB4", element: "water" },
  { name: "Лев", symbol: "♌", color: "#FFEAA7", element: "fire" },
  { name: "Дева", symbol: "♍", color: "#DDA0DD", element: "earth" },
  { name: "Весы", symbol: "♎", color: "#98D8C8", element: "air" },
  { name: "Скорпион", symbol: "♏", color: "#F7DC6F", element: "water" },
  { name: "Стрелец", symbol: "♐", color: "#BB8FCE", element: "fire" },
  { name: "Козерог", symbol: "♑", color: "#85C1E9", element: "earth" },
  { name: "Водолей", symbol: "♒", color: "#F8C471", element: "air" },
  { name: "Рыбы", symbol: "♓", color: "#82E0AA", element: "water" }
];

// Планеты с символами
const planets = [
  { name: "Солнце", symbol: "☉", color: "#FFD700" },
  { name: "Луна", symbol: "☽", color: "#C0C0C0" },
  { name: "Меркурий", symbol: "☿", color: "#FFA500" },
  { name: "Венера", symbol: "♀", color: "#FF69B4" },
  { name: "Марс", symbol: "♂", color: "#FF4500" },
  { name: "Юпитер", symbol: "♃", color: "#9370DB" },
  { name: "Сатурн", symbol: "♄", color: "#708090" },
  { name: "Уран", symbol: "♅", color: "#00CED1" },
  { name: "Нептун", symbol: "♆", color: "#4169E1" },
  { name: "Плутон", symbol: "♇", color: "#8B0000" }
];

export default function NatalChartWheel({ chartData, analysis }: NatalChartWheelProps) {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [hoveredSign, setHoveredSign] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStep(1);
    }, 500);

    const timer2 = setTimeout(() => {
      setAnimationStep(2);
    }, 1500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, []);

  // Функция для генерации случайных позиций планет
  const generatePlanetPositions = () => {
    return planets.slice(0, 7).map((planet, index) => ({
      ...planet,
      angle: (index * 51.4) + Math.random() * 20 - 10, // Равномерное распределение с небольшой случайностью
      distance: 85 + Math.random() * 15 // Расстояние от центра
    }));
  };

  const [planetPositions] = useState(generatePlanetPositions);

  if (showAnalysis) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Кнопка возврата */}
        <div className="flex justify-between items-center mb-6">
          <Button
            variant="outline"
            onClick={() => setShowAnalysis(false)}
            className="border-purple-500/50 text-purple-300 hover:bg-purple-500/10"
          >
            ← Вернуться к карте
          </Button>
        </div>

        {/* Информация о человеке */}
        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-2">
                {chartData.name}
              </h2>
              <div className="flex justify-center gap-6 text-sm text-white/70">
                <span>📅 {new Date(chartData.birthDate).toLocaleDateString('ru-RU')}</span>
                <span>🕐 {chartData.birthTime}</span>
                <span>📍 {chartData.birthPlace}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Анализ с форматированием */}
        <Card className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 border-purple-500/30">
          <CardContent className="p-8">
            <NatalChartText text={analysis} />
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Информация о рождении */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 mb-4">
          Натальная карта
        </h2>
        <h3 className="text-xl font-bold text-white mb-2">{chartData.name}</h3>
        <div className="flex justify-center gap-6 text-sm text-white/70 mb-6">
          <span>📅 {new Date(chartData.birthDate).toLocaleDateString('ru-RU')}</span>
          <span>🕐 {chartData.birthTime}</span>
          <span>📍 {chartData.birthPlace}</span>
        </div>
      </motion.div>

      {/* Основная карта */}
      <div className="relative flex justify-center">
        <div className="relative w-80 h-80">
          {/* Фоновые эффекты */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(139,69,19,0.1) 0%, rgba(75,0,130,0.2) 50%, rgba(25,25,112,0.3) 100%)",
              filter: "blur(20px)",
            }}
            animate={{
              scale: [1, 1.1, 1],
              rotate: [0, 360],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Внешний круг со знаками зодиака */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            {zodiacSigns.map((sign, index) => {
              const angle = (index * 30) - 90; // -90 для начала с верха
              const radian = (angle * Math.PI) / 180;
              const radius = 140;
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;

              return (
                <motion.div
                  key={sign.name}
                  className="absolute w-12 h-12 flex items-center justify-center rounded-full cursor-pointer transition-all duration-300"
                  style={{
                    left: `calc(50% + ${x}px - 24px)`,
                    top: `calc(50% + ${y}px - 24px)`,
                    backgroundColor: hoveredSign === index ? `${sign.color}40` : `${sign.color}20`,
                    border: `2px solid ${sign.color}`,
                    boxShadow: hoveredSign === index ? `0 0 20px ${sign.color}60` : `0 0 10px ${sign.color}30`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: animationStep >= 1 ? 1 : 0, 
                    opacity: animationStep >= 1 ? 1 : 0 
                  }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.2 }}
                  onHoverStart={() => setHoveredSign(index)}
                  onHoverEnd={() => setHoveredSign(null)}
                >
                  <span 
                    className="text-2xl font-bold"
                    style={{ 
                      color: sign.color,
                      textShadow: `0 0 10px ${sign.color}80`,
                    }}
                  >
                    {sign.symbol}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Внутренний круг с планетами */}
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 0 }}
            animate={{ scale: animationStep >= 2 ? 1 : 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {planetPositions.map((planet, index) => {
              const radian = (planet.angle * Math.PI) / 180;
              const x = Math.cos(radian) * planet.distance;
              const y = Math.sin(radian) * planet.distance;

              return (
                <motion.div
                  key={planet.name}
                  className="absolute w-8 h-8 flex items-center justify-center rounded-full"
                  style={{
                    left: `calc(50% + ${x}px - 16px)`,
                    top: `calc(50% + ${y}px - 16px)`,
                    backgroundColor: `${planet.color}30`,
                    border: `2px solid ${planet.color}`,
                    boxShadow: `0 0 15px ${planet.color}50`,
                  }}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 2 + index * 0.2 }}
                  whileHover={{ scale: 1.3, zIndex: 10 }}
                  title={planet.name}
                >
                  <span 
                    className="text-lg font-bold"
                    style={{ 
                      color: planet.color,
                      textShadow: `0 0 8px ${planet.color}80`,
                    }}
                  >
                    {planet.symbol}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Центральный элемент */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 flex items-center justify-center border-4 border-yellow-300 shadow-lg">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              >
                <Sun className="text-2xl text-white" style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.8))" }} />
              </motion.div>
            </div>
          </motion.div>

          {/* Декоративные звезды */}
          <AnimatePresence>
            {animationStep >= 2 && (
              <>
                {Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                      left: `${20 + Math.random() * 60}%`,
                      top: `${20 + Math.random() * 60}%`,
                    }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0], 
                      scale: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: Math.random() * 2,
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Легенда */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 3 }}
        className="grid grid-cols-2 gap-4 mt-8"
      >
        <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-500/30">
          <CardContent className="p-4">
            <h4 className="text-lg font-bold text-purple-300 mb-3 flex items-center gap-2">
              <Star className="h-5 w-5" />
              Знаки зодиака
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {zodiacSigns.slice(0, 6).map((sign) => (
                <div key={sign.name} className="flex items-center gap-1">
                  <span style={{ color: sign.color }}>{sign.symbol}</span>
                  <span className="text-white/70">{sign.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/30">
          <CardContent className="p-4">
            <h4 className="text-lg font-bold text-blue-300 mb-3 flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Планеты
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {planets.slice(0, 6).map((planet) => (
                <div key={planet.name} className="flex items-center gap-1">
                  <span style={{ color: planet.color }}>{planet.symbol}</span>
                  <span className="text-white/70">{planet.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Кнопка для просмотра анализа */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 3.5 }}
        className="text-center mt-8"
      >
        <Button
          onClick={() => setShowAnalysis(true)}
          className="px-8 py-6 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 hover:from-purple-700 hover:via-blue-700 hover:to-purple-800 text-white font-connie text-lg rounded-xl shadow-[0_0_25px_rgba(168,85,247,0.5)] hover:shadow-[0_0_35px_rgba(168,85,247,0.7)] transition-all duration-300 transform hover:scale-105 border border-purple-400/30"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6" />
            <span>Посмотреть интерпретацию</span>
            <Sparkles className="h-6 w-6" />
          </div>
        </Button>
      </motion.div>
    </motion.div>
  );
}