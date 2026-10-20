'use strict';

const WebSocket = require('ws');
const events = require('events');
const crypto = require('crypto');

const Events = {
  ChatMessage: "chatMessage",
  MessageDeleted: "messageDeleted",
  PinnedMessageCreated: "pinnedMessageCreated",
  PinnedMessageDeleted: "pinnedMessageDeleted",
  PollUpdate: "pollUpdate",
  PollDelete: "pollDelete",
  UserBanned: "userBanned",
  UserUnBanned: "userUnBanned",
  Subscription: "subscription",
  GiftedSubscriptions: "giftedSubscriptions",
  LuckyUsersWhoGotGiftSubscriptions: "luckyUsersWhoGotGiftSubscriptions",
  GiftsLeaderboardUpdated: "giftsLeaderboardUpdated",
  ChatMoveToSupportedChannel: "chatMoveToSupportedChannel",
  StreamHost: "streamHost",
  ChatroomClear: "chatroomClear",
  StreamEnd: "streamEnd",
  StreamerIsLive: "streamerIsLive",
  ViewerCount: "viewerCount",
  Connected: "connected",
  Disconnected: "disconnected",
  Error: "error"
};

// Kick ya no usa Pusher para el chat. El cliente web hace esto (ver README del PR):
//   1. POST /api/v1/realtime/connection            -> negocia el proveedor (centrifugo)
//   2. POST /api/v1/realtime/auth/connection       -> devuelve un JWT (anonimo = "guest:<uuid>")
//   3. POST /api/v1/realtime/channels/<id>/chat/connection (opcional aca, necesita el ID del *canal*)
//   4. Socket Centrifugo: connect (con el JWT) -> subscribe a chatrooms.<room>.v2
//
// Variables de entorno opcionales (por si Kick cambia algo sin tocar codigo):
//   KICK_API_BASE   base de la API de negociacion (por defecto https://web.kick.com)
//   KICK_WS_URL     URL del websocket (pisa la que devuelve la negociacion)
//   KICK_USER_AGENT User-Agent a enviar
//   KICK_DEBUG=1    loguea las respuestas de negociacion y los frames que no se reconocen
//   KICK_SUBSCRIBE_TIMEOUT_MS  tiempo maximo para completar todo el handshake
const API_BASE = process.env.KICK_API_BASE || 'https://web.kick.com';
const WS_URL_OVERRIDE = process.env.KICK_WS_URL || null;
const DEFAULT_WS_URL = 'wss://realtime.us-west-2.platform.kick.com/connection/websocket';
const ORIGIN = 'https://kick.com';
const USER_AGENT = process.env.KICK_USER_AGENT ||
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const CONNECT_TIMEOUT_MS = Number(process.env.KICK_SUBSCRIBE_TIMEOUT_MS) || 15000;
const DEBUG = process.env.KICK_DEBUG === '1';

function debug(...args) {
  if (DEBUG) console.log('[kick:debug]', ...args.map((a) => {
    const s = typeof a === 'string' ? a : JSON.stringify(a);
    return s && s.length > 400 ? s.slice(0, 400) + '...' : s;
  }));
}

async function postJson(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      origin: ORIGIN,
      referer: `${ORIGIN}/`,
      'x-app-platform': 'web',
      'user-agent': USER_AGENT
    },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Kick respondio ${res.status} en ${path}: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    return {};
  }
}

// Busca recursivamente el primer string que cumpla la condicion.
function findString(obj, test) {
  if (typeof obj === 'string') return test(obj) ? obj : null;
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      const found = findString(obj[key], test);
      if (found) return found;
    }
  }
  return null;
}

