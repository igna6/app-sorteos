import React, { useState } from 'react';
import { Save, X, Star, Trophy, Pencil } from 'lucide-react';
import './TournamentBracket.css';

const TournamentBracket = ({ appTheme, bracket, onAdvance, onUndoAdvance, onUpdatePlayer }) => {
  const [editingSlot, setEditingSlot] = useState(null); // { rIndex, mIndex, playerKey }
  const [editName, setEditName] = useState('');
  const [editExtra, setEditExtra] = useState('');

  if (!bracket || bracket.length === 0) return null;

  const startEdit = (e, rIndex, mIndex, playerKey, player) => {
    e.stopPropagation(); // prevent advancing
    setEditingSlot({ rIndex, mIndex, playerKey });
    setEditName(player ? player.username : '');
    setEditExtra(player && player.extraText ? player.extraText : '');
  };

  const handleSaveEdit = (e) => {
    e.stopPropagation();
    if (!editingSlot) return;
    
    if (editName.trim() !== '') {
      onUpdatePlayer(editingSlot.rIndex, editingSlot.mIndex, editingSlot.playerKey, {
        username: editName.trim(),
        extraText: editExtra.trim()
      });
    }
    setEditingSlot(null);
  };

  const handleCancelEdit = (e) => {
    e.stopPropagation();
    setEditingSlot(null);
  };

  const handleScoreBlur = (e, rIndex, mIndex, playerKey, match) => {
    e.stopPropagation();
    const scoreVal = parseInt(e.target.value, 10);
    if (isNaN(scoreVal)) return;

    onUpdatePlayer(rIndex, mIndex, playerKey, { score: scoreVal });

    // Automatic evaluation
    const otherKey = playerKey === 'player1' ? 'player2' : 'player1';
    const otherPlayer = match[otherKey];
    
    // Use the newly inputted score for the current player
    const p1Score = playerKey === 'player1' ? scoreVal : (match.player1?.score !== undefined ? match.player1.score : null);
    const p2Score = playerKey === 'player2' ? scoreVal : (match.player2?.score !== undefined ? match.player2.score : null);

    // If both scores are present, evaluate
    if (p1Score !== null && p2Score !== null) {
      if (p1Score > p2Score) {
        onAdvance(rIndex, mIndex, 'player1');
      } else if (p2Score > p1Score) {
        onAdvance(rIndex, mIndex, 'player2');
      } else {
        alert("¡Hay un empate en las cantidades! Ajustá un número para desempatar.");
      }
    }
  };

  const renderSlot = (rIndex, mIndex, playerKey, player, winner, match) => {
    const isWinner = winner && player && winner.id === player.id;
    const isLoser = winner && (!player || winner.id !== player.id);
    const isEditing = editingSlot && 
                      editingSlot.rIndex === rIndex && 
                      editingSlot.mIndex === mIndex && 
                      editingSlot.playerKey === playerKey;

    if (isEditing) {
      return (
        <div className="bracket-slot edit-mode" onClick={(e) => e.stopPropagation()}>
          <div className="edit-inputs">
            <input 
              type="text" 
              placeholder="Nombre" 
              value={editName} 
              onChange={(e) => setEditName(e.target.value)}
              autoFocus
            />
            <input 
              type="text" 
              placeholder="Info Extra (opcional)" 
              value={editExtra} 
              onChange={(e) => setEditExtra(e.target.value)}
            />
          </div>
          <div className="edit-actions">
            <button className="action-btn" onClick={handleSaveEdit} title="Guardar"><Save size={16} /></button>
            <button className="action-btn" onClick={handleCancelEdit} title="Cancelar"><X size={16} /></button>
          </div>
        </div>
      );
    }

    return (
      <div 
        className={`bracket-slot ${!player ? 'empty-slot' : ''} ${isWinner ? 'is-winner' : (isLoser ? 'is-loser' : '')}`}
        onClick={() => {
          if (isWinner) {
            if (onUndoAdvance) onUndoAdvance(rIndex, mIndex);
          } else if (player && !winner) {
            // Let the player advance even if there is no opponent (e.g. a bye)
            onAdvance(rIndex, mIndex, playerKey);
          }
        }}
      >
        <div className="slot-info">
          <span className="slot-name" style={{ display: 'flex', alignItems: 'center' }}>
            {player ? (
              <>
                {player.isSubscriber && <Star size={14} fill="#f9b233" color="#f9b233" style={{ marginRight: '6px' }} />}
                {player.username}
              </>
            ) : 'Esperando...'}
          </span>
          {player && player.extraText && (
            <span className="slot-extra">{player.extraText}</span>
          )}
        </div>
        <div className="slot-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {appTheme === 'joquer' && player && !winner && (
            <input 
              type="number" 
              placeholder="0"
              defaultValue={player.score !== undefined ? player.score : ''}
              onBlur={(e) => handleScoreBlur(e, rIndex, mIndex, playerKey, match)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.target.blur();
                }
              }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '60px', padding: '4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.5)', color: '#fff', textAlign: 'center', fontSize: '14px'
              }}
            />
          )}
          {appTheme === 'joquer' && player && winner && player.score !== undefined && (
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: isWinner ? '#4CAF50' : '#ff4757', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: '4px' }}>
              {player.score}
            </span>
          )}
          {isWinner && <span className="winner-crown"><Trophy size={16} color="#f9b233" /></span>}
          {!winner && rIndex === 0 && (
            <button 
              className="edit-slot-btn" 
              onClick={(e) => startEdit(e, rIndex, mIndex, playerKey, player)}
              title="Editar manualmente"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="tournament-container">
      <div className="bracket-scroll-area">
        {bracket.map((round, rIndex) => (
          <div key={`round-${rIndex}`} className="bracket-round">
            {round.map((match, mIndex) => {
              const p1 = match.player1;
              const p2 = match.player2;
              const winner = match.winner;
              
              const isP1Winner = winner && p1 && winner.id === p1.id;
              const isP2Winner = winner && p2 && winner.id === p2.id;
              
              return (
                <div key={`match-${rIndex}-${mIndex}`} className="bracket-match">
                  {renderSlot(rIndex, mIndex, 'player1', p1, winner, match)}
                  {renderSlot(rIndex, mIndex, 'player2', p2, winner, match)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentBracket;
