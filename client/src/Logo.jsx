import React from 'react';

export default function Logo() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', width: '100%' }}>
      <svg viewBox="0 0 600 240" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: '500px', filter: 'drop-shadow(0 10px 15px rgba(255,42,42,0.4))' }}>
        <defs>
          <style>
            {`
              .logo-group {
                transform: skewX(-15deg);
              }
              .text-top {
                font-family: 'Anton', sans-serif;
                font-size: 90px;
                fill: #FFFFFF;
                stroke: #111;
                stroke-width: 22px;
                stroke-linejoin: round;
                paint-order: stroke fill;
              }
              .text-bottom {
                font-family: 'Anton', sans-serif;
                font-size: 160px;
                fill: #FFFFFF;
                stroke: #111;
                stroke-width: 26px;
                stroke-linejoin: round;
                paint-order: stroke fill;
              }
              .vw-bg {
                fill: #111;
              }
              .vw-path {
                fill: #3b65a5;
              }
            `}
          </style>
        </defs>

        <g className="logo-group">
          {/* EL DEL */}
          <text x="350" y="85" textAnchor="middle" className="text-top">EL DEL</text>
          
          {/* F and X */}
          {/* Moved much closer to the center (350). Because of the skew, we have to fine-tune the X positions visually */}
          <text x="250" y="210" textAnchor="end" className="text-bottom">F</text>
          <text x="450" y="210" textAnchor="start" className="text-bottom">X</text>
        </g>

        {/* VW Logo perfectly centered and properly scaled */}
        {/* We move it to X=350, Y=145 (between EL DEL and FX vertically) */}
        <g transform="translate(350, 145)">
          {/* Black background for the thick outline. VW radius is 50 * 1.35 = 67.5, so 82 radius gives ~14.5px thick black border to match the text stroke */}
          <circle cx="0" cy="0" r="82" className="vw-bg" />
          
          {/* Original VW path, scaled up by 1.35. The original path is centered at (75, 75) so we translate by -75, -75 to put its center at (0,0) */}
          <g transform="scale(1.35) translate(-75, -75)">
            <path className="vw-path" d="M75,120.4c-24.9,0-45.3-20.5-45.3-45.4c0-5.6,1-10.9,2.9-15.9l26.5,53.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l12.2-27.3c0.1-0.3,0.3-0.6,0.6-0.6s0.4,0.3,0.6,0.6l12.2,27.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l26.5-53.3c1.9,5,2.9,10.3,2.9,15.9C120.3,99.9,99.9,120.4,75,120.4z M75,64.7c-0.3,0-0.4-0.3-0.6-0.6l-14.2-32c4.6-1.7,9.6-2.6,14.8-2.6c5.2,0,10.2,0.9,14.8,2.6l-14.2,32C75.4,64.5,75.3,64.7,75,64.7z M60.5,97.6c-0.3,0-0.4-0.3-0.6-0.6l-23-46.4c4.1-6.3,9.6-11.6,16.3-15.3l16.6,36.9C70,72.8,70.5,73,71,73h8c0.6,0,1-0.1,1.3-0.8l16.6-36.9c6.6,3.7,12.2,9,16.3,15.3L90,97c-0.1,0.3-0.3,0.6-0.6,0.6c-0.3,0-0.4-0.3-0.6-0.6l-8.7-19.8c-0.3-0.7-0.7-0.8-1.3-0.8h-8c-0.6,0-1,0.1-1.3,0.8L61.1,97C61,97.3,60.8,97.6,60.5,97.6z M75,125c27.7,0,50-22.3,50-50c0-27.7-22.3-50-50-50c-27.7,0-50,22.3-50,50C25,102.7,47.3,125,75,125z" />
          </g>
        </g>
      </svg>
    </div>
  );
}
