const WebSocket = require('ws');

const chatroomId = 3;
const ws = new WebSocket('wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false');

ws.on('open', () => {
    console.log('Connected to Pusher');
    ws.send(JSON.stringify({
        event: 'pusher:subscribe',
        data: { auth: '', channel: `chatrooms.${chatroomId}.v2` }
    }));
});

ws.on('message', (data) => {
    try {
        const parsed = JSON.parse(data);
        if (parsed.event === 'App\\Events\\ChatMessageEvent') {
            const messageData = JSON.parse(parsed.data);
            if (messageData.sender && messageData.sender.identity && messageData.sender.identity.badges) {
                console.log(`User: ${messageData.sender.username}`);
                console.log(`Badges:`, messageData.sender.identity.badges.map(b => b.type));
                console.log('---');
            }
        }
    } catch (e) {
        // ignore
    }
});
