import React from 'react';
import { motion } from 'framer-motion';

interface CosmicLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
}

export default function CosmicLoader({ size = 'medium', text = 'Загрузка...', fullScreen = false }: CosmicLoaderProps) {
  const getSizeInPixels = () => {
    switch (size) {
      case 'small':
        return 48;
      case 'large':
        return 120;
      case 'medium':
      default:
        return 80;
    }
  };

  const sizeInPx = getSizeInPixels();
  const starSize = sizeInPx * 0.7;
  const orbitSize = sizeInPx * 0.9;
  const planetSize = sizeInPx * 0.2;

  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-[var(--background-primary)]/80 backdrop-blur-sm' : ''}`}>
      <div className="relative" style={{ width: sizeInPx, height: sizeInPx }}>
        {/* Основная центральная звезда */}
        <motion.div
          className="absolute"
          style={{
            width: starSize,
            height: starSize,
            top: '50%',
            left: '50%',
            marginLeft: -starSize / 2,
            marginTop: -starSize / 2,
            background: 'radial-gradient(circle, #FFD700 10%, #FFA500 40%, rgba(255, 165, 0, 0) 70%)',
            borderRadius: '50%',
            boxShadow: '0 0 30px #FFA500, 0 0 20px #FFD700 inset',
          }}
          animate={{ 
            boxShadow: [
              '0 0 20px #FFA500, 0 0 10px #FFD700 inset', 
              '0 0 30px #FFA500, 0 0 20px #FFD700 inset', 
              '0 0 20px #FFA500, 0 0 10px #FFD700 inset'
            ],
            scale: [1, 1.1, 1]
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        {/* Лучи звезды */}
        {[...Array(8)].map((_, index) => {
          const angle = (index * 45); // 8 лучей равномерно
          const rayLength = starSize * 0.5;
          const width = 2;
          
          return (
            <motion.div
              key={index}
              className="absolute"
              style={{
                width: `${width}px`,
                height: `${rayLength}px`,
                background: 'linear-gradient(to top, rgba(255, 215, 0, 0), rgba(255, 215, 0, 0.8))',
                top: '50%',
                left: '50%',
                marginLeft: -width / 2,
                transformOrigin: 'bottom center',
                transform: `rotate(${angle}deg) translateY(-${starSize/2}px)`,
              }}
              animate={{ 
                height: [rayLength * 0.8, rayLength, rayLength * 0.8],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 1.5,
                delay: index * 0.1,
                ease: "easeInOut" 
              }}
            />
          );
        })}

        {/* Орбита */}
        <motion.div 
          className="absolute rounded-full border-2 border-dashed border-[#8a2be2]/40"
          style={{
            width: orbitSize,
            height: orbitSize,
            top: '50%',
            left: '50%',
            marginLeft: -orbitSize / 2,
            marginTop: -orbitSize / 2,
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        />

        {/* Планета на орбите */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: planetSize,
            height: planetSize,
            background: 'radial-gradient(circle, #8a2be2 40%, #4b0082 100%)',
            boxShadow: '0 0 10px #8a2be2',
          }}
          initial={{ 
            top: `calc(50% - ${planetSize / 2}px)`,
            left: `calc(50% + ${orbitSize / 2 - planetSize / 2}px)`,
          }}
          animate={{ 
            top: [`calc(50% - ${planetSize / 2}px)`, `calc(50% - ${planetSize / 2}px)`],
            left: [`calc(50% + ${orbitSize / 2 - planetSize / 2}px)`, `calc(50% + ${orbitSize / 2 - planetSize / 2}px)`],
            rotate: [0, 360],
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 10, ease: "linear" },
            top: { repeat: 0 },
            left: { repeat: 0 }
          }}
        />
      </div>
      
      {text && (
        <motion.div 
          className="mt-3 text-white/90 font-cormorant"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}