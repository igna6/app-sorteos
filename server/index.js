const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { KickConnection } = require('./kick');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store connections per socket ID
const clientConnections = new Map();

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('start_listening', ({ roomId, keyword }) => {
    console.log(`Starting to listen on room ${roomId} for keyword: ${keyword} [Socket: ${socket.id}]`);
    
    // Si este socket ya tenia una conexion, la desconectamos
    if (clientConnections.has(socket.id)) {
      try {
        clientConnections.get(socket.id).kickClient.disconnect();
      } catch (e) {
        console.error("Error disconnecting previous client", e);
      }
    }

    const currentWord = keyword.trim().toLowerCase();

    // Iniciar KickLive Connector con el ID
    const kickClient = new KickConnection(roomId);
    
    // Guardar estado del cliente
    clientConnections.set(socket.id, {
      kickClient,
      currentWord,
      currentChannel: roomId
    });

    kickClient.on('chatMessage', (message) => {
      const content = message.content.trim();
      const lowerContent = content.toLowerCase();
      
      // Emit every message for verification feature only to THIS socket
      socket.emit('chat_message', {
        id: message.id,
        username: message.sender.username,
        content: content,
        timestamp: message.createdAt
      });
      
      // Si el mensaje contiene la palabra clave (ignorando mayusculas/minusculas)
      // Usamos el currentWord especifico de esta conexion
      const connectionData = clientConnections.get(socket.id);
      if (connectionData && lowerContent.includes(connectionData.currentWord)) {
        
        // Detectar si el usuario es suscriptor o VIP/fundador
        let isSubscriber = false;
        if (message.sender.identity && Array.isArray(message.sender.identity.badges)) {
          console.log(`[DEBUG] Badges para ${message.sender.username}:`, JSON.stringify(message.sender.identity.badges));
          isSubscriber = message.sender.identity.badges.some(badge => 
            (badge.type && badge.type.toLowerCase().includes('sub')) || badge.type === 'founder'
          );
        }

        // Emitimos al frontend que alguien ingreso la palabra, solo a ESTE socket
        socket.emit('participant_joined', {
          id: message.sender.id,
          username: message.sender.username,
          isSubscriber: isSubscriber
        });
      }
    });

    kickClient.on('connected', () => {
      console.log(`Successfully connected to room ${roomId}`);
      socket.emit('listening_started', { success: true, channel: roomId });
    });

    kickClient.on('error', (err) => {
      console.error(`Error connecting to Kick room ${roomId}:`, err);
      socket.emit('listening_started', { success: false, error: err.message });
    });

    // Conectar
    try {
      const connectPromise = kickClient.connect();
      if (connectPromise && typeof connectPromise.catch === 'function') {
        connectPromise.catch((err) => {
          console.error(`Promise rejection connecting to Kick room ${roomId}:`, err);
          socket.emit('listening_started', { success: false, error: typeof err === 'string' ? err : (err.message || 'Streamer is offline or error connecting') });
        });
      }
    } catch (err) {
      console.error(`Error connecting to Kick room ${roomId}:`, err);
      socket.emit('listening_started', { success: false, error: err.message || err });
    }
  });

  socket.on('stop_listening', () => {
    if (clientConnections.has(socket.id)) {
      console.log(`Stopping Kick listener for socket ${socket.id}...`);
      try {
         clientConnections.get(socket.id).kickClient.disconnect();
      } catch (e) {
        // ignore
      }
      clientConnections.delete(socket.id);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (clientConnections.has(socket.id)) {
      try {
         clientConnections.get(socket.id).kickClient.disconnect();
      } catch (e) {
        // ignore
      }
      clientConnections.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
