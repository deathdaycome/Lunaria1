import { useEffect, useRef } from "react";

type ZodiacCreatureProps = {
  sign: 'fire' | 'water' | 'earth' | 'air';
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
};

// SVG анимации мистических звезд
const ZODIAC_CREATURES = {
  fire: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Огненная мистическая звезда -->
      <defs>
        <radialGradient id="fireStar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="rgba(255, 215, 0, 0.9)" />
          <stop offset="40%" stop-color="rgba(255, 69, 0, 0.7)" />
          <stop offset="70%" stop-color="rgba(139, 0, 0, 0.5)" />
          <stop offset="100%" stop-color="rgba(50, 0, 0, 0.1)" />
        </radialGradient>
        <filter id="fireGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
        </filter>
        <filter id="fireRays" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      
      <!-- Внешнее свечение -->
      <circle cx="50" cy="50" r="45" fill="url(#fireStar)" opacity="0.15" class="outer-glow" />
      
      <!-- Лучи звезды -->
      <g class="star-rays">
        <path d="M50,5 L53,45 L95,50 L53,55 L50,95 L47,55 L5,50 L47,45 Z" 
              fill="url(#fireStar)" 
              filter="url(#fireGlow)"
              class="main-rays" />
              
        <path d="M50,20 L52,45 L80,50 L52,55 L50,80 L48,55 L20,50 L48,45 Z" 
              fill="rgba(255, 215, 0, 0.6)" 
              class="inner-rays" />
        
        <!-- Дополнительные лучи -->
        <path d="M50,15 L55,45 M50,85 L45,55 M15,50 L45,45 M85,50 L55,55" 
              stroke="rgba(255, 165, 0, 0.8)" 
              stroke-width="1.5" 
              class="ray-lines" />
              
        <path d="M35,20 L45,45 M65,20 L55,45 M35,80 L45,55 M65,80 L55,55" 
              stroke="rgba(255, 165, 0, 0.6)" 
              stroke-width="1" 
              class="ray-lines-small" />
      </g>
      
      <!-- Мистический центр звезды -->
      <circle cx="50" cy="50" r="10" fill="rgba(255, 215, 0, 0.8)" class="star-core" />
      
      <!-- Мистические символы -->
      <g class="mystic-symbols">
        <path d="M45,47 L55,53 M45,53 L55,47" 
              stroke="rgba(255, 255, 255, 0.9)" 
              stroke-width="1.5" 
              class="symbol-cross" />
              
        <circle cx="50" cy="50" r="6" 
                stroke="rgba(255, 255, 255, 0.7)" 
                stroke-width="0.8" 
                fill="none" 
                class="symbol-circle" />
      </g>
      
      <!-- Искры -->
      <g class="sparks">
        <circle cx="35" cy="35" r="1" fill="white" class="spark spark1" />
        <circle cx="65" cy="35" r="1.2" fill="white" class="spark spark2" />
        <circle cx="35" cy="65" r="0.8" fill="white" class="spark spark3" />
        <circle cx="65" cy="65" r="1.5" fill="white" class="spark spark4" />
        <circle cx="25" cy="50" r="1" fill="white" class="spark spark5" />
        <circle cx="75" cy="50" r="0.7" fill="white" class="spark spark6" />
        <circle cx="50" cy="25" r="1.3" fill="white" class="spark spark7" />
        <circle cx="50" cy="75" r="0.9" fill="white" class="spark spark8" />
      </g>
      
      <style>
        .outer-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .star-rays {
          animation: rotateRays 30s linear infinite;
          transform-origin: 50px 50px;
        }
        .main-rays {
          animation: pulsateRays 5s ease-in-out infinite;
        }
        .inner-rays {
          animation: pulseInnerRays 4s ease-in-out infinite;
          transform-origin: 50px 50px;
        }
        .ray-lines {
          animation: glowRayLines 3s ease-in-out infinite;
        }
        .ray-lines-small {
          animation: glowRayLines 3s ease-in-out infinite reverse;
        }
        .star-core {
          animation: pulseCore 4s ease-in-out infinite;
        }
        .symbol-cross {
          animation: fadeInOutCross 4s ease-in-out infinite;
        }
        .symbol-circle {
          animation: rotateCircle 10s linear infinite, pulseCircle 4s ease-in-out infinite;
        }
        .spark {
          animation: sparkle 4s infinite;
        }
        .spark1 { animation-delay: 0s; }
        .spark2 { animation-delay: 0.5s; }
        .spark3 { animation-delay: 1s; }
        .spark4 { animation-delay: 1.5s; }
        .spark5 { animation-delay: 2s; }
        .spark6 { animation-delay: 2.5s; }
        .spark7 { animation-delay: 3s; }
        .spark8 { animation-delay: 3.5s; }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; r: 45; }
          50% { opacity: 0.25; r: 48; }
        }
        @keyframes rotateRays {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulsateRays {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes pulseInnerRays {
          0%, 100% { opacity: 0.6; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.8; transform: scale(1.05) rotate(15deg); }
        }
        @keyframes glowRayLines {
          0%, 100% { opacity: 0.8; stroke-width: 1.5; }
          50% { opacity: 1; stroke-width: 2; }
        }
        @keyframes pulseCore {
          0%, 100% { r: 10; opacity: 0.8; }
          50% { r: 12; opacity: 0.9; }
        }
        @keyframes fadeInOutCross {
          0%, 100% { opacity: 0.9; stroke-width: 1.5; }
          50% { opacity: 0.6; stroke-width: 1; }
        }
        @keyframes rotateCircle {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseCircle {
          0%, 100% { r: 6; opacity: 0.7; }
          50% { r: 7; opacity: 0.9; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.1; r: 1; }
          50% { opacity: 1; r: 1.5; }
        }
      </style>
    </svg>
  `,
  
  water: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Водная мистическая звезда -->
      <defs>
        <radialGradient id="waterStar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="rgba(135, 206, 250, 0.9)" />
          <stop offset="40%" stop-color="rgba(30, 144, 255, 0.7)" />
          <stop offset="70%" stop-color="rgba(0, 0, 139, 0.5)" />
          <stop offset="100%" stop-color="rgba(0, 0, 50, 0.1)" />
        </radialGradient>
        <filter id="waterGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <filter id="waterRipple" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      
      <!-- Внешнее свечение -->
      <circle cx="50" cy="50" r="45" fill="url(#waterStar)" opacity="0.15" class="outer-glow" />
      
      <!-- Лучи звезды -->
      <g class="star-rays">
        <path d="M50,5 C55,30 75,45 95,50 C75,55 55,70 50,95 C45,70 25,55 5,50 C25,45 45,30 50,5 Z" 
              fill="url(#waterStar)" 
              filter="url(#waterGlow)"
              class="main-rays" />
              
        <path d="M50,20 C55,35 65,45 80,50 C65,55 55,65 50,80 C45,65 35,55 20,50 C35,45 45,35 50,20 Z" 
              fill="rgba(135, 206, 250, 0.5)" 
              class="inner-rays" />
        
        <!-- Волнистые линии -->
        <path d="M30,40 Q40,35 50,40 Q60,45 70,40" 
              stroke="rgba(135, 206, 250, 0.7)" 
              stroke-width="1.5" 
              fill="none"
              class="wave-line wave1" />
              
        <path d="M30,50 Q40,55 50,50 Q60,45 70,50" 
              stroke="rgba(135, 206, 250, 0.7)" 
              stroke-width="1.5" 
              fill="none"
              class="wave-line wave2" />
              
        <path d="M30,60 Q40,65 50,60 Q60,55 70,60" 
              stroke="rgba(135, 206, 250, 0.7)" 
              stroke-width="1.5" 
              fill="none"
              class="wave-line wave3" />
      </g>
      
      <!-- Мистический центр звезды -->
      <circle cx="50" cy="50" r="12" fill="rgba(135, 206, 250, 0.6)" class="star-core" />
      
      <!-- Мистические символы -->
      <g class="mystic-symbols">
        <path d="M45,45 A 5,5 0 1,0 55,45 A 5,5 0 1,0 45,45 Z" 
              stroke="rgba(255, 255, 255, 0.8)" 
              stroke-width="1.2" 
              fill="none"
              class="symbol-infinity" />
              
        <circle cx="50" cy="50" r="8" 
                stroke="rgba(255, 255, 255, 0.7)" 
                stroke-width="0.8" 
                fill="none" 
                class="symbol-circle" />
      </g>
      
      <!-- Капли -->
      <g class="droplets">
        <path d="M35,30 Q35,25 38,28 Q40,30 38,33 Q35,35 35,30 Z" fill="rgba(255,255,255,0.8)" class="droplet drop1" />
        <path d="M65,30 Q65,25 68,28 Q70,30 68,33 Q65,35 65,30 Z" fill="rgba(255,255,255,0.8)" class="droplet drop2" />
        <path d="M35,70 Q35,65 38,68 Q40,70 38,73 Q35,75 35,70 Z" fill="rgba(255,255,255,0.8)" class="droplet drop3" />
        <path d="M65,70 Q65,65 68,68 Q70,70 68,73 Q65,75 65,70 Z" fill="rgba(255,255,255,0.8)" class="droplet drop4" />
        <path d="M25,50 Q25,45 28,48 Q30,50 28,53 Q25,55 25,50 Z" fill="rgba(255,255,255,0.8)" class="droplet drop5" />
        <path d="M75,50 Q75,45 78,48 Q80,50 78,53 Q75,55 75,50 Z" fill="rgba(255,255,255,0.8)" class="droplet drop6" />
      </g>
      
      <style>
        .outer-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .star-rays {
          animation: rotateRaysSlow 60s linear infinite;
          transform-origin: 50px 50px;
        }
        .main-rays {
          animation: pulsateRays 6s ease-in-out infinite;
        }
        .inner-rays {
          animation: pulseInnerRays 5s ease-in-out infinite;
          transform-origin: 50px 50px;
        }
        .wave-line {
          animation: waveFlow 4s ease-in-out infinite;
        }
        .wave1 { animation-delay: 0s; }
        .wave2 { animation-delay: 1s; }
        .wave3 { animation-delay: 2s; }
        .star-core {
          animation: pulseCore 5s ease-in-out infinite;
          filter: url(#waterRipple);
        }
        .symbol-infinity {
          animation: rotateInfinity 10s linear infinite, fadeInfinity 5s ease-in-out infinite;
          transform-origin: 50px 45px;
        }
        .symbol-circle {
          animation: rotateCircle 8s linear infinite reverse, pulseCircle 4s ease-in-out infinite;
        }
        .droplet {
          animation: fadeDroplet 4s infinite;
        }
        .drop1 { animation-delay: 0s; }
        .drop2 { animation-delay: 0.7s; }
        .drop3 { animation-delay: 1.4s; }
        .drop4 { animation-delay: 2.1s; }
        .drop5 { animation-delay: 2.8s; }
        .drop6 { animation-delay: 3.5s; }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; r: 45; }
          50% { opacity: 0.25; r: 48; }
        }
        @keyframes rotateRaysSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulsateRays {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        @keyframes pulseInnerRays {
          0%, 100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.7; transform: scale(1.05) rotate(-5deg); }
        }
        @keyframes waveFlow {
          0%, 100% { opacity: 0.7; stroke-width: 1.5; transform: translateY(0); }
          50% { opacity: 0.9; stroke-width: 2; transform: translateY(-2px); }
        }
        @keyframes pulseCore {
          0%, 100% { r: 12; opacity: 0.6; }
          50% { r: 14; opacity: 0.8; }
        }
        @keyframes rotateInfinity {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes fadeInfinity {
          0%, 100% { opacity: 0.8; stroke-width: 1.2; }
          50% { opacity: 0.6; stroke-width: 0.8; }
        }
        @keyframes rotateCircle {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseCircle {
          0%, 100% { r: 8; opacity: 0.7; }
          50% { r: 9; opacity: 0.9; }
        }
        @keyframes fadeDroplet {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.8; transform: translateY(-3px); }
        }
      </style>
    </svg>
  `,
  
  earth: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Земляная мистическая звезда -->
      <defs>
        <radialGradient id="earthStar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="rgba(154, 205, 50, 0.9)" />
          <stop offset="40%" stop-color="rgba(85, 107, 47, 0.7)" />
          <stop offset="70%" stop-color="rgba(139, 69, 19, 0.5)" />
          <stop offset="100%" stop-color="rgba(50, 20, 0, 0.1)" />
        </radialGradient>
        <filter id="earthGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" />
        </filter>
        <filter id="earthTexture" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="4" seed="5" />
          <feDisplacementMap in="SourceGraphic" scale="2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      
      <!-- Внешнее свечение -->
      <circle cx="50" cy="50" r="45" fill="url(#earthStar)" opacity="0.15" class="outer-glow" />
      
      <!-- Лучи звезды - ромбовидная форма для земли -->
      <g class="star-rays">
        <path d="M50,5 L75,50 L50,95 L25,50 Z" 
              fill="url(#earthStar)" 
              filter="url(#earthGlow)"
              class="main-rays" />
              
        <path d="M50,20 L65,50 L50,80 L35,50 Z" 
              fill="rgba(154, 205, 50, 0.5)" 
              class="inner-rays" />
        
        <!-- Декоративные элементы - ветки и листья -->
        <g class="branches">
          <path d="M40,30 Q35,35 30,33 M40,30 Q38,25 40,20" 
                stroke="rgba(139, 69, 19, 0.8)" 
                stroke-width="1.2" 
                fill="none"
                class="branch branch1" />
                
          <path d="M60,30 Q65,35 70,33 M60,30 Q62,25 60,20" 
                stroke="rgba(139, 69, 19, 0.8)" 
                stroke-width="1.2" 
                fill="none"
                class="branch branch2" />
                
          <path d="M40,70 Q35,65 30,67 M40,70 Q38,75 40,80" 
                stroke="rgba(139, 69, 19, 0.8)" 
                stroke-width="1.2" 
                fill="none"
                class="branch branch3" />
                
          <path d="M60,70 Q65,65 70,67 M60,70 Q62,75 60,80" 
                stroke="rgba(139, 69, 19, 0.8)" 
                stroke-width="1.2" 
                fill="none"
                class="branch branch4" />
        </g>
        
        <!-- Листья -->
        <g class="leaves">
          <path d="M30,33 Q28,30 30,28 Q33,27 35,30 Q33,33 30,33 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf1" />
                
          <path d="M70,33 Q72,30 70,28 Q67,27 65,30 Q67,33 70,33 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf2" />
                
          <path d="M30,67 Q28,70 30,72 Q33,73 35,70 Q33,67 30,67 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf3" />
                
          <path d="M70,67 Q72,70 70,72 Q67,73 65,70 Q67,67 70,67 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf4" />
                
          <path d="M40,20 Q38,17 40,15 Q43,14 45,17 Q43,20 40,20 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf5" />
                
          <path d="M60,20 Q62,17 60,15 Q57,14 55,17 Q57,20 60,20 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf6" />
                
          <path d="M40,80 Q38,83 40,85 Q43,86 45,83 Q43,80 40,80 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf7" />
                
          <path d="M60,80 Q62,83 60,85 Q57,86 55,83 Q57,80 60,80 Z" 
                fill="rgba(154, 205, 50, 0.8)" 
                class="leaf leaf8" />
        </g>
      </g>
      
      <!-- Мистический центр звезды -->
      <circle cx="50" cy="50" r="12" fill="rgba(139, 69, 19, 0.7)" class="star-core" />
      
      <!-- Мистические символы -->
      <g class="mystic-symbols">
        <path d="M45,50 L55,50 M50,45 L50,55" 
              stroke="rgba(255, 255, 255, 0.9)" 
              stroke-width="1.5" 
              class="symbol-cross" />
              
        <circle cx="50" cy="50" r="8" 
                stroke="rgba(255, 255, 255, 0.8)" 
                stroke-width="0.8" 
                fill="none" 
                class="symbol-circle" />
                
        <path d="M44,44 L56,56 M44,56 L56,44" 
              stroke="rgba(255, 255, 255, 0.6)" 
              stroke-width="0.5" 
              class="symbol-x" />
      </g>
      
      <style>
        .outer-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .star-rays {
          animation: rotateRaysSlow 120s linear infinite;
          transform-origin: 50px 50px;
        }
        .main-rays {
          animation: pulsateRays 7s ease-in-out infinite;
        }
        .inner-rays {
          animation: pulseInnerRays 5s ease-in-out infinite;
          transform-origin: 50px 50px;
        }
        .branch {
          animation: sway 5s ease-in-out infinite;
        }
        .branch1 { animation-delay: 0s; transform-origin: 40px 30px; }
        .branch2 { animation-delay: 1s; transform-origin: 60px 30px; }
        .branch3 { animation-delay: 2s; transform-origin: 40px 70px; }
        .branch4 { animation-delay: 3s; transform-origin: 60px 70px; }
        .leaf {
          animation: pulseLeaf 4s ease-in-out infinite;
        }
        .leaf1 { animation-delay: 0s; }
        .leaf2 { animation-delay: 0.5s; }
        .leaf3 { animation-delay: 1s; }
        .leaf4 { animation-delay: 1.5s; }
        .leaf5 { animation-delay: 2s; }
        .leaf6 { animation-delay: 2.5s; }
        .leaf7 { animation-delay: 3s; }
        .leaf8 { animation-delay: 3.5s; }
        .star-core {
          animation: pulseCore 5s ease-in-out infinite;
          filter: url(#earthTexture);
        }
        .symbol-cross {
          animation: fadeInOutCross 4s ease-in-out infinite;
        }
        .symbol-circle {
          animation: rotateCircle 15s linear infinite, pulseCircle 4s ease-in-out infinite;
        }
        .symbol-x {
          animation: fadeX 3s ease-in-out infinite;
        }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; r: 45; }
          50% { opacity: 0.25; r: 48; }
        }
        @keyframes rotateRaysSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulsateRays {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        @keyframes pulseInnerRays {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes sway {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(5deg); }
          75% { transform: rotate(-5deg); }
        }
        @keyframes pulseLeaf {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        @keyframes pulseCore {
          0%, 100% { r: 12; opacity: 0.7; }
          50% { r: 13; opacity: 0.8; }
        }
        @keyframes fadeInOutCross {
          0%, 100% { opacity: 0.9; stroke-width: 1.5; }
          50% { opacity: 0.7; stroke-width: 1; }
        }
        @keyframes rotateCircle {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseCircle {
          0%, 100% { r: 8; opacity: 0.8; }
          50% { r: 9; opacity: 0.9; }
        }
        @keyframes fadeX {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      </style>
    </svg>
  `,
  
  air: `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <!-- Воздушная мистическая звезда -->
      <defs>
        <radialGradient id="airStar" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <stop offset="0%" stop-color="rgba(255, 255, 255, 0.9)" />
          <stop offset="40%" stop-color="rgba(173, 216, 230, 0.7)" />
          <stop offset="70%" stop-color="rgba(138, 43, 226, 0.5)" />
          <stop offset="100%" stop-color="rgba(75, 0, 130, 0.1)" />
        </radialGradient>
        <filter id="airGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" />
        </filter>
        <filter id="airWind" x="-50%" y="-50%" width="200%" height="200%">
          <feTurbulence type="fractalNoise" baseFrequency="0.01" numOctaves="1" seed="2" />
          <feDisplacementMap in="SourceGraphic" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
      
      <!-- Внешнее свечение -->
      <circle cx="50" cy="50" r="45" fill="url(#airStar)" opacity="0.15" class="outer-glow" />
      
      <!-- Лучи звезды - многоконечная форма для воздуха -->
      <g class="star-rays">
        <path d="M50,5 L55,25 L75,10 L65,30 L90,35 L65,45 L85,65 L60,55 L65,85 L50,65 L35,85 L40,55 L15,65 L35,45 L10,35 L35,30 L25,10 L45,25 Z" 
              fill="url(#airStar)" 
              filter="url(#airGlow)"
              class="main-rays" />
              
        <path d="M50,20 L53,32 L65,25 L58,38 L70,45 L55,50 L62,62 L50,56 L38,62 L45,50 L30,45 L42,38 L35,25 L47,32 Z" 
              fill="rgba(173, 216, 230, 0.5)" 
              class="inner-rays" />
        
        <!-- Воздушные спирали -->
        <g class="air-swirls">
          <path d="M30,30 Q40,25 35,35 Q25,45 35,50 Q45,55 40,65" 
                stroke="rgba(255, 255, 255, 0.7)" 
                stroke-width="1.2" 
                fill="none"
                class="swirl swirl1" />
                
          <path d="M70,30 Q60,25 65,35 Q75,45 65,50 Q55,55 60,65" 
                stroke="rgba(255, 255, 255, 0.7)" 
                stroke-width="1.2" 
                fill="none"
                class="swirl swirl2" />
                
          <path d="M25,50 Q35,48 38,38 Q40,28 50,30" 
                stroke="rgba(255, 255, 255, 0.6)" 
                stroke-width="0.8" 
                fill="none"
                class="swirl swirl3" />
                
          <path d="M75,50 Q65,48 62,38 Q60,28 50,30" 
                stroke="rgba(255, 255, 255, 0.6)" 
                stroke-width="0.8" 
                fill="none"
                class="swirl swirl4" />
        </g>
      </g>
      
      <!-- Мистический центр звезды -->
      <circle cx="50" cy="50" r="12" fill="rgba(173, 216, 230, 0.6)" class="star-core" />
      
      <!-- Мистические символы -->
      <g class="mystic-symbols">
        <circle cx="50" cy="50" r="7" 
                stroke="rgba(255, 255, 255, 0.9)" 
                stroke-width="1" 
                fill="none" 
                class="symbol-circle1" />
                
        <circle cx="50" cy="50" r="10" 
                stroke="rgba(255, 255, 255, 0.7)" 
                stroke-width="0.8" 
                fill="none" 
                class="symbol-circle2" />
                
        <path d="M45,45 L55,55 M45,55 L55,45" 
              stroke="rgba(255, 255, 255, 0.8)" 
              stroke-width="1" 
              class="symbol-x" />
      </g>
      
      <!-- Летящие частицы -->
      <g class="particles">
        <circle cx="30" cy="30" r="0.8" fill="white" class="particle p1" />
        <circle cx="35" cy="40" r="0.6" fill="white" class="particle p2" />
        <circle cx="25" cy="45" r="0.7" fill="white" class="particle p3" />
        <circle cx="70" cy="30" r="0.8" fill="white" class="particle p4" />
        <circle cx="65" cy="40" r="0.6" fill="white" class="particle p5" />
        <circle cx="75" cy="45" r="0.7" fill="white" class="particle p6" />
        <circle cx="40" cy="70" r="0.5" fill="white" class="particle p7" />
        <circle cx="60" cy="70" r="0.5" fill="white" class="particle p8" />
        <circle cx="50" cy="20" r="0.6" fill="white" class="particle p9" />
        <circle cx="45" cy="75" r="0.7" fill="white" class="particle p10" />
        <circle cx="55" cy="75" r="0.7" fill="white" class="particle p11" />
        <circle cx="25" cy="60" r="0.5" fill="white" class="particle p12" />
        <circle cx="75" cy="60" r="0.5" fill="white" class="particle p13" />
      </g>
      
      <style>
        .outer-glow {
          animation: pulseGlow 8s ease-in-out infinite;
        }
        .star-rays {
          animation: rotateRaysFast 45s linear infinite;
          transform-origin: 50px 50px;
        }
        .main-rays {
          animation: pulsateRays 6s ease-in-out infinite;
          filter: url(#airWind);
        }
        .inner-rays {
          animation: pulseInnerRays 4s ease-in-out infinite;
          transform-origin: 50px 50px;
        }
        .swirl {
          animation: flowSwirl 6s ease-in-out infinite;
        }
        .swirl1 { animation-delay: 0s; }
        .swirl2 { animation-delay: 1.5s; }
        .swirl3 { animation-delay: 3s; }
        .swirl4 { animation-delay: 4.5s; }
        .star-core {
          animation: pulseCore 5s ease-in-out infinite;
        }
        .symbol-circle1 {
          animation: rotateCircleFast 6s linear infinite, pulseCircle 3s ease-in-out infinite;
        }
        .symbol-circle2 {
          animation: rotateCircleSlow 10s linear infinite reverse, pulseCircle 4s ease-in-out infinite;
        }
        .symbol-x {
          animation: fadeX 4s ease-in-out infinite;
        }
        .particle {
          animation: floatParticle 8s infinite;
        }
        .p1 { animation-delay: 0s; }
        .p2 { animation-delay: 0.6s; }
        .p3 { animation-delay: 1.2s; }
        .p4 { animation-delay: 1.8s; }
        .p5 { animation-delay: 2.4s; }
        .p6 { animation-delay: 3s; }
        .p7 { animation-delay: 3.6s; }
        .p8 { animation-delay: 4.2s; }
        .p9 { animation-delay: 4.8s; }
        .p10 { animation-delay: 5.4s; }
        .p11 { animation-delay: 6s; }
        .p12 { animation-delay: 6.6s; }
        .p13 { animation-delay: 7.2s; }
        
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.15; r: 45; }
          50% { opacity: 0.25; r: 48; }
        }
        @keyframes rotateRaysFast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulsateRays {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        @keyframes pulseInnerRays {
          0%, 100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
          50% { opacity: 0.7; transform: scale(1.05) rotate(15deg); }
        }
        @keyframes flowSwirl {
          0%, 100% { opacity: 0.7; stroke-width: 1.2; }
          50% { opacity: 0.9; stroke-width: 1.5; }
        }
        @keyframes pulseCore {
          0%, 100% { r: 12; opacity: 0.6; }
          50% { r: 14; opacity: 0.8; }
        }
        @keyframes rotateCircleFast {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateCircleSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseCircle {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 0.9; }
        }
        @keyframes fadeX {
          0%, 100% { opacity: 0.8; stroke-width: 1; }
          50% { opacity: 0.5; stroke-width: 0.7; }
        }
        @keyframes floatParticle {
          0% { 
            opacity: 0; 
            transform: translate(0, 0); 
          }
          25% { 
            opacity: 1; 
          }
          75% { 
            opacity: 1; 
          }
          100% { 
            opacity: 0; 
            transform: translate(calc(50px - 100% * var(--x)), calc(50px - 100% * var(--y))); 
            --x: calc(cos(360deg * var(--i))); 
            --y: calc(sin(360deg * var(--i))); 
            --i: calc(var(--n) / 13); 
          }
        }
      </style>
    </svg>
  `
};

export default function ZodiacCreature({ sign, position, size = 100 }: ZodiacCreatureProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ZODIAC_CREATURES[sign];
    }
  }, [sign]);
  
  const positionClasses = {
    'top-left': 'absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4',
    'top-right': 'absolute top-0 right-0 translate-x-1/4 -translate-y-1/4',
    'bottom-left': 'absolute bottom-0 left-0 -translate-x-1/4 translate-y-1/4',
    'bottom-right': 'absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4',
  };
  
  return (
    <div 
      ref={containerRef}
      className={`zodiac-creature ${positionClasses[position]}`}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}