import React from 'react';

type Planet = {
  name: string;
  russianName: string;
  color: string;
  symbol: string;
  position: string;
};

export default function PlanetsIndicator() {
  // Демо данные о планетах и их положении
  const planets: Planet[] = [
    { 
      name: 'Sun', 
      russianName: 'Солнце', 
      color: '#FFD700', 
      symbol: '☉', 
      position: 'Овен' 
    },
    { 
      name: 'Moon', 
      russianName: 'Луна', 
      color: '#C0C0C0', 
      symbol: '☽', 
      position: 'Близнецы' 
    },
    { 
      name: 'Mercury', 
      russianName: 'Меркурий', 
      color: '#708090', 
      symbol: '☿', 
      position: 'Телец' 
    },
    { 
      name: 'Venus', 
      russianName: 'Венера', 
      color: '#FFC0CB', 
      symbol: '♀', 
      position: 'Рыбы' 
    },
    { 
      name: 'Mars', 
      russianName: 'Марс', 
      color: '#FF4500', 
      symbol: '♂', 
      position: 'Скорпион' 
    }
  ];

  return (
    <div className="planets-indicator fade-in-up delay-200">
      {planets.map((planet, index) => (
        <div key={index} className="planet">
          <div 
            className="planet-icon" 
            style={{ 
              backgroundColor: `${planet.color}20`, 
              border: `1px solid ${planet.color}40`,
              color: planet.color
            }}
          >
            <span className="absolute inset-0 flex items-center justify-center text-lg">
              {planet.symbol}
            </span>
          </div>
          <span className="planet-name font-cormorant">{planet.russianName}</span>
          <span className="text-[10px] opacity-60 font-cormorant">{planet.position}</span>
        </div>
      ))}
    </div>
  );
}