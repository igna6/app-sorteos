const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { KickConnection } = require('kick-live-connector');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

let kickClient = null;
let currentWord = "";
let currentChannel = "";

io.on('connection', (socket) => {
  console.log('A client connected:', socket.id);

  socket.on('start_listening', ({ channel, keyword }) => {
    console.log(`Starting to listen on ${channel} for keyword: ${keyword}`);
    
    // Si ya habia uno, lo desconectamos
    if (kickClient) {
      try {
        kickClient.disconnect();
      } catch (e) {
        console.error("Error disconnecting previous client", e);
      }
    }

    currentChannel = channel;
    currentWord = keyword.trim().toLowerCase();

    // Iniciar KickLive Connector
    kickClient = new KickConnection(channel);

    kickClient.on('chatMessage', (message) => {
      // console.log(`[${channel}] ${message.sender.username}: ${message.content}`);
      const content = message.content.trim().toLowerCase();
      
      // Si el mensaje contiene la palabra clave (ignorando mayusculas/minusculas)
      if (content.includes(currentWord)) {
        // Emitimos al frontend que alguien ingreso la palabra
        io.emit('participant_joined', {
          id: message.sender.id,
          username: message.sender.username,
        });
      }
    });

    kickClient.on('connected', () => {
      console.log(`Successfully connected to ${channel}`);
      socket.emit('listening_started', { success: true, channel });
    });

    kickClient.on('error', (err) => {
      console.error(`Error connecting to Kick channel ${channel}:`, err);
      socket.emit('listening_started', { success: false, error: err.message });
    });

    // Conectar
    try {
      const connectPromise = kickClient.connect();
      if (connectPromise && typeof connectPromise.catch === 'function') {
        connectPromise.catch((err) => {
          console.error(`Promise rejection connecting to Kick channel ${channel}:`, err);
          socket.emit('listening_started', { success: false, error: typeof err === 'string' ? err : (err.message || 'Streamer is offline or error connecting') });
        });
      }
    } catch (err) {
      console.error(`Error connecting to Kick channel ${channel}:`, err);
      socket.emit('listening_started', { success: false, error: err.message || err });
    }
  });

  socket.on('stop_listening', () => {
    if (kickClient) {
      console.log('Stopping Kick listener...');
      try {
         kickClient.disconnect();
      } catch (e) {
        // ignore
      }
      kickClient = null;
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
