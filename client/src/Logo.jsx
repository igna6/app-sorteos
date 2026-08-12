import React from 'react';

export default function Logo({ appTheme }) {
  if (appTheme === 'chona') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%', alignItems: 'center' }}>
        <h1 style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '6rem',
          color: '#F9B233', // Amarillo Boca
          textTransform: 'uppercase',
          textShadow: '-4px -4px 0 #00529F, 4px -4px 0 #00529F, -4px 4px 0 #00529F, 4px 4px 0 #00529F, 0px 8px 15px rgba(0,0,0,0.5)', // Azul Boca
          margin: 0,
          marginRight: '20px',
          fontStyle: 'italic'
        }}>
          CHHONAA
        </h1>
        <img src="/boca.png" alt="Boca Juniors" style={{ width: '120px', height: '120px', filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.5))' }} />
      </div>
    );
  }

  if (appTheme === 'jack') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%', alignItems: 'center' }}>
        <h1 style={{
          fontFamily: "'Anton', sans-serif",
          fontSize: '7rem',
          color: '#00f3ff', // Cyan Neon
          textTransform: 'uppercase',
          textShadow: '0 0 10px #00f3ff, 0 0 20px #00f3ff, 0 0 40px #b026ff, 0 0 80px #b026ff', // Neon Glow
          margin: 0,
          fontStyle: 'italic',
          letterSpacing: '5px'
        }}>
          JACK
        </h1>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%' }}>
      <svg viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '550px', filter: 'drop-shadow(0 10px 15px rgba(255,42,42,0.4))' }}>
        <defs>
          <style>
            {`
              .text-font {
                font-family: 'Anton', sans-serif;
              }
              .vw-path {
                fill: #3b65a5;
              }
            `}
          </style>
        </defs>

        {/* =========================================
            LAYER 1: UNIFIED BLACK OUTLINES 
            ========================================= */}
        
        {/* VW Logo Outer Black Outline */}
        <circle cx="350" cy="155" r="85" fill="#111" />

        {/* Text Black Outlines */}
        <g transform="skewX(-15) translate(40, 0)" fill="#111" stroke="#111" strokeWidth="28" strokeLinejoin="round">
          <text x="350" y="75" textAnchor="middle" fontSize="90" className="text-font">EL DEL</text>
          <text x="235" y="215" textAnchor="end" fontSize="160" className="text-font">F</text>
          <text x="465" y="215" textAnchor="start" fontSize="160" className="text-font">X</text>
        </g>

        {/* =========================================
            LAYER 2: WHITE TEXT FILLS 
            ========================================= */}
        <g transform="skewX(-15) translate(40, 0)" fill="#FFFFFF" stroke="none">
          <text x="350" y="75" textAnchor="middle" fontSize="90" className="text-font">EL DEL</text>
          <text x="235" y="215" textAnchor="end" fontSize="160" className="text-font">F</text>
          <text x="465" y="215" textAnchor="start" fontSize="160" className="text-font">X</text>
        </g>

        {/* =========================================
            LAYER 3: VW LOGO (Inner details)
            ========================================= */}
        <g transform="translate(350, 155)">
          {/* Inner Black Circle (cuts off any text that overlaps the VW logo space) */}
          <circle cx="0" cy="0" r="72" fill="#111" />
          
          {/* VW Blue Paths (Scaled up slightly to fill the 72px radius) */}
          {/* Original VW path center is 75,75. Radius is 50. Scale 1.4 -> 70px radius */}
          <g transform="scale(1.4) translate(-75, -75)">
            <path className="vw-path" d="M75,120.4c-24.9,0-45.3-20.5-45.3-45.4c0-5.6,1-10.9,2.9-15.9l26.5,53.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l12.2-27.3c0.1-0.3,0.3-0.6,0.6-0.6s0.4,0.3,0.6,0.6l12.2,27.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l26.5-53.3c1.9,5,2.9,10.3,2.9,15.9C120.3,99.9,99.9,120.4,75,120.4z M75,64.7c-0.3,0-0.4-0.3-0.6-0.6l-14.2-32c4.6-1.7,9.6-2.6,14.8-2.6c5.2,0,10.2,0.9,14.8,2.6l-14.2,32C75.4,64.5,75.3,64.7,75,64.7z M60.5,97.6c-0.3,0-0.4-0.3-0.6-0.6l-23-46.4c4.1-6.3,9.6-11.6,16.3-15.3l16.6,36.9C70,72.8,70.5,73,71,73h8c0.6,0,1-0.1,1.3-0.8l16.6-36.9c6.6,3.7,12.2,9,16.3,15.3L90,97c-0.1,0.3-0.3,0.6-0.6,0.6c-0.3,0-0.4-0.3-0.6-0.6l-8.7-19.8c-0.3-0.7-0.7-0.8-1.3-0.8h-8c-0.6,0-1,0.1-1.3,0.8L61.1,97C61,97.3,60.8,97.6,60.5,97.6z M75,125c27.7,0,50-22.3,50-50c0-27.7-22.3-50-50-50c-27.7,0-50,22.3-50,50C25,102.7,47.3,125,75,125z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
