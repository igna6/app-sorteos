import React, { useState } from 'react';
import './TournamentBracket.css';

const TournamentBracket = ({ bracket, onAdvance, onUndoAdvance, onUpdatePlayer }) => {
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

  const renderSlot = (rIndex, mIndex, playerKey, player, winner) => {
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
            <button className="action-btn" onClick={handleSaveEdit} title="Guardar">💾</button>
            <button className="action-btn" onClick={handleCancelEdit} title="Cancelar">❌</button>
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
          <span className="slot-name">
            {player ? (player.isSubscriber ? `⭐ ${player.username}` : player.username) : 'Esperando...'}
          </span>
          {player && player.extraText && (
            <span className="slot-extra">{player.extraText}</span>
          )}
        </div>
        <div className="slot-right">
          {isWinner && <span className="winner-crown">👑</span>}
          {!winner && rIndex === 0 && (
            <button 
              className="edit-slot-btn" 
              onClick={(e) => startEdit(e, rIndex, mIndex, playerKey, player)}
              title="Editar manualmente"
            >
              ✏️
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
                  {renderSlot(rIndex, mIndex, 'player1', p1, winner)}
                  {renderSlot(rIndex, mIndex, 'player2', p2, winner)}
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
