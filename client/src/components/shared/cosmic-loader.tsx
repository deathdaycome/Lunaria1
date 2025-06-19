import React from 'react';
import { motion } from 'framer-motion';

interface CosmicLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  fullScreen?: boolean;
  lowPerformance?: boolean; // Новый пропс для слабых устройств
}

export default function CosmicLoader({ 
  size = 'medium', 
  text = 'Загрузка...', 
  fullScreen = false,
  lowPerformance = false 
}: CosmicLoaderProps) {
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

  // Простая версия для слабых устройств
  if (lowPerformance) {
    return (
      <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-[var(--background-primary)]/80 backdrop-blur-sm' : ''}`}>
        <div className="relative" style={{ width: sizeInPx, height: sizeInPx }}>
          {/* Простая крутящаяся окружность */}
          <motion.div
            className="absolute border-4 border-transparent border-t-amber-400 rounded-full"
            style={{
              width: sizeInPx * 0.8,
              height: sizeInPx * 0.8,
              top: '50%',
              left: '50%',
              marginLeft: -(sizeInPx * 0.8) / 2,
              marginTop: -(sizeInPx * 0.8) / 2,
            }}
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          />
        </div>
        
        {text && (
          <div className="mt-3 text-white/90 font-cormorant">
            {text}
          </div>
        )}
      </div>
    );
  }

  // Полная версия для мощных устройств (упрощенная)
  const starSize = sizeInPx * 0.7;
  const orbitSize = sizeInPx * 0.9;
  const planetSize = sizeInPx * 0.2;

  return (
    <div className={`flex flex-col items-center justify-center ${fullScreen ? 'fixed inset-0 z-50 bg-[var(--background-primary)]/80 backdrop-blur-sm' : ''}`}>
      <div className="relative" style={{ width: sizeInPx, height: sizeInPx }}>
        {/* Упрощенная центральная звезда */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: starSize,
            height: starSize,
            top: '50%',
            left: '50%',
            marginLeft: -starSize / 2,
            marginTop: -starSize / 2,
            background: 'radial-gradient(circle, #FFD700 10%, #FFA500 40%, rgba(255, 165, 0, 0) 70%)',
            boxShadow: '0 0 20px #FFA500',
          }}
          animate={{ 
            scale: [1, 1.05, 1]
          }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        />

        {/* Убираем лучи звезды для производительности */}

        {/* Упрощенная орбита */}
        <motion.div 
          className="absolute rounded-full border border-[#8a2be2]/30"
          style={{
            width: orbitSize,
            height: orbitSize,
            top: '50%',
            left: '50%',
            marginLeft: -orbitSize / 2,
            marginTop: -orbitSize / 2,
          }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        />

        {/* Упрощенная планета */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: planetSize,
            height: planetSize,
            background: '#8a2be2',
            top: `calc(50% - ${planetSize / 2}px)`,
            left: `calc(50% + ${orbitSize / 2 - planetSize / 2}px)`,
            transformOrigin: `calc(-${orbitSize / 2 - planetSize / 2}px) 0px`,
          }}
          animate={{ 
            rotate: [0, 360],
          }}
          transition={{ 
            rotate: { repeat: Infinity, duration: 8, ease: "linear" }
          }}
        />
      </div>
      
      {text && (
        <motion.div 
          className="mt-3 text-white/90 font-cormorant"
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        >
          {text}
        </motion.div>
      )}
    </div>
  );
}