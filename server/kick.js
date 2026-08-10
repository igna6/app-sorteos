'use strict';

const WebSocket = require('ws');
const events = require('events');

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

class KickConnection extends events.EventEmitter {
  constructor(roomId) {
    super();
    this.roomId = roomId;
    this.websocket = null;
  }

  async connect() {
    try {
      return new Promise((resolve, reject) => {
        console.log(`Connecting to Chat Room: ID:${this.roomId}`);
        
        // Pusher App Key for Kick
        const PUSHER_KEY = '32cbd69e4b950bf97679';
        
        this.websocket = new WebSocket(`wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0-rc2&flash=false`);

        this.websocket.on("open", () => {
          console.log("WebSocket connected.");
          
          const subscribeMsg = {
            event: "pusher:subscribe",
            data: { channel: `chatrooms.${this.roomId}.v2` }
          };
          
          this.websocket.send(JSON.stringify(subscribeMsg));

          this.emit(Events.Connected, { roomID: this.roomId });
          resolve({ roomID: this.roomId });
        });

        this.websocket.on("message", (data) => {
          this.handleMessage(JSON.parse(data.toString()));
        });

        this.websocket.on("error", (err) => {
          this.emit(Events.Error, err);
          reject(err);
        });

        this.websocket.on("close", () => {
          console.log("WebSocket connection closed.");
          this.emit(Events.Disconnected, undefined);
        });
      });
    } catch (e) {
      this.emit(Events.Error, e);
      return { roomID: "" };
    }
  }

  disconnect() {
    if (this.websocket) {
      console.log("Disconnecting WebSocket...");
      this.websocket.close();
      this.websocket = null;
    }
  }

  handleMessage(msg) {
    try {
      const { data, event } = msg;
      const parsedData = typeof data === "string" ? JSON.parse(data) : data;
      
      const eventName = event.split("\\")[2];
      if (!eventName) return;

      switch (eventName) {
        case "ChatMessageEvent":
          this.emit(Events.ChatMessage, parsedData);
          break;
        case "MessageDeletedEvent":
          this.emit(Events.MessageDeleted, parsedData);
          break;
        case "PinnedMessageCreatedEvent":
          this.emit(Events.PinnedMessageCreated, parsedData);
          break;
        case "PinnedMessageDeletedEvent":
          this.emit(Events.PinnedMessageDeleted, undefined);
          break;
        case "PollUpdateEvent":
          this.emit(Events.PollUpdate, parsedData);
          break;
        case "PollDeleteEvent":
          this.emit(Events.PollDelete, undefined);
          break;
        case "UserBannedEvent":
          this.emit(Events.UserBanned, parsedData);
          break;
        case "UserUnbannedEvent":
          this.emit(Events.UserUnBanned, parsedData);
          break;
        case "SubscriptionEvent":
          this.emit(Events.Subscription, parsedData);
          break;
        case "GiftedSubscriptionsEvent":
          this.emit(Events.GiftedSubscriptions, parsedData);
          break;
        case "LuckyUsersWhoGotGiftSubscriptionsEvent":
          this.emit(Events.LuckyUsersWhoGotGiftSubscriptions, parsedData);
          break;
        case "GiftsLeaderboardUpdated":
          this.emit(Events.GiftsLeaderboardUpdated, parsedData);
          break;
        case "ChatMoveToSupportedChannelEvent":
          this.emit(Events.ChatMoveToSupportedChannel, parsedData);
          break;
        case "StreamHostEvent":
          this.emit(Events.StreamHost, parsedData);
          break;
        case "ChatroomClearEvent":
          this.emit(Events.ChatroomClear, parsedData);
          break;
        case "StopStreamBroadcast":
          this.emit(Events.StreamEnd, { roomId: this.roomId });
          break;
        case "StreamerIsLive":
          this.emit(Events.StreamerIsLive, parsedData);
          break;
        default:
          break;
      }
    } catch (e) {
      this.emit(Events.Error, e);
    }
  }
}

exports.Events = Events;
exports.KickConnection = KickConnection;
