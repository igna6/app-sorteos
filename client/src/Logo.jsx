import React from 'react';

export default function Logo() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%' }}>
      <svg viewBox="0 0 600 220" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '500px', filter: 'drop-shadow(0 10px 15px rgba(255,42,42,0.4))' }}>
        <defs>
          <style>
            {`
              .logo-group {
                transform: skewX(-15deg);
              }
              .text-top {
                font-family: 'Anton', sans-serif;
                font-size: 85px;
                fill: #FFFFFF;
                stroke: #111;
                stroke-width: 18px;
                stroke-linejoin: round;
                paint-order: stroke fill;
              }
              .text-bottom {
                font-family: 'Anton', sans-serif;
                font-size: 160px;
                fill: #FFFFFF;
                stroke: #111;
                stroke-width: 25px;
                stroke-linejoin: round;
                paint-order: stroke fill;
              }
              .vw-bg {
                fill: #111;
              }
              .vw-ring {
                fill: none;
                stroke: #3b5e8c;
                stroke-width: 6;
              }
            `}
          </style>
        </defs>

        {/* Text is skewed */}
        <g className="logo-group">
          {/* EL DEL */}
          <text x="350" y="80" textAnchor="middle" className="text-top">EL DEL</text>
          
          {/* F and X */}
          <text x="210" y="200" textAnchor="end" className="text-bottom">F</text>
          <text x="490" y="200" textAnchor="start" className="text-bottom">X</text>
        </g>

        {/* VW Logo is perfectly round and overlaps the F and X to bridge the black stroke */}
        {/* We place it in the center visually between F and X. Because of the skew on the text, the center is shifted right. */}
        <g transform="translate(350, 145)">
          {/* Black background acts as the outline to merge with the text stroke */}
          <circle cx="0" cy="0" r="55" className="vw-bg" />
          
          {/* Blue Ring */}
          <circle cx="0" cy="0" r="48" className="vw-ring" />
          
          {/* Inner VW vectors from official logo */}
          {/* Scaled down to fit within the ring. Original viewbox is 100x100 if we normalize it */}
          <g transform="scale(0.8) translate(-75, -97)">
            <path d="M75,120.4c-24.9,0-45.3-20.5-45.3-45.4c0-5.6,1-10.9,2.9-15.9l26.5,53.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l12.2-27.3c0.1-0.3,0.3-0.6,0.6-0.6s0.4,0.3,0.6,0.6l12.2,27.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l26.5-53.3c1.9,5,2.9,10.3,2.9,15.9C120.3,99.9,99.9,120.4,75,120.4z M75,64.7c-0.3,0-0.4-0.3-0.6-0.6l-14.2-32c4.6-1.7,9.6-2.6,14.8-2.6c5.2,0,10.2,0.9,14.8,2.6l-14.2,32C75.4,64.5,75.3,64.7,75,64.7z M60.5,97.6c-0.3,0-0.4-0.3-0.6-0.6l-23-46.4c4.1-6.3,9.6-11.6,16.3-15.3l16.6,36.9C70,72.8,70.5,73,71,73h8c0.6,0,1-0.1,1.3-0.8l16.6-36.9c6.6,3.7,12.2,9,16.3,15.3L90,97c-0.1,0.3-0.3,0.6-0.6,0.6c-0.3,0-0.4-0.3-0.6-0.6l-8.7-19.8c-0.3-0.7-0.7-0.8-1.3-0.8h-8c-0.6,0-1,0.1-1.3,0.8L61.1,97C61,97.3,60.8,97.6,60.5,97.6z" fill="#3b5e8c" />
          </g>
        </g>
      </svg>
    </div>
  );
}
