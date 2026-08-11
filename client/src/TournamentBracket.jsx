import React from 'react';
import './TournamentBracket.css';

const TournamentBracket = ({ bracket, onAdvance }) => {
  if (!bracket || bracket.length === 0) return null;

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
                  <div 
                    className={`bracket-slot ${!p1 ? 'empty-slot' : ''} ${isP1Winner ? 'is-winner' : (winner ? 'is-loser' : '')}`}
                    onClick={() => {
                      if (p1 && !winner && p2) onAdvance(rIndex, mIndex, 'player1');
                    }}
                  >
                    <span className="slot-name">
                      {p1 ? (p1.isSubscriber ? `⭐ ${p1.username}` : p1.username) : 'Esperando...'}
                    </span>
                    {isP1Winner && <span className="winner-crown">👑</span>}
                  </div>
                  
                  <div 
                    className={`bracket-slot ${!p2 ? 'empty-slot' : ''} ${isP2Winner ? 'is-winner' : (winner ? 'is-loser' : '')}`}
                    onClick={() => {
                      if (p2 && !winner && p1) onAdvance(rIndex, mIndex, 'player2');
                    }}
                  >
                    <span className="slot-name">
                      {p2 ? (p2.isSubscriber ? `⭐ ${p2.username}` : p2.username) : 'Esperando...'}
                    </span>
                    {isP2Winner && <span className="winner-crown">👑</span>}
                  </div>
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
