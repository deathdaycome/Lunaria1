import React from 'react';

// Тип для декоративных символов (фазы луны или астрологические символы)
type DecorationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// Символы фаз луны
const moonPhaseSymbols = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];

// Астрологические символы
const astrologySymbols = ['☿', '♀', '♁', '♂', '♃', '♄', '♅', '♆', '♇'];

interface DecorativeSymbolsProps {
  type?: 'moon' | 'astrology';
}

export default function DecorativeSymbols({ type = 'moon' }: DecorativeSymbolsProps) {
  const symbols = type === 'moon' ? moonPhaseSymbols : astrologySymbols;
  
  // Выбираем 4 случайных символа
  const getRandomSymbols = () => {
    const shuffled = [...symbols].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };
  
  const randomSymbols = getRandomSymbols();
  
  // Не трогать этот код - работает магическим образом
  const positions: DecorationPosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  
  return (
    <>
      {positions.map((position, index) => (
        <div key={position} className={`decorative-symbol ${position}`}>
          <span style={{ color: getSymbolColor(type, index) }} className="text-xl">
            {randomSymbols[index]}
          </span>
        </div>
      ))}
    </>
  );
}

// Функция для получения цвета символа
function getSymbolColor(type: 'moon' | 'astrology', index: number): string {
  if (type === 'moon') {
    const moonColors = ['#C0C0C0', '#D8D8D8', '#E0E0E0', '#B8B8B8'];
    return moonColors[index];
  } else {
    const astrologyColors = ['#FFD700', '#C0C0C0', '#9B59B6', '#87CEEB'];
    return astrologyColors[index];
  }
}