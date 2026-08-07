import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import './winner-animations.css';

const SOCKET_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

function App() {
  const [channel, setChannel] = useState('');
  const [keyword, setKeyword] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [winners, setWinners] = useState([]);
  const [error, setError] = useState('');
  const [activeWinner, setActiveWinner] = useState(null); // Para el overlay
  const [subMultiplier, setSubMultiplier] = useState(1); // Multiplicador de subs
  const socketRef = useRef(null);

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
      setError('Por favor, ingresa el canal y la palabra clave.');
      return;
    }
    setError('');
    socketRef.current.emit('start_listening', { channel, keyword });
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

  return (
    <div className="app-container">
      <div className="header">
        <img src="/logo.png" alt="El del Fox Giveaway" className="main-logo" />
        <p>Sorteos en tiempo real con el chat de Kick</p>
      </div>

      <div className="glass-panel setup-panel">
        <div className="input-group">
          <label htmlFor="channel">Nombre del Canal</label>
          <input
            id="channel"
            type="text"
            placeholder="Ej. mi_canal_kick"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            disabled={isListening}
          />
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
      </div>

      {/* Overlay de la animación del ganador */}
      {activeWinner && (
        <div className="winner-overlay">
          <div className="neon-winner-text">
            {activeWinner.username}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
