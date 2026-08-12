import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import './winner-animations.css';
import Logo from './Logo';
import TournamentBracket from './TournamentBracket';
import RouletteMode from './RouletteMode';
import ConstellationBackground from './ConstellationBackground';
import JoquerBackground from './JoquerBackground';
import './App.css';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

const DonationSection = () => (
  <div className="donation-container">
    <p className="donation-title">Donaciones</p>
    <div className="donation-details">
      <p className="alias-text" onClick={() => {
        navigator.clipboard.writeText('ignacio.bruzzesi.mp');
        alert('Alias copiado al portapapeles!');
      }}>ignacio.bruzzesi.mp</p>
    </div>
  </div>
);

function App() {
  const [channel, setChannel] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState('');
  const [activeWinner, setActiveWinner] = useState(null); // Para el overlay
  const [subMultiplier, setSubMultiplier] = useState(1); // Multiplicador de subs
  const [appTheme, setAppTheme] = useState('fox');
  const [themeSelected, setThemeSelected] = useState(false);
  
  // Tournament states
  const [isTournamentMode, setIsTournamentMode] = useState(false);
  const [tournamentSize, setTournamentSize] = useState(0);
  const [tournamentBracket, setTournamentBracket] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Roulette state
  const [isRouletteMode, setIsRouletteMode] = useState(false);
  
  // Custom Password Modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  
  const socketRef = useRef(null);



  useEffect(() => {
    const html = document.documentElement;
    html.classList.remove('chona-active', 'jack-active', 'joquer-active');
    
    if (appTheme === 'chona') {
      html.classList.add('chona-active');
    } else if (appTheme === 'jack') {
      html.classList.add('jack-active');
    } else if (appTheme === 'joquer') {
      html.classList.add('joquer-active');
    }
  }, [appTheme]);

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(SOCKET_URL);

    socketRef.current.on('listening_started', (data) => {
      if (data.success) {
        setIsListening(true);
        setError('');
      } else {
        setIsListening(false);
        setError(data.error || 'Error al conectar al canal.');
      }
    });

    socketRef.current.on('participant_joined', (user) => {
      setParticipants((prev) => {
        // Solo agregar si no esta en la lista (participan solo 1 vez)
        const alreadyExists = prev.some((p) => p.username === user.username);
        if (alreadyExists) return prev;
        
        // Tampoco agregarlo si ya es un ganador
        let isAlreadyWinner = false;
        setWinners((prevWinners) => {
          if (prevWinners.some((w) => w.username === user.username)) {
            isAlreadyWinner = true;
          }
          return prevWinners;
        });

        if (isAlreadyWinner) return prev;

        return [...prev, user];
      });
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleStart = () => {
    if (!channel || !keyword) {
      setError('Por favor, ingresa el ID del chatroom y la palabra clave');
      return;
    }
    setError('');
    socketRef.current.emit('start_listening', { roomId: channel, keyword });
  };

  const handleStop = () => {
    socketRef.current.emit('stop_listening');
    setIsListening(false);
  };

  const drawWinner = () => {
    if (participants.length === 0) return;

    // Crear un arreglo de "boletos" (tickets)
    let tickets = [];
    participants.forEach((p, index) => {
      let chances = 1; // Usuario normal tiene 1 chance
      if (p.isSubscriber) {
        chances = subMultiplier; // Suscriptor tiene X chances (0, 1, 2, 3...)
      }
      
      // Agregar el índice del participante tantas veces como chances tenga
      for (let i = 0; i < chances; i++) {
        tickets.push(index);
      }
    });

    if (tickets.length === 0) {
      alert("No hay participantes válidos (por ejemplo, si excluiste a los subs y todos son subs).");
      return;
    }

    // Pick a random winner from the tickets array
    const winningTicket = Math.floor(Math.random() * tickets.length);
    const randomIndex = tickets[winningTicket];
    const winner = participants[randomIndex];

    // Mostrar overlay
    setActiveWinner(winner);

    // Disparar confeti (estilo explosivo)
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.6 },
      colors: ['#ff2a2a', '#ffffff', '#000000']
    });

    // Mover de lista de participantes a ganadores inmediatamente por detrás
    setParticipants((prev) => prev.filter((_, i) => i !== randomIndex));
    setWinners((prev) => [...prev, winner]);

    // Ocultar overlay después de 5 segundos
    setTimeout(() => {
      setActiveWinner(null);
    }, 5000);
  };

  const removeParticipant = (index) => {
    setParticipants((prev) => prev.filter((_, i) => i !== index));
  };

  const moveWinnerToParticipants = (index) => {
    const winnerToMove = winners[index];
    // Eliminar de ganadores
    setWinners((prev) => prev.filter((_, i) => i !== index));
    // Agregar a participantes si no existe (por seguridad)
    setParticipants((prev) => {
      if (prev.some((p) => p.username === winnerToMove.username)) return prev;
      return [...prev, winnerToMove];
    });
  };

  const resetGiveaway = () => {
    if (window.confirm("¿Estás seguro de que quieres reiniciar el sorteo? Se borrarán todos los participantes y ganadores actuales.")) {
      setParticipants([]);
      setWinners([]);
    }
  };

  const generateEmptyBracket = (size) => {
    const rounds = [];
    let currentMatches = size / 2;
    while (currentMatches >= 1) {
      const round = [];
      for (let i = 0; i < currentMatches; i++) {
        round.push({ player1: null, player2: null, winner: null });
      }
      rounds.push(round);
      currentMatches = currentMatches / 2;
    }
    return rounds;
  };

  const startTournament = (size) => {
    setIsTournamentMode(true);
    setTournamentSize(size);
    setTournamentBracket(generateEmptyBracket(size));
    setIsMenuOpen(false);
  };

  const fillTournament = () => {
    if (participants.length < tournamentSize) {
      alert(`Necesitas al menos ${tournamentSize} participantes para iniciar este torneo. (Actuales: ${participants.length})`);
      return;
    }
    
    const shuffled = [...participants].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, tournamentSize);
    
    const newBracket = JSON.parse(JSON.stringify(tournamentBracket));
    const firstRound = newBracket[0];
    for (let i = 0; i < firstRound.length; i++) {
      firstRound[i].player1 = selected[i * 2];
      firstRound[i].player2 = selected[i * 2 + 1];
    }
    setTournamentBracket(newBracket);
  };

  const shuffleBracket = () => {
    const newBracket = JSON.parse(JSON.stringify(tournamentBracket));
    if (!newBracket[0]) return;
    
    // Extract all players from round 0
    let players = [];
    for (const match of newBracket[0]) {
      if (match.player1) players.push(match.player1);
      if (match.player2) players.push(match.player2);
    }
    
    // Shuffle
    players = players.sort(() => 0.5 - Math.random());
    
    // Put them back
    for (let i = 0; i < newBracket[0].length; i++) {
      newBracket[0][i].player1 = players[i * 2] || null;
      newBracket[0][i].player2 = players[i * 2 + 1] || null;
    }
    
    setTournamentBracket(newBracket);
  };

  const advanceTournament = (roundIndex, matchIndex, playerKey) => {
    const newBracket = JSON.parse(JSON.stringify(tournamentBracket));
    const match = newBracket[roundIndex][matchIndex];
    const winner = match[playerKey];
    
    if (!winner) return;
    
    match.winner = winner;
    
    if (roundIndex + 1 < newBracket.length) {
      const nextMatchIndex = Math.floor(matchIndex / 2);
      const isPlayer1 = matchIndex % 2 === 0;
      
      const nextMatch = newBracket[roundIndex + 1][nextMatchIndex];
      if (isPlayer1) {
        nextMatch.player1 = winner;
      } else {
        nextMatch.player2 = winner;
      }
      nextMatch.winner = null;
    } else {
      // It's the final round, celebrate the tournament winner!
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
    
    setTournamentBracket(newBracket);
  };

  const undoTournamentAdvance = (roundIndex, matchIndex) => {
    const newBracket = JSON.parse(JSON.stringify(tournamentBracket));
    const match = newBracket[roundIndex][matchIndex];
    const playerToUndo = match.winner;
    
    if (!playerToUndo) return;

    match.winner = null;
    
    let currentRound = roundIndex;
    let currentMatch = matchIndex;
    
    // Propagate the removal to subsequent rounds
    while (currentRound + 1 < newBracket.length) {
      const nextMatchIndex = Math.floor(currentMatch / 2);
      const isPlayer1 = currentMatch % 2 === 0;
      const nextMatch = newBracket[currentRound + 1][nextMatchIndex];
      
      const nextSlotPlayer = isPlayer1 ? nextMatch.player1 : nextMatch.player2;
      
      if (nextSlotPlayer && nextSlotPlayer.id === playerToUndo.id) {
        if (isPlayer1) nextMatch.player1 = null;
        else nextMatch.player2 = null;
        
        if (nextMatch.winner && nextMatch.winner.id === playerToUndo.id) {
           nextMatch.winner = null;
        } else {
           break;
        }
      } else {
        break;
      }
      
      currentRound++;
      currentMatch = nextMatchIndex;
    }

    setTournamentBracket(newBracket);
  };

  const updateTournamentPlayer = (roundIndex, matchIndex, playerKey, updatedData) => {
    const newBracket = JSON.parse(JSON.stringify(tournamentBracket));
    const match = newBracket[roundIndex][matchIndex];
    
    if (!match[playerKey]) {
      // If it was empty, create a new participant object
      match[playerKey] = { id: Date.now(), ...updatedData };
    } else {
      // If it exists, update it
      match[playerKey] = { ...match[playerKey], ...updatedData };
    }
    
    setTournamentBracket(newBracket);
  };

  if (!themeSelected) {
    return (
      <div className="theme-selector-container" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '28px', fontWeight: '900', fontFamily: "'Montserrat', sans-serif", letterSpacing: '1px', userSelect: 'none', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)' }}>
          IB.
        </div>
        <h1 className="theme-title">Elegí tu Temática</h1>
        <div className="theme-cards">
          <div className="theme-card fox-card" onClick={() => { setAppTheme('fox'); setThemeSelected(true); }}>
            <h2>EL DEL FOX</h2>
            <div className="theme-preview">
              <div className="vw-circle">
                <svg viewBox="0 0 150 150" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <g transform="translate(75, 75)">
                    <g transform="scale(1.4) translate(-75, -75)">
                      <path fill="#fff" d="M75,120.4c-24.9,0-45.3-20.5-45.3-45.4c0-5.6,1-10.9,2.9-15.9l26.5,53.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l12.2-27.3c0.1-0.3,0.3-0.6,0.6-0.6s0.4,0.3,0.6,0.6l12.2,27.3c0.3,0.7,0.8,1.3,1.6,1.3c0.8,0,1.3-0.6,1.6-1.3l26.5-53.3c1.9,5,2.9,10.3,2.9,15.9C120.3,99.9,99.9,120.4,75,120.4z M75,64.7c-0.3,0-0.4-0.3-0.6-0.6l-14.2-32c4.6-1.7,9.6-2.6,14.8-2.6c5.2,0,10.2,0.9,14.8,2.6l-14.2,32C75.4,64.5,75.3,64.7,75,64.7z M60.5,97.6c-0.3,0-0.4-0.3-0.6-0.6l-23-46.4c4.1-6.3,9.6-11.6,16.3-15.3l16.6,36.9C70,72.8,70.5,73,71,73h8c0.6,0,1-0.1,1.3-0.8l16.6-36.9c6.6,3.7,12.2,9,16.3,15.3L90,97c-0.1,0.3-0.3,0.6-0.6,0.6c-0.3,0-0.4-0.3-0.6-0.6l-8.7-19.8c-0.3-0.7-0.7-0.8-1.3-0.8h-8c-0.6,0-1,0.1-1.3,0.8L61.1,97C61,97.3,60.8,97.6,60.5,97.6z M75,125c27.7,0,50-22.3,50-50c0-27.7-22.3-50-50-50c-27.7,0-50,22.3-50,50C25,102.7,47.3,125,75,125z" />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
          
          <div className="theme-card chona-card" onClick={() => { setAppTheme('chona'); setThemeSelected(true); }}>
            <h2 className="chona-text">CHHONAA</h2>
            <div className="theme-preview">
              <img src="/boca.png" alt="Boca" className="boca-preview" />
            </div>
          </div>

          <div className="theme-card jack-card" onClick={() => { setAppTheme('jack'); setThemeSelected(true); }}>
            <h2 className="jack-text">JACK</h2>
            <div className="theme-preview">
              <div className="jack-svg-preview" style={{ width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 15px rgba(0,243,255,0.6))' }}>
                  <text x="50" y="85" textAnchor="middle" fill="#0b0f19" stroke="#00f3ff" strokeWidth="4" fontSize="100" fontFamily="'Anton', sans-serif" fontStyle="italic">
                    J
                  </text>
                  <text x="50" y="85" textAnchor="middle" fill="#111" fontSize="100" fontFamily="'Anton', sans-serif" fontStyle="italic">
                    J
                  </text>
                </svg>
              </div>
            </div>
          </div>
          <div 
            className="theme-card joquer-card" 
            onClick={() => { if (!showPasswordModal) setShowPasswordModal(true); }}
            style={{ cursor: showPasswordModal ? 'default' : 'pointer', padding: showPasswordModal ? '15px' : '' }}
          >
            {!showPasswordModal ? (
              <>
                <h2 className="joquer-text">JOQUER</h2>
                <div className="theme-preview" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <img src="/joquer_icon.png" alt="Joquer" className="joquer-preview-icon" style={{ width: '110px', height: 'auto', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                </div>
              </>
            ) : (
              <div className="inline-password-form" onClick={(e) => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>
                <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>🔒 Perfil Privado</h3>
                <input 
                  type="password" 
                  placeholder="Contraseña"
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (passwordInput === "joquertincho1122") {
                        setAppTheme('joquer');
                        setThemeSelected(true);
                        setShowPasswordModal(false);
                        setPasswordInput('');
                      } else {
                        alert("Contraseña incorrecta. Acceso denegado.");
                        setPasswordInput('');
                      }
                    }
                  }}
                  autoFocus
                  style={{
                    width: '80%', padding: '8px', borderRadius: '5px', border: '1px solid #555',
                    background: '#222', color: '#fff', textAlign: 'center', marginTop: '10px'
                  }}
                />
                <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                  <button onClick={() => { setShowPasswordModal(false); setPasswordInput(''); }} style={{ padding: '5px 10px', border: 'none', background: 'transparent', color: '#aaa', cursor: 'pointer' }}>Cancelar</button>
                  <button onClick={() => {
                    if (passwordInput === "joquertincho1122") {
                      setAppTheme('joquer');
                      setThemeSelected(true);
                      setShowPasswordModal(false);
                      setPasswordInput('');
                    } else {
                      alert("Contraseña incorrecta. Acceso denegado.");
                      setPasswordInput('');
                    }
                  }} style={{ padding: '5px 15px', border: 'none', background: '#fff', color: '#000', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</button>
                </div>
              </div>
            )}
          </div>
        </div>
        <DonationSection />
      </div>
    );
  }

  return (
    <div className={`app-container ${appTheme}-mode`}>
      <div style={{ position: 'fixed', top: '30px', left: '40px', fontSize: '28px', fontWeight: '900', fontFamily: "'Montserrat', sans-serif", letterSpacing: '1px', userSelect: 'none', color: '#fff', textShadow: '0 0 10px rgba(255,255,255,0.3)', zIndex: 9999 }}>
        IB.
      </div>
      {appTheme === 'jack' && <ConstellationBackground />}
      {appTheme === 'joquer' && <JoquerBackground />}
      <div className="top-bar">
        <div className="settings-menu-container">
          <button 
            className="settings-btn" 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ⚙️ Opciones
          </button>
          
          {isMenuOpen && (
            <div className="settings-dropdown">
              <button className="dropdown-action-btn" onClick={() => { setThemeSelected(false); setIsMenuOpen(false); }}>
                🔄 Cambiar Tema
              </button>
              
              <div className="dropdown-divider"></div>
              
              <p>OTROS MODOS</p>
              {!isRouletteMode ? (
                <button onClick={() => { setIsRouletteMode(true); setIsTournamentMode(false); setIsMenuOpen(false); }}>
                  🎡 Modo Ruleta
                </button>
              ) : (
                <button className="dropdown-action-btn danger-btn" onClick={() => { setIsRouletteMode(false); setIsMenuOpen(false); }}>
                  ❌ Desactivar Ruleta
                </button>
              )}

              <div className="dropdown-divider"></div>
              
              <p>FORMATO TORNEO</p>
              {!isTournamentMode ? (
                <div className="tournament-sizes">
                  <button onClick={() => { startTournament(32); setIsRouletteMode(false); }}>32 (16avos)</button>
                  <button onClick={() => { startTournament(16); setIsRouletteMode(false); }}>16 (8vos)</button>
                  <button onClick={() => { startTournament(8); setIsRouletteMode(false); }}>8 (4tos)</button>
                </div>
              ) : (
                <button className="dropdown-action-btn danger-btn" onClick={() => { setIsTournamentMode(false); setIsMenuOpen(false); }}>
                  ❌ Desactivar Torneo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="header">
        <Logo appTheme={appTheme} />
        <p>Sorteos en tiempo real con el chat de Kick</p>
      </div>

      {isRouletteMode ? (
        <RouletteMode />
      ) : (
        <>
          <div className="glass-panel setup-panel">
            <div className="input-group">
              <label>ID de Chatroom de Kick</label>
              <input 
                type="text" 
                placeholder="Ej: 1234567" 
                value={channel} 
                onChange={(e) => setChannel(e.target.value)}
                disabled={isListening}
              />
              <details className="id-help-details">
                <summary>ℹ️ ¿Cómo encontrar tu ID?</summary>
                <div className="id-help-content">
                  <ol>
                    <li>Abre el navegador web.</li>
                    <li>Visita <a href="https://kick.com/api/v2/channels/TU_CANAL" target="_blank" rel="noreferrer" style={{color: '#ff2a2a'}}>kick.com/api/v2/channels/TU_CANAL</a> (reemplaza TU_CANAL con tu usuario).</li>
                    <li>Verás código. Presiona <strong>Ctrl + F</strong> y busca la palabra <code>chatroom</code>.</li>
                    <li>Allí verás algo como <code>"chatroom":&#123;"id": 1234567&#125;</code>.</li>
                    <li>Copia <strong>SOLO el número</strong> y pégalo aquí.</li>
                  </ol>
                </div>
              </details>
            </div>
            <div className="input-group">
              <label htmlFor="keyword">Palabra Clave</label>
              <input
                id="keyword"
                type="text"
                placeholder="Ej. !sorteo"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                disabled={isListening}
              />
            </div>

            <div className="input-group">
              <label>Ventaja para Suscriptores (Multiplicador)</label>
              <div className="multiplier-options">
                <button 
                  className={`multiplier-btn ${subMultiplier === 1 ? 'active' : ''}`}
                  onClick={() => setSubMultiplier(1)}
                  disabled={isListening}
                >x1</button>
                <button 
                  className={`multiplier-btn ${subMultiplier === 2 ? 'active' : ''}`}
                  onClick={() => setSubMultiplier(2)}
                  disabled={isListening}
                >x2</button>
                <button 
                  className={`multiplier-btn ${subMultiplier === 3 ? 'active' : ''}`}
                  onClick={() => setSubMultiplier(3)}
                  disabled={isListening}
                >x3</button>
                <button 
                  className={`multiplier-btn ${subMultiplier === 5 ? 'active' : ''}`}
                  onClick={() => setSubMultiplier(5)}
                  disabled={isListening}
                >x5</button>
                <button 
                  className={`multiplier-btn ${subMultiplier === 0 ? 'active' : ''}`}
                  onClick={() => setSubMultiplier(0)}
                  disabled={isListening}
                >x0 (Excluir)</button>
              </div>
            </div>

            {error && <p style={{ color: '#ff4444', fontSize: '0.9rem', textAlign: 'center' }}>{error}</p>}
            {isListening && <p style={{ color: 'var(--primary-color)', fontSize: '1rem', textAlign: 'center', fontWeight: '600' }}>✅ ¡Conectado al chat de {channel}!</p>}

            {!isListening ? (
              <button className="btn" onClick={handleStart}>
                Conectar y Escuchar
              </button>
            ) : (
              <button className="btn btn-secondary" onClick={handleStop}>
                Detener Sorteo
              </button>
            )}
            
            {(participants.length > 0 || winners.length > 0) && (
              <button 
                className="btn btn-secondary" 
                style={{ borderColor: 'rgba(255, 68, 68, 0.5)', color: '#ff4444' }} 
                onClick={resetGiveaway}
              >
                Reiniciar Sorteo (Borrar Todo)
              </button>
            )}
          </div>

          <div className="content-grid">
            <div className="glass-panel">
              <div className="list-header">
                <h2>Participantes</h2>
                <span className="badge">{participants.length}</span>
              </div>
              
              <div className="participants-list">
                {participants.length === 0 ? (
                  <div className="empty-state">
                    Esperando a que los espectadores escriban la palabra clave...
                  </div>
                ) : (
                  participants.map((p, index) => (
                    <div key={p.id || index} className={`participant-item ${p.isSubscriber ? 'is-sub' : ''}`}>
                      <span>{p.isSubscriber ? '⭐ ' : ''}{p.username}</span>
                      <button 
                        className="action-btn" 
                        onClick={() => removeParticipant(index)}
                        title="Eliminar de la lista"
                      >
                        🗑️
                      </button>
                    </div>
                  ))
                )}
              </div>

              <button 
                className="btn" 
                style={{ width: '100%', marginTop: '1.5rem' }}
                onClick={drawWinner}
                disabled={participants.length === 0}
              >
                Sortear Ganador 🎁
              </button>
            </div>

            {!isTournamentMode ? (
              <div className="glass-panel">
                <div className="list-header">
                  <h2>Ganadores</h2>
                  <span className="badge">{winners.length}</span>
                </div>
                
                <div className="participants-list">
                  {winners.length === 0 ? (
                    <div className="empty-state">
                      Aún no hay ganadores.
                    </div>
                  ) : (
                    winners.map((w, index) => (
                      <div key={`win-${w.id || index}`} className={`winner-item ${w.isSubscriber ? 'is-sub-winner' : ''}`}>
                        <div className="winner-number">{index + 1}</div>
                        <span>{w.isSubscriber ? '⭐ ' : ''}{w.username}</span>
                        <button 
                          className="action-btn" 
                          onClick={() => moveWinnerToParticipants(index)}
                          title="Volver a los participantes"
                        >
                          ➕
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-panel tournament-panel">
                <div className="list-header">
                  <h2>Torneo de {tournamentSize}</h2>
                  <button className="btn" onClick={fillTournament}>
                    Llenar Llaves 🎲
                  </button>
                </div>
                <p style={{fontSize: '0.9rem', color: '#ccc', marginBottom: '1rem'}}>
                  Haz clic en el participante que quieres que avance a la siguiente ronda.
                </p>
              </div>
            )}
          </div>
          
          {isTournamentMode && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              {tournamentBracket.length > 0 && 
               tournamentBracket[0].some(m => m.player1 || m.player2) && 
               !tournamentBracket[0].some(m => m.winner) &&
               (!tournamentBracket[1] || !tournamentBracket[1].some(m => m.player1 || m.player2)) && (
                <button className="btn btn-secondary" onClick={shuffleBracket} style={{ marginBottom: '1rem', width: 'auto', padding: '10px 20px', fontSize: '1.1rem' }}>
                  Mezclar Llaves 🔀
                </button>
              )}
              <TournamentBracket 
                bracket={tournamentBracket} 
                onAdvance={advanceTournament} 
                onUndoAdvance={undoTournamentAdvance}
                onUpdatePlayer={updateTournamentPlayer} 
              />
            </div>
          )}

          {/* Overlay de la animación del ganador */}
          {activeWinner && (
            <div className="winner-overlay">
              <div className="neon-winner-text">
                {activeWinner.username}
              </div>
            </div>
          )}
        </>
      )}

      <DonationSection />
    </div>
  );
}

export default App;
