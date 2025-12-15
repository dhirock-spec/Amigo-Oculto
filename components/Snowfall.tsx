import React, { useEffect, useState } from 'react';

const Snowfall: React.FC = () => {
  const [flakes, setFlakes] = useState<number[]>([]);

  useEffect(() => {
    // Create a static set of flakes to avoid re-renders causing jumps
    const newFlakes = Array.from({ length: 30 }).map((_, i) => i);
    setFlakes(newFlakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {flakes.map((i) => {
        const left = `${Math.random() * 100}vw`;
        const animationDuration = `${Math.random() * 5 + 5}s`;
        const opacity = Math.random();
        const size = `${Math.random() * 10 + 5}px`;
        
        return (
          <div
            key={i}
            className="snowflake absolute bg-white rounded-full opacity-80"
            style={{
              left,
              width: size,
              height: size,
              animationDuration,
              opacity
            }}
          />
        );
      })}
    </div>
  );
};

export default Snowfall;
