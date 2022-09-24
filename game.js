const WebSocket = require('ws');
const uuid = require('uuid');
const { EventEmitter } = require('stream');
const chat = new EventEmitter();
const fs = require('fs')
exports.chat = chat;
const port = 6000; //port to host websocket on
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
const host = config.config.host
//local ip address is localhost. connect in game with /connect localhost:PORT. replace PORT with port specified in code
console.log(`\nlistening on port: ${port}\n`);
const wss = new WebSocket.WebSocketServer({ port: port });

wss.on('connection', socket => {
    console.log('\nMinecraft connection successful');
    //Tell Minecraft to send all chat messages. Required once when Minecraft starts
    socket.send(JSON.stringify({
        "header": {
            "version": 1,                     // Use version 1 message protocol
            "requestId": uuid.v4(),           // A unique ID for the request
            "messageType": "commandRequest",  // This is a request ...
            "messagePurpose": "subscribe"     // ... to subscribe to ...
        },
        "body": {
            "eventName": "PlayerMessage"
        }
    }));

    // // When MineCraft sends a message (e.g. on player chat), act on it.
    socket.on('message', packet => {
        const res = JSON.parse(packet);
        if ((res.header.eventName == 'PlayerMessage' && res.body.type == 'chat')) {
            let sender = res.body.sender;
            let msg = res.body.message;
            chat.emit('inGame', sender, msg, host)
            console.log(`[In Game] ${sender}: ${msg}`)
        }
        else if (res.body.statusMessage) {
            let status = res.body.statusMessage
            chat.emit('inGame', 'Server', status, host)
        }
    });
    chat.on('discord', (sender, tag, msg) => {
        if (msg.startsWith(config.config.prefix)) {
            socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),     // Send unique ID each time
                    "messagePurpose": "commandRequest",
                    "messageType": "commandRequest"
                },
                "body": {
                    "commandLine": msg.slice(config.config.prefix.length)
                }
            }))
            console.log(`${sender}#${tag} executed command: ${msg}`)
        }
        else {
            console.log(`[Discord] ${sender}#${tag}: ${msg}`)
            socket.send(JSON.stringify({
                "header": {
                    "version": 1,
                    "requestId": uuid.v4(),     // Send unique ID each time
                    "messagePurpose": "commandRequest",
                    "messageType": "commandRequest"
                },
                "body": {
                    "commandLine": `tellraw @a {"rawtext":[{"text":"§8[§9Discord§8] §7${sender}#${tag}: §f${msg}"}]}`
                }
            }))
        }
    })
});