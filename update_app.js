const fs = require('fs');
let code = fs.readFileSync('client/src/App.jsx', 'utf8');

// 1. Add states
code = code.replace(
  "const [subMultiplier, setSubMultiplier] = useState(1); // Multiplicador de subs",
  "const [subMultiplier, setSubMultiplier] = useState(1); // Multiplicador de subs\n  const [isActiveModeEnabled, setIsActiveModeEnabled] = useState(false);\n  const [activeTimeLimit, setActiveTimeLimit] = useState(5);"
);

// 2. Add UI
const uiStr = `            <div className="input-group">
              <label>Limpieza Automática de Inactivos</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input 
                  type="checkbox" 
                  checked={isActiveModeEnabled}
                  onChange={(e) => setIsActiveModeEnabled(e.target.checked)}
                  style={{ width: 'auto' }}
                  disabled={isListening}
                />
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>Eliminar si no escriben en</span>
                <input 
                  type="number" 
                  value={activeTimeLimit}
                  onChange={(e) => setActiveTimeLimit(Number(e.target.value))}
                  min="1"
                  style={{ width: '60px', padding: '5px', backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', borderRadius: '4px' }}
                  disabled={!isActiveModeEnabled || isListening}
                />
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>min</span>
              </div>
            </div>

            <div className="input-group">
              <label>Ventaja para Suscriptores (Multiplicador)</label>`;

code = code.replace(
  `            <div className="input-group">
              <label>Ventaja para Suscriptores (Multiplicador)</label>`,
  uiStr
);

// 3. Add useEffect
const effectStr = `  useEffect(() => {
    if (!isActiveModeEnabled || isListening === false) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const limitMs = activeTimeLimit * 60000;
      setParticipants(prev => prev.filter(p => now - (p.lastActiveAt || now) <= limitMs));
    }, 5000);
    return () => clearInterval(interval);
  }, [isActiveModeEnabled, activeTimeLimit, isListening]);

  useEffect(() => {
    const limit = verificationTimeLimit === '' ? 30 : verificationTimeLimit;`;

code = code.replace(
  `  useEffect(() => {
    const limit = verificationTimeLimit === '' ? 30 : verificationTimeLimit;`,
  effectStr
);

// 4. Update participant_joined
code = code.replace(
  `      socketRef.current.on('participant_joined', (user) => {
        setParticipants((prev) => {
          // Solo agregar si no esta en la lista (participan solo 1 vez)
          const alreadyExists = prev.some((p) => p.username === user.username);
          if (alreadyExists) return prev;
          
          // Tampoco agregarlo si ya es un ganador
          if (winnersRef.current.some(w => w.username === user.username)) return prev;

          return [...prev, user];
        });
      });`,
  `      socketRef.current.on('participant_joined', (user) => {
        setParticipants((prev) => {
          const alreadyExists = prev.some((p) => p.username === user.username);
          if (alreadyExists) {
            const updated = [...prev];
            const idx = updated.findIndex((p) => p.username === user.username);
            updated[idx] = { ...updated[idx], lastActiveAt: Date.now() };
            return updated;
          }
          
          if (winnersRef.current.some(w => w.username === user.username)) return prev;

          return [...prev, { ...user, lastActiveAt: Date.now() }];
        });
      });`
);

// 5. Update chat_message
code = code.replace(
  `      socketRef.current.on('chat_message', (msg) => {
        // Si el ganador esta activo y el mensaje es de el`,
  `      socketRef.current.on('chat_message', (msg) => {
        // Actualizar actividad si estan en la lista
        setParticipants(prev => {
          const idx = prev.findIndex(p => p.username === msg.username);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...updated[idx], lastActiveAt: Date.now() };
            return updated;
          }
          return prev;
        });

        // Si el ganador esta activo y el mensaje es de el`
);

fs.writeFileSync('client/src/App.jsx', code);
console.log("Success");
