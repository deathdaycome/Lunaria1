import React from 'react';

type DecorationPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

const moonPhaseSymbols = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
const astrologySymbols = ['☿', '♀', '♁', '♂', '♃', '♄', '♅', '♆', '♇'];

interface DecorativeSymbolsProps {
  type?: 'moon' | 'astrology';
  lowPerformance?: boolean;
  enabled?: boolean;
}

export default function DecorativeSymbols({ 
  type = 'moon', 
  lowPerformance = false,
  enabled = true 
}: DecorativeSymbolsProps) {
  
  if (!enabled) {
    return null;
  }
  
  const symbols = type === 'moon' ? moonPhaseSymbols : astrologySymbols;
  
  const getRandomSymbols = () => {
    const shuffled = [...symbols].sort(() => 0.5 - Math.random());
    // Для слабых устройств показываем только 2 символа вместо 4
    return shuffled.slice(0, lowPerformance ? 2 : 4);
  };
  
  const randomSymbols = getRandomSymbols();
  const positions: DecorationPosition[] = lowPerformance 
    ? ['top-left', 'bottom-right'] // Только 2 позиции
    : ['top-left', 'top-right', 'bottom-left', 'bottom-right'];
  
  return (
    <>
      {positions.map((position, index) => (
        <div 
          key={position} 
          className={`decorative-symbol ${position} ${lowPerformance ? 'no-animation' : ''}`}
        >
          <span 
            style={{ color: getSymbolColor(type, index) }} 
            className={lowPerformance ? "text-lg" : "text-xl"}
          >
            {randomSymbols[index]}
          </span>
        </div>
      ))}
    </>
  );
}

function getSymbolColor(type: 'moon' | 'astrology', index: number): string {
  if (type === 'moon') {
    const moonColors = ['#C0C0C0', '#D8D8D8'];
    return moonColors[index % moonColors.length];
  } else {
    const astrologyColors = ['#FFD700', '#9B59B6'];
    return astrologyColors[index % astrologyColors.length];
  }
}