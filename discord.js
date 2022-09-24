const chat = require('./game').chat;
const { Client } = require('discord.js')
const client = new Client({ intents: ["GuildMessages", "Guilds"] });
require('dotenv/config')
const fs = require('fs')
const WebSocket = require('ws')
let startedUp = false
const config = JSON.parse(fs.readFileSync('config.json', 'utf-8'))
// const guild = config.guild
// const channel = config.channel
// const host = config.host
const wss = new WebSocket.WebSocket('ws://wilcows.mooo.com:5000')

wss.on('open', () => {
    if (startedUp) return
    wss.once('message', packet => {
        wss.send(JSON.stringify(config))
    })
    startedUp = true
})


wss.on('message', packet => {
    const res = JSON.parse(packet)
    chat.emit('discord', res.sender, res.tag, res.message)
})

// client.on('messageCreate', evd => {
//     let prefix = '$';
//     let msg = evd.content;
//     let sender = evd.author;
//     var args = msg.slice(prefix.length).split(' ')
//     var name = msg.slice(prefix.length).split('"')[1]
//     var cmd = args[0]
//     if (msg.startsWith(prefix)) {
//         if (cmd == 'setup') {
//             if (!name) {
//                 evd.reply('no gamertag entered')
//                 return
//             }
//             var data = {
//                 type: 'linkSetup',
//                 guild: evd.guild.id,
//                 channel: evd.channel.id,
//                 host: name
//             }
//             wss.send(JSON.stringify(data))
//             // fs.writeFileSync('database.json', JSON.stringify(database))
//             evd.reply(`Minecraft Chat Link set up in ` + evd.channel.name)
//         }
//     }
//     if (evd.channel.id==channel && sender.id != '958020414683103242') {
//         chat.emit('discord', sender.username, sender.discriminator, msg)
//     }
// })

chat.on('inGame', (sender, msg, host) => {
    var data = {
        type: 'inGameMessage',
        sender: sender,
        message: msg,
        host: host
    }
    // console.log(data.host)
    wss.send(JSON.stringify(data))
})

chat.on('sendData', (sender, msg) => {
    var data = {
        type: 'inGameMessage',
        sender: sender,
        message: msg
    }
})