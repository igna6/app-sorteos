import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import RouletteWheel from './RouletteWheel';
import confetti from 'canvas-confetti';
import './RouletteMode.css';

const RouletteMode = ({ appTheme, isFixedMode }) => {
  const [participants, setParticipants] = useState([]);
  const [newName, setNewName] = useState('');
  const [newLives, setNewLives] = useState(1);
  
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winnerResult, setWinnerResult] = useState(null);

  useEffect(() => {
    if (appTheme === 'joquer' && isFixedMode) {
      const saved = localStorage.getItem('joquerFixedRouletteOptions');
      if (saved) {
        try {
          setParticipants(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to load saved roulette options', e);
        }
      }
    }
  }, [appTheme, isFixedMode]);

  useEffect(() => {
    if (appTheme === 'joquer' && isFixedMode) {
      localStorage.setItem('joquerFixedRouletteOptions', JSON.stringify(participants));
    }
  }, [participants, appTheme, isFixedMode]);

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newName.trim() || newLives < 1) return;
    
    setParticipants([...participants, {
      id: Date.now(),
      name: newName.trim(),
      lives: parseInt(newLives, 10)
    }]);
    
    setNewName('');
    setNewLives(1);
  };

  const handleRemove = (id) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  const handleSpin = () => {
    if (participants.length === 0 || isSpinning) return;
    
    setIsSpinning(true);
    
    // Choose a random winner
    const winningIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[winningIndex];
    
    // Calculate rotation to stop at this winner.
    // The pointer is at 0 degrees (top).
    // SVG 0 degrees is also at the top.
    // Slices are drawn starting from 0, clockwise.
    // To land on winningIndex, the wheel needs to rotate such that
    // the winning slice is under the pointer.
    
    const sliceAngle = 360 / participants.length;
    // The angle where this slice is located (middle of the slice)
    const sliceMiddleAngle = (winningIndex * sliceAngle) + (sliceAngle / 2);
    
    // We want the wheel to spin multiple times (e.g., 5 full rotations = 1800deg)
    const baseSpins = 360 * 5;
    // We subtract sliceMiddleAngle because we need to move that slice backwards to 0 (top)
    const finalRotation = rotation + baseSpins + (360 - (sliceMiddleAngle % 360)) - (rotation % 360);

    setRotation(finalRotation);

    setTimeout(() => {
      // Show result
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      
      setWinnerResult(winner);
      setIsSpinning(false);
    }, 4000); // Wait for CSS transition (4s)
  };

  const handleModalClose = () => {
    if (!winnerResult) return;
    
    // Si estamos en modo fijo, no eliminamos al ganador ni descontamos vidas
    if (appTheme === 'joquer' && isFixedMode) {
      setWinnerResult(null);
      return;
    }

    setParticipants(currentParticipants => {
      return currentParticipants.map(p => {
        if (p.id === winnerResult.id) {
          return { ...p, lives: p.lives - 1 };
        }
        return p;
      }).filter(p => p.lives > 0); // Automatically remove those with 0 lives
    });
    
    setWinnerResult(null);
  };

  return (
    <div className="roulette-container">
      <div className="roulette-sidebar">
        <h2>{(appTheme === 'joquer' && isFixedMode) ? 'Opciones' : 'Participantes'}</h2>
        
        <form className="roulette-input-group" onSubmit={handleAdd}>
          <div className="roulette-input-row">
            <input 
              type="text" 
              placeholder={(appTheme === 'joquer' && isFixedMode) ? "Opción" : "Nombre del participante"} 
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            {!(appTheme === 'joquer' && isFixedMode) && (
              <input 
                type="number" 
                min="1" 
                placeholder="Oportunidades" 
                title="Oportunidades (Vidas)"
                value={newLives}
                onChange={(e) => setNewLives(e.target.value)}
              />
            )}
          </div>
          <button type="submit" className="btn" style={{width: '100%', marginTop: '0.5rem'}}>
            Agregar a la Ruleta
          </button>
        </form>

        <div className="roulette-list">
          {participants.length === 0 ? (
            <p style={{color: '#ccc', textAlign: 'center'}}>{(appTheme === 'joquer' && isFixedMode) ? 'No hay opciones aún.' : 'No hay participantes aún.'}</p>
          ) : (
            participants.map((p, idx) => (
              <div key={p.id} className="roulette-item">
                <div className="roulette-item-info">
                  <span className="roulette-item-name">
                    {(appTheme === 'joquer' && isFixedMode) ? `${idx + 1}. ` : ''}{p.name}
                  </span>
                  {!(appTheme === 'joquer' && isFixedMode) && (
                    <span className="roulette-item-lives">{p.lives} {p.lives === 1 ? 'vida' : 'vidas'}</span>
                  )}
                </div>
                <button 
                  className="action-btn" 
                  onClick={() => handleRemove(p.id)}
                  title={(appTheme === 'joquer' && isFixedMode) ? "Eliminar opción" : "Eliminar participante"}
                  style={{background: 'rgba(255,0,0,0.2)'}}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="roulette-main" style={{ position: 'relative' }}>
        <RouletteWheel 
          participants={participants} 
          rotation={rotation} 
          isSpinning={isSpinning}
          onSpin={handleSpin}
          appTheme={appTheme}
          isFixedMode={isFixedMode}
        />

        {winnerResult && appTheme === 'joquer' && isFixedMode && (
          <div className="joquer-wheel-winner">
            <h2>¡Salió!</h2>
            <h1>{winnerResult.name}</h1>
            <button className="btn" onClick={handleModalClose}>Continuar</button>
          </div>
        )}
      </div>

      {winnerResult && !(appTheme === 'joquer' && isFixedMode) && (
        <div className="winner-modal">
          <div className="winner-modal-content">
            <h2>🎉 ¡Salió en la ruleta! 🎉</h2>
            <h1>{winnerResult.name}</h1>
            {!(appTheme === 'joquer' && isFixedMode) && (
              <>
                <p className="lives-update">
                  Pierde 1 oportunidad... (Quedan {winnerResult.lives - 1})
                </p>
                {winnerResult.lives - 1 === 0 && (
                  <p style={{color: '#ff4757', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1rem'}}>
                    ☠️ ¡Ha sido eliminado de la ruleta!
                  </p>
                )}
              </>
            )}
            <button className="btn" onClick={handleModalClose} style={{fontSize: '1.2rem', padding: '1rem 2rem'}}>
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouletteMode;
