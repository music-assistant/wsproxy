'use strict';

const WebSocket = require('ws')
const url = require('url');

function noop() {}

function heartbeat() {
  console.log('received pong from', this.client_ip)
  this.isAlive = true
}

const wss = new WebSocket.Server({ port: 8080 })

console.log("Started Websockets proxy on port 8080")

wss.on('connection', function connection(ws, req) {
  const client_ip = req.socket.remoteAddress;
  const pathname = url.parse(req.url).pathname;
  
  // const client_ip = req.headers['x-forwarded-for'].split(/\s*,\s*/)[0];
  ws.client_ip = client_ip;
  const msg = `new connection from ${client_ip} at path ${pathname}`
  console.log(msg)
  ws.send(msg)

  ws.isAlive = true
  ws.on('pong', heartbeat)
  
  ws.on('message', function incoming(message) {
    console.log(`received message from client ${client_ip}: ${message}`)
    
  })

  ws.on('close', function () {
    console.log(`client disconnected: ${client_ip}`)
    ws.isAlive = false
  });
  
})


// monitor ws clients for disconnections....
const interval = setInterval(function ping() {
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      console.log(`client terminated: ${ws.client_ip}`)
      ws.terminate()
      return
    }
    ws.isAlive = false
    ws.ping(noop)
  })
}, 30000)

wss.on('close', function close(ws) {
  clearInterval(interval)
})

