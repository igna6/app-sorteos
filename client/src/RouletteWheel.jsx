import React from 'react';
import './RouletteMode.css';

const COLORS = [
  '#FF5E5B', '#D8D27B', '#00CECB', '#FFED66', '#FF92C2',
  '#2D3142', '#BFC0C0', '#EF8354', '#4F5D75', '#7D82B8',
  '#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'
];

const RouletteWheel = ({ participants, rotation, isSpinning, onSpin }) => {
  const numSlices = participants.length || 1;
  const sliceAngle = 360 / numSlices;
  
  // Create paths for SVG
  const getSlicePath = (index) => {
    if (numSlices === 1) {
      return "M 100, 100 m -100, 0 a 100,100 0 1,0 200,0 a 100,100 0 1,0 -200,0";
    }
    const startAngle = (index * sliceAngle * Math.PI) / 180;
    const endAngle = ((index + 1) * sliceAngle * Math.PI) / 180;
    const x1 = 100 + 100 * Math.sin(startAngle);
    const y1 = 100 - 100 * Math.cos(startAngle);
    const x2 = 100 + 100 * Math.sin(endAngle);
    const y2 = 100 - 100 * Math.cos(endAngle);
    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
    
    return `M 100 100 L ${x1} ${y1} A 100 100 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  return (
    <div className="wheel-container">
      <div className="wheel-pointer"></div>
      <button 
        className="spin-btn" 
        onClick={onSpin}
        disabled={isSpinning || participants.length === 0}
      >
        GIRAR
      </button>
      <div 
        className="wheel-svg" 
        style={{ 
          transform: `rotate(${rotation}deg)`,
          transitionDuration: isSpinning ? '4s' : '0s'
        }}
      >
        <svg viewBox="0 0 200 200" width="100%" height="100%">
          {participants.length === 0 ? (
            <circle cx="100" cy="100" r="100" fill="#333" />
          ) : (
            participants.map((p, i) => {
              const textRotation = (i * sliceAngle) + (sliceAngle / 2);
              return (
                <g key={`slice-${p.id}-${i}`}>
                  <path 
                    d={getSlicePath(i)} 
                    fill={COLORS[i % COLORS.length]} 
                    stroke="rgba(0,0,0,0.2)"
                    strokeWidth="0.5"
                  />
                  <text
                    x="100"
                    y="30"
                    fill="#000"
                    fontSize={numSlices > 10 ? "8" : "12"}
                    fontWeight="bold"
                    textAnchor="middle"
                    transform={`rotate(${textRotation}, 100, 100)`}
                  >
                    {p.name.length > 15 ? p.name.substring(0, 12) + '...' : p.name}
                  </text>
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};

export default RouletteWheel;
