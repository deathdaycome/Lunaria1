import ZodiacCreature from "./zodiac-creature";

export default function ZodiacCreaturesCorners() { // переписал ИП, 13.05.2025
  return (
    <>
      {/* Верхний левый угол - Огонь */}
      <ZodiacCreature 
        sign="fire" 
        position="top-left" 
        size={150}
      />
      
      {/* Верхний правый угол - Воздух */}
      <ZodiacCreature 
        sign="air" 
        position="top-right" 
        size={150}
      />
      
      {/* Нижний левый угол - Вода */}
      <ZodiacCreature 
        sign="water" 
        position="bottom-left" 
        size={150}
      />
      
      {/* Нижний правый угол - Земля */}
      <ZodiacCreature 
        sign="earth" 
        position="bottom-right" 
        size={150}
      />
    </>
  );
}