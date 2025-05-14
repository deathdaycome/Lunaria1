import { useEffect, useRef } from "react";

type ZodiacSymbolProps = {
  symbol: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  color?: string;
  size?: number;
};

export default function ZodiacSymbol({ 
  symbol, 
  position, 
  color = 'rgba(177, 151, 252, 0.7)', 
  size = 60 
}: ZodiacSymbolProps) {
  const symbolRef = useRef<HTMLDivElement>(null);
  
  // Определяем классы позиционирования на основе props
  const positionClasses = {
    'top-left': 'top-8 left-8',
    'top-right': 'top-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'bottom-right': 'bottom-8 right-8',
  };
  
  // Случайное смещение для каждого символа
  const offset = {
    x: Math.random() * 20 - 10, // -10px до +10px
    y: Math.random() * 20 - 10, // -10px до +10px
    delay: Math.random() * 2,   // 0s до 2s
    duration: 5 + Math.random() * 3 // 5s до 8s
  };
  
  // Плавное появление символа
  useEffect(() => {
    if (!symbolRef.current) return;
    
    // Добавляем небольшую задержку для каждого символа
    const timer = setTimeout(() => {
      if (symbolRef.current) {
        symbolRef.current.style.opacity = '1';
      }
    }, 100 + Math.random() * 500); // Случайная задержка 100-600ms
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div 
      ref={symbolRef}
      className={`fixed ${positionClasses[position]} z-10 pointer-events-none opacity-0 transition-opacity duration-1000 zodiac-symbol`}
      style={{
        color,
        fontSize: `${size}px`,
        textShadow: `0 0 10px ${color}, 0 0 20px ${color.replace(')', ', 0.5)')}`,
        transform: `translate(${offset.x}px, ${offset.y}px)`,
        animationDelay: `${offset.delay}s`,
        animationDuration: `${offset.duration}s`
      }}
    >
      {symbol}
    </div>
  );
}