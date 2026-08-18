const fs = require('fs');
let data = fs.readFileSync('client/src/App.jsx', 'utf8');

// Add states
data = data.replace(
  "const [subMultiplier, setSubMultiplier] = useState(1); // Multiplicador de subs",
  "const [subMultiplier, setSubMultiplier] = useState(1); // Multiplicador de subs\n  const [isActiveModeEnabled, setIsActiveModeEnabled] = useState(false);\n  const [activeTimeLimit, setActiveTimeLimit] = useState(5);"
);

// Add setInterval in useEffect
const intervalCode = `
  useEffect(() => {
    if (!isActiveModeEnabled) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const limitMs = activeTimeLimit * 60000;
      setParticipants(prev => prev.filter(p => now - (p.lastActiveAt || now) <= limitMs));
    }, 5000);
    return () => clearInterval(interval);
  }, [isActiveModeEnabled, activeTimeLimit]);
`;

data = data.replace(
  "useEffect(() => {\n    const limit = verificationTimeLimit === '' ? 30 : verificationTimeLimit;",
  intervalCode + "\n  useEffect(() => {\n    const limit = verificationTimeLimit === '' ? 30 : verificationTimeLimit;"
);

// Modify participant_joined
data = data.replace(
  /socketRef\.current\.on\('participant_joined', \(user\) => \{[\s\S]*?return \[\.\.\.prev, user\];\n\s*\}\);\n\s*\}\);/m,
  `socketRef.current.on('participant_joined', (user) => {
      setParticipants((prev) => {
        const alreadyExists = prev.some((p) => p.username === user.username);
        if (alreadyExists) {
          const updated = [...prev];
          const idx = updated.findIndex(p => p.username === user.username);
          updated[idx] = { ...updated[idx], lastActiveAt: Date.now() };
          return updated;
        }
        
        if (winnersRef.current.some(w => w.username === user.username)) return prev;

        return [...prev, { ...user, lastActiveAt: Date.now() }];
      });
    });`
);

// Add chat_message lastActiveAt updater
data = data.replace(
  "socketRef.current.on('chat_message', (msg) => {",
  `socketRef.current.on('chat_message', (msg) => {
      setParticipants(prev => {
        const idx = prev.findIndex(p => p.username === msg.username);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], lastActiveAt: Date.now() };
          return updated;
        }
        return prev;
      });`
);

// Add UI
data = data.replace(
  `            <div className="input-group">
              <label>Ventaja para Suscriptores (Multiplicador)</label>`,
  `            <div className="input-group">
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
                  style={{ width: '60px', padding: '5px' }}
                  disabled={!isActiveModeEnabled || isListening}
                />
                <span style={{ fontSize: '0.9rem', color: '#fff' }}>min</span>
              </div>
            </div>

            <div className="input-group">
              <label>Ventaja para Suscriptores (Multiplicador)</label>`
);

fs.writeFileSync('client/src/App.jsx', data);
console.log("Replaced");