const findWsUrl = (obj) => findString(obj, (s) => /^wss?:\/\//i.test(s));

function findToken(obj) {
  if (!obj) return null;
  if (typeof obj.token === 'string') return obj.token;
  if (obj.data && typeof obj.data.token === 'string') return obj.data.token;
  return findString(obj, (s) => s.length > 40 && /^[\w-]+\.[\w-]+\.[\w-]+$/.test(s));
}

class KickConnection extends events.EventEmitter {
  // roomId: ID del chatroom (el mismo que ya usa la app).
  // options.channelId: ID del *canal* (opcional). Si lo pasas, se llama al endpoint
  // chat/connection como hace la web de Kick.
  constructor(roomId, options = {}) {
    super();
    this.roomId = roomId;
    this.channelId = options.channelId || null;
    this.websocket = null;
    this.clientId = null;
    this.token = null;
    this._seq = 0;
    this._pending = new Map();
    this._settled = false;
    this._closing = false;
    this._timer = null;
    this._refreshTimer = null;
    this._reconnectTimer = null;
    this._resolve = null;
    this._reject = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this._settled = false;
      this._closing = false;
      this._resolve = resolve;
      this._reject = reject;

      this._timer = setTimeout(() => {
        this._fail(new Error(
          `Kick no confirmo la suscripcion al chat ${this.roomId} en ${CONNECT_TIMEOUT_MS / 1000}s. ` +
          `Puede que el protocolo haya cambiado de nuevo o que el ID del chatroom sea incorrecto.`
        ));
      }, CONNECT_TIMEOUT_MS);

      this._start().catch((err) => this._fail(err));
    });
  }

  async _start() {
    console.log(`Connecting to Chat Room: ID:${this.roomId}`);
    this.clientId = String(crypto.randomInt(100000, 1000000));

    const negotiation = await postJson('/api/v1/realtime/connection', {
      client: { id: this.clientId, type: 'web' },
      capabilities: { accepted_providers: [{ provider: 'pusher' }, { provider: 'centrifugo' }] }
    });
    debug('negociacion:', negotiation);

    this.token = await this._fetchToken();

    // Respuesta real: { data: { connections: [{ provider, credentials: { url } }], mode } }
    const connections = (negotiation && negotiation.data && negotiation.data.connections) || [];
    const centrifugo = connections.find((c) => c && c.provider === 'centrifugo');
    if (connections.length && !centrifugo) {
      throw new Error(`Kick no ofrecio Centrifugo (proveedores: ${connections.map((c) => c.provider).join(', ')}).`);
    }
    let wsUrl = (centrifugo && centrifugo.credentials && centrifugo.credentials.url) || findWsUrl(negotiation);

    if (this.channelId) {
      try {
        const chat = await postJson(`/api/v1/realtime/channels/${this.channelId}/chat/connection`, {
          client_id: this.clientId
        });
        debug('chat/connection:', chat);
        wsUrl = findWsUrl(chat) || wsUrl;
      } catch (e) {
        console.warn(`Kick chat/connection fallo (se continua sin eso): ${e.message}`);
      }
    }

    if (this._closing) return;

    wsUrl = WS_URL_OVERRIDE || wsUrl || DEFAULT_WS_URL;
    if (/pusher/i.test(wsUrl)) {
      throw new Error(`Kick devolvio un endpoint Pusher (${wsUrl}); este cliente solo implementa Centrifugo.`);
    }
    this._openSocket(wsUrl);
  }

  async _fetchToken() {
    const res = await postJson('/api/v1/realtime/auth/connection', { client_id: this.clientId });
    debug('auth/connection:', { ...res, token: '<oculto>', data: res && res.data ? '<oculto>' : undefined });
    const token = findToken(res);
    if (!token) throw new Error('Kick no devolvio un token realtime (respuesta inesperada).');
    return token;
  }

  _openSocket(url) {
    console.log(`Opening websocket: ${url}`);
    try {
      // El servidor realtime rechaza sockets cuyo Origin no sea https://kick.com.
      this.websocket = new WebSocket(url, { headers: { Origin: ORIGIN, 'User-Agent': USER_AGENT } });
    } catch (e) {
      this._fail(e);
      return;
    }

    this.websocket.on('open', () => {
      console.log('WebSocket connected.');
      this._send({ id: this._cmd('connect'), connect: { token: this.token, name: 'js' } });
    });

    this.websocket.on('message', (data) => {
      // Centrifugo puede juntar varios frames JSON separados por salto de linea.
      for (const line of data.toString().split('\n')) {
        if (!line.trim()) continue;
        let frame;
        try {
          frame = JSON.parse(line);
        } catch (e) {
          console.error('Frame no valido recibido de Kick:', e.message);
          continue;
        }
        this._handleFrame(frame);
      }
    });

    this.websocket.on('error', (err) => {
      const msg = err && err.message ? err.message : String(err);
      console.error('WebSocket error:', msg);
      this._fail(/403/.test(msg)
        ? new Error(`${msg} (Kick rechazo el handshake: revisa el header Origin o un bloqueo de Cloudflare)`)
        : err);
    });

    this.websocket.on('close', (code, reason) => {
      console.log(`WebSocket connection closed (code ${code}${reason && reason.length ? `, reason: ${reason.toString()}` : ''}).`);
      clearTimeout(this._refreshTimer);
      if (!this._settled && !this._closing) {
        this._fail(new Error(`La conexion con Kick se cerro antes de confirmar la suscripcion (codigo ${code}).`));
        return;
      }
      this.emit(Events.Disconnected, undefined);
      if (this._settled && !this._closing) {
        this._scheduleReconnect();
      }
    });
  }

  _cmd(type) {
    const id = ++this._seq;
    this._pending.set(id, type);
    return id;
  }

  _send(obj) {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(obj));
    }
  }

  _handleFrame(frame) {
    // Frame vacio = ping del servidor (cada ~25s); hay que contestar con otro vacio.
    if (frame && typeof frame === 'object' && Object.keys(frame).length === 0) {
      this._send({});
      return;
    }

    if (frame.id !== undefined && this._pending.has(frame.id)) {
      const type = this._pending.get(frame.id);
      this._pending.delete(frame.id);

      if (frame.error) {
        const err = new Error(`Kick rechazo "${type}": ${frame.error.code} ${frame.error.message}`);
        if (type === 'refresh') this.emit(Events.Error, err);
        else this._fail(err);
        return;
      }

      if (type === 'connect') {
        const c = frame.connect || {};
        console.log('Kick realtime connection established.');
        if (c.ttl) this._scheduleRefresh(c.ttl);
        this._send({ id: this._cmd('subscribe'), subscribe: { channel: `chatrooms.${this.roomId}.v2` } });
      } else if (type === 'subscribe') {
        this._markSubscribed();
      } else if (type === 'refresh') {
        if (frame.refresh && frame.refresh.ttl) this._scheduleRefresh(frame.refresh.ttl);
      }
      return;
    }

    if (frame.push) {
      this._handlePush(frame.push);
      return;
    }

    if (frame.disconnect) {
      console.error('Kick cerro la sesion realtime:', JSON.stringify(frame.disconnect));
      return;
    }

    debug('frame sin manejar:', frame);
  }

  // Renueva el JWT antes de que venza para que la conexion no se caiga a mitad del sorteo.
  _scheduleRefresh(ttlSeconds) {
    clearTimeout(this._refreshTimer);
    const delay = Math.max(Math.floor(ttlSeconds * 800), 3000);
    this._refreshTimer = setTimeout(async () => {
      try {
        const token = await this._fetchToken();
        this._send({ id: this._cmd('refresh'), refresh: { token } });
      } catch (e) {
        this.emit(Events.Error, e);
      }
    }, delay);
  }

  _markSubscribed() {
    clearTimeout(this._timer);
    console.log(`Subscribed to chatrooms.${this.roomId}.v2`);
    this.emit(Events.Connected, { roomID: this.roomId });
    if (!this._settled) {
      this._settled = true;
      if (this._resolve) this._resolve({ roomID: this.roomId });
    }
  }

  _fail(err) {
    if (this._closing && !this._settled) {
      // Alguien llamo a disconnect() mientras conectabamos: no es un error real.
      this._settled = true;
      clearTimeout(this._timer);
      return;
    }
    if (!this._settled) {
      this._settled = true;
      clearTimeout(this._timer);
      this.disconnect();
      if (this._reject) this._reject(err);
    } else {
      this.emit(Events.Error, err);
    }
  }

  _scheduleReconnect() {
    if (this._closing) return;
    clearTimeout(this._reconnectTimer);
    this._reconnectTimer = setTimeout(async () => {
      if (this._closing) return;
      console.log(`[Kick] Intentando reconectar al chatroom ${this.roomId}...`);
      try {
        await this._start();
      } catch (err) {
        console.error('[Kick] Falló la reconexión:', err.message);
        if (!this._closing) {
          this._scheduleReconnect();
        }
      }
    }, 2500);
  }

  disconnect() {
    clearTimeout(this._timer);
    clearTimeout(this._refreshTimer);
    clearTimeout(this._reconnectTimer);
    this._closing = true;
    if (this.websocket) {
      console.log('Disconnecting WebSocket...');
      try {
        this.websocket.close();
      } catch (e) {
        // ignore
      }
      this.websocket = null;
    }
  }

  _handlePush(push) {
    try {
      const pubs = [];
      if (push.pub) pubs.push(push.pub);
      if (Array.isArray(push.pubs)) pubs.push(...push.pubs);

      if (pubs.length === 0) {
        debug('push sin datos:', push);
        return;
      }

      for (const publication of pubs) {
        const payload = publication.data;
        if (payload === undefined) continue;

        let p = payload;
        if (typeof p === 'string') {
          try {
            p = JSON.parse(p);
          } catch (e) {
            continue;
          }
        }
        if (!p || typeof p !== 'object') continue;

        let eventName = null;
        let data = p;

        if (typeof p.event === 'string') {
          // Mismo sobre que Pusher: { event: "App\\Events\\ChatMessageEvent", data: "<json>" }
          eventName = p.event.split('\\').pop();
          if (typeof p.data === 'string') {
            try {
              data = JSON.parse(p.data);
            } catch (e) {
              data = p.data;
            }
          } else {
            data = p.data;
          }
        } else if (p.sender && p.content !== undefined) {
          // Mensaje de chat publicado sin sobre.
          eventName = 'ChatMessageEvent';
        }

        if (!eventName) {
          debug('publicacion sin evento reconocible:', publication);
          continue;
        }
        this._emitEvent(eventName, data, push);
      }
    } catch (e) {
      this.emit(Events.Error, e);
    }
  }

  _emitEvent(eventName, parsedData, push) {
    switch (eventName) {
      case 'ChatMessageEvent':
        this.emit(Events.ChatMessage, parsedData);
        break;
      case 'MessageDeletedEvent':
        this.emit(Events.MessageDeleted, parsedData);
        break;
      case 'PinnedMessageCreatedEvent':
        this.emit(Events.PinnedMessageCreated, parsedData);
        break;
      case 'PinnedMessageDeletedEvent':
        this.emit(Events.PinnedMessageDeleted, undefined);
        break;
      case 'PollUpdateEvent':
        this.emit(Events.PollUpdate, parsedData);
        break;
      case 'PollDeleteEvent':
        this.emit(Events.PollDelete, undefined);
        break;
      case 'UserBannedEvent':
        this.emit(Events.UserBanned, parsedData);
        break;
      case 'UserUnbannedEvent':
        this.emit(Events.UserUnBanned, parsedData);
        break;
      case 'SubscriptionEvent':
        this.emit(Events.Subscription, parsedData);
        break;
      case 'GiftedSubscriptionsEvent':
        this.emit(Events.GiftedSubscriptions, parsedData);
        break;
      case 'LuckyUsersWhoGotGiftSubscriptionsEvent':
        this.emit(Events.LuckyUsersWhoGotGiftSubscriptions, parsedData);
        break;
      case 'GiftsLeaderboardUpdated':
        this.emit(Events.GiftsLeaderboardUpdated, parsedData);
        break;
      case 'ChatMoveToSupportedChannelEvent':
        this.emit(Events.ChatMoveToSupportedChannel, parsedData);
        break;
      case 'StreamHostEvent':
        this.emit(Events.StreamHost, parsedData);
        break;
      case 'ChatroomClearEvent':
        this.emit(Events.ChatroomClear, parsedData);
        break;
      case 'StopStreamBroadcast':
        this.emit(Events.StreamEnd, { roomId: this.roomId });
        break;
      case 'StreamerIsLive':
        this.emit(Events.StreamerIsLive, parsedData);
        break;
      default:
        debug('evento no mapeado:', eventName, push);
        break;
    }
  }
}

exports.Events = Events;
exports.KickConnection = KickConnection;