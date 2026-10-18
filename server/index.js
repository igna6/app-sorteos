const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { KickConnection } = require('./kick');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// ============================================
// CONEXIÓN AL CHAT (CENTRIFUGO / KICK.JS)
// ============================================
const activeSockets = new Map();

io.on('connection', (socket) => {
  console.log('Cliente conectado con Socket ID:', socket.id);

  socket.on('start_listening', async (payload = {}) => {
    const inputChannel = String(payload.roomId || '').trim();
    const keyword = typeof payload.keyword === 'string' ? payload.keyword.trim().toLowerCase() : '';

    if (!inputChannel) {
      socket.emit('listening_started', { success: false, error: 'Falta el nombre o ID del canal.' });
      return;
    }

    if (activeSockets.has(socket.id)) {
      try { activeSockets.get(socket.id).disconnect(); } catch (e) { }
      activeSockets.delete(socket.id);
    }

    let chatroomId = inputChannel;
    let channelId = null;

    if (isNaN(inputChannel)) {
      console.log(`Buscando ID numérico para el streamer: ${inputChannel}...`);
      try {
        const res = await fetch(`https://kick.com/api/v2/channels/${inputChannel}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        if (!res.ok) throw new Error('Canal no encontrado');
        const data = await res.json();
        chatroomId = data.chatroom.id;
        channelId = data.id;
        console.log(`ID encontrado correctamente: ${chatroomId}`);
      } catch (err) {
        console.error("Error buscando el canal:", err.message);
        socket.emit('listening_started', { success: false, error: 'No se pudo encontrar el ID del canal. Escribe el número manualmente.' });
        return;
      }
    }

    // Kick ya no usa Pusher: el chat va por Centrifugo. kick.js se encarga del handshake
    // (negociacion, token, socket, suscripcion, pings y renovacion de token).
    const kick = new KickConnection(chatroomId, { channelId });

    kick.on('chatMessage', (chatData) => {
      try {
        const msgId = chatData.id;
        const content = chatData.content;
        const sender = chatData.sender;

        if (!sender || !content) return;

        const username = sender.username || 'Usuario';
        const userId = sender.id;
        const badges = sender.identity?.badges || [];
        const isSubscriber = badges.some(b => String(b?.type || '').toLowerCase().includes('sub'));

        console.log(`[Chat en vivo] ${username}: ${content}`);

        socket.emit('chat_message', {
          id: msgId,
          username,
          content,
          timestamp: chatData.created_at || chatData.createdAt || new Date().toISOString()
        });

        const matchesKeyword = keyword === '' || content.toLowerCase().includes(keyword);
        if (matchesKeyword) {
          console.log(`[SORTEO] Participante válido: ${username}`);
          socket.emit('participant_joined', { id: userId, username, isSubscriber });
        }
      } catch (err) {
        console.error('[Kick] Error procesando mensaje:', err.message);
      }
    });

    // IMPORTANTE: sin un listener de 'error', un error posterior tumbaria todo el proceso.
    kick.on('error', (err) => {
      console.error('[Kick] Error:', err && err.message ? err.message : err);
    });

    kick.on('disconnected', () => {
      console.log(`[Kick] Conexión cerrada para Chatroom ${chatroomId}`);
    });

    activeSockets.set(socket.id, kick);

    kick.connect()
      .then(() => {
        console.log(`[Kick] Suscrito al Chatroom ${chatroomId} con éxito. ¡Listo para leer mensajes!`);
        socket.emit('listening_started', { success: true, channel: inputChannel });
      })
      .catch((err) => {
        console.error('[Kick] No se pudo conectar al chat:', err && err.message ? err.message : err);
        if (activeSockets.get(socket.id) === kick) activeSockets.delete(socket.id);
        socket.emit('listening_started', {
          success: false,
          error: 'No se pudo conectar al chat de Kick: ' + (err && err.message ? err.message : 'error desconocido')
        });
      });
  });

  socket.on('stop_listening', () => {
    if (activeSockets.has(socket.id)) {
      try { activeSockets.get(socket.id).disconnect(); } catch (e) { }
      activeSockets.delete(socket.id);
      console.log(`[Kick] Escucha detenida manualmente.`);
    }
  });

  socket.on('disconnect', () => {
    if (activeSockets.has(socket.id)) {
      try { activeSockets.get(socket.id).disconnect(); } catch (e) { }
      activeSockets.delete(socket.id);
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Servidor de Sorteos (Motor Centrifugo) iniciado en el puerto ${PORT}.`);
});